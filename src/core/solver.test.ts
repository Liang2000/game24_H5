import { describe, expect, it } from 'vitest';
import { isSolvable, solve } from './solver';

describe('solver', () => {
  it('finds all essentially-different solutions for 3,8,8,9', () => {
    // README 的 3 条只是示例（「多种解法」非全部）；按「运算符/结构不同即不同」共有 7 条。
    const expected = [
      '3 * (8 / (9 - 8))',
      '3 * (9 - 8 / 8)',
      '3 * 8 * (9 - 8)',
      '3 * 8 / (9 - 8)',
      '3 / ((9 - 8) / 8)',
      '8 * (3 / (9 - 8))',
      '8 / ((9 - 8) / 3)',
    ];
    expect([...solve([3, 8, 8, 9])].sort()).toEqual([...expected].sort());
  });

  it('returns solutions in ascending order', () => {
    const got = solve([1, 2, 3, 4]);
    expect(got).toEqual([...got].sort());
  });

  it('finds the trivial 1*2*3*4 solution', () => {
    expect(solve([1, 2, 3, 4])).toContain('1 * 2 * 3 * 4');
  });

  it('judges 1,1,1,1 unsolvable', () => {
    expect(isSolvable([1, 1, 1, 1])).toBe(false);
  });

  it('caps output at 20 solutions', () => {
    expect(solve([1, 2, 3, 4]).length).toBeLessThanOrEqual(20);
  });
});
