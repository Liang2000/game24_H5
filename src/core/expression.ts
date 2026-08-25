import { rat, add, sub, mul, div, eq, isZero } from './rational';
import type { Rational } from './rational';
import type { Expr, Op } from './expr';

export interface ValidationResult {
  ok: boolean;
  value?: Rational;
  error?: string;
}

type Token =
  | { type: 'num'; value: number }
  | { type: 'op'; op: Op }
  | { type: 'lparen' }
  | { type: 'rparen' };

function normalize(input: string): string {
  return input
    .replace(/[＋]/g, '+')
    .replace(/[－−–—]/g, '-')
    .replace(/[×✕✖]/g, '*')
    .replace(/[÷∕]/g, '/')
    .replace(/[（]/g, '(')
    .replace(/[）]/g, ')')
    .replace(/\s+/g, '');
}

function tokenize(s: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c >= '0' && c <= '9') {
      let j = i;
      while (j < s.length && s[j] >= '0' && s[j] <= '9') j++;
      tokens.push({ type: 'num', value: parseInt(s.slice(i, j), 10) });
      i = j;
    } else if (c === '(') {
      tokens.push({ type: 'lparen' });
      i++;
    } else if (c === ')') {
      tokens.push({ type: 'rparen' });
      i++;
    } else if (c === '+' || c === '-' || c === '*' || c === '/') {
      tokens.push({ type: 'op', op: c });
      i++;
    } else {
      throw new Error(`非法字符: ${c}`);
    }
  }
  return tokens;
}

function parse(tokens: Token[]): Expr {
  let pos = 0;
  const current = (): Token | undefined => tokens[pos];

  const parseExpr = (): Expr => {
    let left = parseTerm();
    for (;;) {
      const t = current();
      if (t?.type === 'op' && (t.op === '+' || t.op === '-')) {
        pos++;
        left = { kind: 'op', op: t.op, left, right: parseTerm() };
      } else {
        break;
      }
    }
    return left;
  };

  const parseTerm = (): Expr => {
    let left = parseFactor();
    for (;;) {
      const t = current();
      if (t?.type === 'op' && (t.op === '*' || t.op === '/')) {
        pos++;
        left = { kind: 'op', op: t.op, left, right: parseFactor() };
      } else {
        break;
      }
    }
    return left;
  };

  const parseFactor = (): Expr => {
    const t = current();
    if (!t) throw new Error('表达式不完整');
    if (t.type === 'num') {
      pos++;
      return { kind: 'num', value: t.value };
    }
    if (t.type === 'lparen') {
      pos++;
      const e = parseExpr();
      if (current()?.type !== 'rparen') throw new Error('缺少右括号');
      pos++;
      return e;
    }
    throw new Error('意外的符号');
  };

  const expr = parseExpr();
  if (pos !== tokens.length) throw new Error('表达式存在多余内容');
  return expr;
}

function evalExpr(e: Expr): Rational {
  if (e.kind === 'num') return rat(e.value);
  const l = evalExpr(e.left);
  const r = evalExpr(e.right);
  switch (e.op) {
    case '+':
      return add(l, r);
    case '-':
      return sub(l, r);
    case '*':
      return mul(l, r);
    case '/':
      if (isZero(r)) throw new Error('除数不能为 0');
      return div(l, r);
  }
}

function leaves(e: Expr): number[] {
  if (e.kind === 'num') return [e.value];
  return [...leaves(e.left), ...leaves(e.right)];
}

// 校验玩家输入的表达式：仅用给定数字各一次、运算合法、结果恰为 24。
export function validateExpression(input: string, values: number[]): ValidationResult {
  try {
    const norm = normalize(input);
    if (norm.length === 0) return { ok: false, error: '表达式为空' };

    const expr = parse(tokenize(norm));

    const used = leaves(expr).sort((a, b) => a - b);
    const expected = [...values].sort((a, b) => a - b);
    if (used.length !== expected.length || used.some((v, i) => v !== expected[i])) {
      return { ok: false, error: '必须且仅使用给定的 4 个数字各一次' };
    }

    const value = evalExpr(expr);
    if (!eq(value, rat(24))) {
      return { ok: false, error: '结果不等于 24' };
    }

    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '表达式不合法' };
  }
}
