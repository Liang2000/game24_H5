// 游戏领域逻辑（与 UI 无关）：牌组、抽题、计分、高光时刻存储。

export type Suit = '♠' | '♥' | '♣' | '♦';

export interface Card {
  value: number; // 1–13
  suit: Suit;
}

export interface Hand {
  cards: Card[];
  values: number[];
}

export const SUITS: Suit[] = ['♠', '♥', '♣', '♦'];

export const FACE_LABELS: Record<number, string> = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'V',
  15: 'W',
};

export function faceLabel(value: number): string {
  return FACE_LABELS[value] ?? String(value);
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let v = 1; v <= 13; v++) {
      deck.push({ value: v, suit });
    }
  }
  return deck;
}

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 从标准 52 张牌组抽 4 张（花色仅装饰，计算只看 values）。
export function drawHand(
  deck: Card[] = createDeck(),
  rng: () => number = Math.random,
): Hand {
  const cards = shuffle(deck, rng).slice(0, 4);
  return { cards, values: cards.map((c) => c.value) };
}

// 计分
export type HandResult = 'correct' | 'wrong' | 'skip';

export const applyScore = (score: number, result: HandResult): number => {
  if (result === 'correct') return score + 1;
  if (result === 'wrong') return score - 1;
  return score;
};

export const PASS_SCORE = 8;
export const HANDS_PER_LEVEL = 10;

export const hasPassed = (score: number): boolean => score >= PASS_SCORE;

// 高光时刻（localStorage）
export interface HighlightRecord {
  timestamp: number;
  level: number;
  score: number;
  passed: boolean;
  durationMs: number;
}

const STORAGE_KEY = 'game24_highlights';

export function loadHighlights(): HighlightRecord[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HighlightRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveHighlight(record: HighlightRecord): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const list = loadHighlights();
    list.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-50)));
  } catch {
    // localStorage 不可用时静默失败
  }
}
