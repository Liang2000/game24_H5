// 精确有理数：以分子/分母整数表示，全程整数运算，避免浮点误差。
// 数值域很小（1–13 四个数最多做三次四则运算），number 型整数足够精确（远小于 2^53）。

export interface Rational {
  num: number;
  den: number;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function normalize(num: number, den: number): Rational {
  if (den === 0) {
    throw new Error('division by zero');
  }
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den) || 1;
  return { num: num / g, den: den / g };
}

export const rat = (n: number, d = 1): Rational => normalize(n, d);

export const add = (a: Rational, b: Rational): Rational =>
  normalize(a.num * b.den + b.num * a.den, a.den * b.den);

export const sub = (a: Rational, b: Rational): Rational =>
  normalize(a.num * b.den - b.num * a.den, a.den * b.den);

export const mul = (a: Rational, b: Rational): Rational =>
  normalize(a.num * b.num, a.den * b.den);

export const div = (a: Rational, b: Rational): Rational =>
  normalize(a.num * b.den, a.den * b.num);

export const eq = (a: Rational, b: Rational): boolean =>
  a.num === b.num && a.den === b.den;

export const isZero = (a: Rational): boolean => a.num === 0;

export const toString = (a: Rational): string =>
  a.den === 1 ? String(a.num) : `${a.num}/${a.den}`;
