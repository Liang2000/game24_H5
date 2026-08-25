import { Rational, rat, add, sub, mul, div, eq, isZero } from './rational';
import { format } from './expr';
import type { Expr, Op } from './expr';

interface Item {
  val: Rational;
  expr: Expr;
}

function opNode(op: Op, left: Expr, right: Expr): Expr {
  return { kind: 'op', op, left, right };
}

const TARGET = rat(24);

// 求解：返回所有「本质不同」解（去重后升序），上限 20 条。
export function solve(values: number[]): string[] {
  const seen = new Set<string>();
  const items: Item[] = values.map((v) => ({
    val: rat(v),
    expr: { kind: 'num', value: v },
  }));

  const search = (list: Item[]): void => {
    if (list.length === 1) {
      if (eq(list[0].val, TARGET)) {
        seen.add(format(list[0].expr));
      }
      return;
    }

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const rest = list.filter((_, k) => k !== i && k !== j);
        const a = list[i];
        const b = list[j];

        const next: Item[] = [
          { val: add(a.val, b.val), expr: opNode('+', a.expr, b.expr) },
          { val: mul(a.val, b.val), expr: opNode('*', a.expr, b.expr) },
          { val: sub(a.val, b.val), expr: opNode('-', a.expr, b.expr) },
          { val: sub(b.val, a.val), expr: opNode('-', b.expr, a.expr) },
        ];
        if (!isZero(b.val)) {
          next.push({ val: div(a.val, b.val), expr: opNode('/', a.expr, b.expr) });
        }
        if (!isZero(a.val)) {
          next.push({ val: div(b.val, a.val), expr: opNode('/', b.expr, a.expr) });
        }

        for (const n of next) {
          search([...rest, n]);
        }
      }
    }
  };

  search(items);
  return [...seen].sort().slice(0, 20);
}

// 是否可解（用于「无解」判定）。
export function isSolvable(values: number[]): boolean {
  return solve(values).length > 0;
}
