import { describe, expect, it } from 'vitest';
import {
  applyScore,
  createDeck,
  drawHand,
  faceLabel,
  hasPassed,
} from './game';

describe('deck', () => {
  it('has 52 cards, 4 of each value', () => {
    const deck = createDeck();
    expect(deck.length).toBe(52);
    const counts = new Array(14).fill(0);
    deck.forEach((c) => counts[c.value]++);
    for (let v = 1; v <= 13; v++) expect(counts[v]).toBe(4);
  });

  it('draws 4 valid cards', () => {
    const hand = drawHand(createDeck(), () => 0.5);
    expect(hand.cards.length).toBe(4);
    expect(hand.values.length).toBe(4);
    hand.values.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(13);
    });
  });
});

describe('faceLabel', () => {
  it('maps A/J/Q/K and plain numbers', () => {
    expect(faceLabel(1)).toBe('A');
    expect(faceLabel(11)).toBe('J');
    expect(faceLabel(12)).toBe('Q');
    expect(faceLabel(13)).toBe('K');
    expect(faceLabel(14)).toBe('V');
    expect(faceLabel(15)).toBe('W');
    expect(faceLabel(7)).toBe('7');
  });
});

describe('scoring', () => {
  it('applies +1 / 0 / -1', () => {
    expect(applyScore(0, 'correct')).toBe(1);
    expect(applyScore(0, 'skip')).toBe(0);
    expect(applyScore(0, 'wrong')).toBe(-1);
  });

  it('passes at score >= 8', () => {
    expect(hasPassed(8)).toBe(true);
    expect(hasPassed(7)).toBe(false);
  });
});
