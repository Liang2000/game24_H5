import { describe, expect, it } from 'vitest';
import { validateExpression } from './expression';

describe('validateExpression', () => {
  it('accepts a correct expression', () => {
    expect(validateExpression('3*8*(9-8)', [3, 8, 8, 9]).ok).toBe(true);
  });

  it('accepts full-width operators and parens', () => {
    expect(validateExpression('3×8×（9−8）', [3, 8, 8, 9]).ok).toBe(true);
  });

  it('rejects using the wrong numbers', () => {
    expect(validateExpression('3*8*(9-8)', [3, 8, 8, 7]).ok).toBe(false);
  });

  it('rejects division by zero', () => {
    expect(validateExpression('1/(2-2)*3', [1, 2, 2, 3]).ok).toBe(false);
  });

  it('rejects a wrong result', () => {
    expect(validateExpression('3+8+8+9', [3, 8, 8, 9]).ok).toBe(false);
  });
});
