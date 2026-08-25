export type Op = '+' | '-' | '*' | '/';

export type Expr =
  | { kind: 'num'; value: number }
  | { kind: 'op'; op: Op; left: Expr; right: Expr };

const OPS: Record<Op, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

function flatten(e: Expr, op: '+' | '*'): Expr[] {
  if (e.kind === 'op' && e.op === op) {
    return [...flatten(e.left, op), ...flatten(e.right, op)];
  }
  return [e];
}

// 操作数排序：数字（按数值升序）在前，复合子表达式按字符串在后。
function cmpOperand(a: Expr, b: Expr): number {
  const aNum = a.kind === 'num';
  const bNum = b.kind === 'num';
  if (aNum && bNum) return a.value - b.value;
  if (aNum !== bNum) return aNum ? -1 : 1;
  return render(a, 0, false).localeCompare(render(b, 0, false));
}

function wrap(body: string, p: number, parentPrec: number, isRight: boolean): string {
  if (p < parentPrec) return `(${body})`;
  if (p === parentPrec && isRight) return `(${body})`;
  return body;
}

function render(e: Expr, parentPrec: number, isRight: boolean): string {
  if (e.kind === 'num') return String(e.value);

  const p = OPS[e.op];
  let body: string;

  if (e.op === '+' || e.op === '*') {
    const parts = flatten(e, e.op).sort(cmpOperand);
    const sep = e.op === '+' ? ' + ' : ' * ';
    body = parts.map((x) => render(x, p, true)).join(sep);
  } else {
    body = render(e.left, p, false) + ' ' + e.op + ' ' + render(e.right, p, true);
  }

  return wrap(body, p, parentPrec, isRight);
}

// 规范化表达式字符串：扁平化 + 与 × 的结合、对交换律排序。
// 在「本质不同」等价类下唯一，同时用作去重键、排序键与展示串。
export function format(e: Expr): string {
  return render(e, 0, false);
}
