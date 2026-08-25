import Phaser from 'phaser';
import { addButton, addCard, addText, COLORS } from '../ui';
import type { Hand } from '../../core/game';
import {
  applyScore,
  drawHand,
  hasPassed,
  HANDS_PER_LEVEL,
  loadHighlights,
  PASS_SCORE,
  saveHighlight,
} from '../../core/game';
import { isSolvable } from '../../core/solver';
import { validateExpression } from '../../core/expression';

type HandResult = 'correct' | 'wrong' | 'skip';

// 算式的一个片段：运算符/括号/键盘数字的 cardIndex 为 null，点牌插值的记录牌下标。
interface Segment {
  text: string;
  cardIndex: number | null;
}

export class ChallengeScene extends Phaser.Scene {
  private level = 1;
  private score = 0;
  private handIndex = 0;
  private segments: Segment[] = [];
  private hand!: Hand;
  private levelStart = Date.now();
  private busy = false;

  private scoreText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private exprText!: Phaser.GameObjects.Text;
  private cards: Phaser.GameObjects.Container[] = [];
  private overlay!: Phaser.GameObjects.Container;

  constructor() {
    super('Challenge');
  }

  create(): void {
    this.level = 1;
    this.score = 0;
    this.handIndex = 0;
    this.segments = [];
    this.levelStart = Date.now();
    this.busy = false;

    const W = this.scale.width;
    const H = this.scale.height;

    addButton(this, 70, 44, 100, 48, '返回', () => this.scene.start('Menu'), { fontSize: '22px' });
    addText(this, W / 2, 44, '单人挑战', { fontSize: '40px', color: COLORS.white, fontStyle: 'bold' });

    this.scoreText = addText(this, W / 2, 96, '', { fontSize: '26px', color: '#7ee0ff' });
    this.messageText = addText(this, W / 2, 136, '', { fontSize: '26px', color: COLORS.white });

    // 算式面板
    const panelY = 210;
    this.add.rectangle(W / 2, panelY, W - 80, 90, COLORS.panel, 1).setStrokeStyle(2, COLORS.panelBorder);
    addText(this, W / 2, panelY - 36, '输入算式（使用 4 张牌各一次，可加括号）', {
      fontSize: '20px',
      color: COLORS.muted,
    });
    this.exprText = addText(this, W / 2, panelY, '', { fontSize: '32px', color: COLORS.white });

    // 运算符键盘（两行）
    const opY1 = 470;
    const opY2 = 560;
    const opW = 130;
    const opH = 72;
    const row1 = [
      { label: '+', ch: '+' },
      { label: '-', ch: '-' },
      { label: '×', ch: '*' },
      { label: '÷', ch: '/' },
    ];
    const row2 = [
      { label: '(', ch: '(' },
      { label: ')', ch: ')' },
      { label: '⌫', ch: '⌫' },
      { label: '清空', ch: 'C' },
    ];
    row1.forEach((o, i) => {
      addButton(this, this.opX(i, W, opW), opY1, opW, opH, o.label, () => this.appendChar(o.ch), {
        fontSize: '30px',
      });
    });
    row2.forEach((o, i) => {
      addButton(this, this.opX(i, W, opW), opY2, opW, opH, o.label, () => this.handleOp(o.ch), {
        fontSize: '26px',
      });
    });

    // 操作按钮
    const btnY = 700;
    const btnW = 250;
    const btnH = 72;
    addButton(this, W / 2 - 135, btnY, btnW, btnH, '提交', () => this.submit(), {
      fill: 0x1f6e54,
      fontSize: '30px',
    });
    addButton(this, W / 2 + 135, btnY, btnW, btnH, '无解', () => this.judgeNoSolution(), {
      fill: 0x6e2a1f,
      fontSize: '30px',
    });
    addButton(this, W / 2 - 135, btnY + 90, btnW, btnH, '跳过', () => this.skipHand(), {
      fontSize: '26px',
    });
    addButton(this, W / 2 + 135, btnY + 90, btnW, btnH, '高光时刻', () => this.showHighlights(), {
      fontSize: '24px',
    });

    // 键盘输入（桌面端快捷）
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => this.onKey(event));

    // 覆盖层（过关 / 失败 / 高光时刻）
    this.overlay = this.add.container(W / 2, H / 2).setDepth(10).setVisible(false);

    this.newHand();
  }

  private opX(i: number, W: number, opW: number): number {
    const gap = 24;
    const total = opW * 4 + gap * 3;
    const start = (W - total) / 2 + opW / 2;
    return start + i * (opW + gap);
  }

  private newHand(): void {
    this.hand = drawHand();
    this.segments = [];
    this.messageText.setText('');
    this.renderCards();
    this.refreshHud();
  }

  private renderCards(): void {
    this.cards.forEach((c) => c.destroy());
    this.cards = [];
    const W = this.scale.width;
    const cardW = 96;
    const cardH = 132;
    const gap = 20;
    const total = cardW * 4 + gap * 3;
    const startX = (W - total) / 2 + cardW / 2;
    const y = 330;

    this.hand.cards.forEach((card, i) => {
      const c = addCard(this, startX + i * (cardW + gap), y, card);
      c.setSize(cardW, cardH);
      c.setInteractive({ useHandCursor: true });
      const idx = i;
      c.on('pointerup', () => this.appendCard(idx));
      this.cards.push(c);
    });

    this.updateCardVisuals();
  }

  private refreshHud(): void {
    this.scoreText.setText(
      `第 ${this.level} 关 · 得分 ${this.score} · 第 ${this.handIndex + 1}/${HANDS_PER_LEVEL} 题`,
    );
    this.exprText.setText(this.exprString().length === 0 ? '——' : this.exprString());
  }

  private exprString(): string {
    return this.segments.map((s) => s.text).join('');
  }

  private usedCardMask(): boolean[] {
    const used = [false, false, false, false];
    for (const s of this.segments) {
      if (s.cardIndex !== null) used[s.cardIndex] = true;
    }
    return used;
  }

  private updateCardVisuals(): void {
    const used = this.usedCardMask();
    this.cards.forEach((c, i) => c.setAlpha(used[i] ? 0.35 : 1));
  }

  private appendChar(ch: string): void {
    if (this.busy) return;
    this.segments.push({ text: ch, cardIndex: null });
    this.refreshInput();
  }

  private appendCard(idx: number): void {
    if (this.busy) return;
    if (this.usedCardMask()[idx]) return; // 每张牌只能用一次
    this.segments.push({ text: String(this.hand.cards[idx].value), cardIndex: idx });
    this.refreshInput();
  }

  private backspace(): void {
    if (this.busy) return;
    this.segments.pop();
    this.refreshInput();
  }

  private clearExpr(): void {
    if (this.busy) return;
    this.segments = [];
    this.refreshInput();
  }

  private refreshInput(): void {
    const expr = this.exprString();
    this.exprText.setText(expr.length === 0 ? '——' : expr);
    this.updateCardVisuals();
  }

  private handleOp(ch: string): void {
    if (ch === '⌫') {
      this.backspace();
    } else if (ch === 'C') {
      this.clearExpr();
    } else {
      this.appendChar(ch);
    }
  }

  private onKey(event: KeyboardEvent): void {
    if (event.key >= '0' && event.key <= '9') this.appendChar(event.key);
    else if (event.key === '+') this.appendChar('+');
    else if (event.key === '-') this.appendChar('-');
    else if (event.key === '*') this.appendChar('*');
    else if (event.key === '/') this.appendChar('/');
    else if (event.key === '(') this.appendChar('(');
    else if (event.key === ')') this.appendChar(')');
    else if (event.key === 'Backspace') this.backspace();
    else if (event.key === 'Enter') this.submit();
    else if (event.key === 'c' || event.key === 'C') this.clearExpr();
  }

  private submit(): void {
    if (this.busy) return;
    const res = validateExpression(this.exprString(), this.hand.values);
    if (res.ok) {
      this.showMessage('你太棒了，完全正确。');
      this.advanceAfterDelay('correct');
    } else {
      this.showMessage('很遗憾，你的算法出错！');
      this.advanceAfterDelay('wrong');
    }
  }

  private judgeNoSolution(): void {
    if (this.busy) return;
    if (!isSolvable(this.hand.values)) {
      this.showMessage('你太棒了，完全正确。');
      this.advanceAfterDelay('correct');
    } else {
      this.showMessage('很遗憾，你的算法出错！');
      this.advanceAfterDelay('wrong');
    }
  }

  private skipHand(): void {
    if (this.busy) return;
    this.showMessage('已跳过');
    this.advanceAfterDelay('skip');
  }

  private showMessage(msg: string): void {
    this.messageText.setText(msg);
  }

  private advanceAfterDelay(result: HandResult): void {
    this.busy = true;
    this.time.delayedCall(1000, () => {
      this.busy = false;
      this.finishHand(result);
    });
  }

  private finishHand(result: HandResult): void {
    this.score = applyScore(this.score, result);
    this.handIndex += 1;
    this.refreshHud();

    if (hasPassed(this.score)) {
      this.passLevel();
    } else if (this.handIndex >= HANDS_PER_LEVEL) {
      this.failLevel();
    } else {
      this.newHand();
    }
  }

  private passLevel(): void {
    const durationMs = Date.now() - this.levelStart;
    saveHighlight({
      timestamp: Date.now(),
      level: this.level,
      score: this.score,
      passed: true,
      durationMs,
    });
    this.showOverlay('过关！', `本关得分 ${this.score}`, '下一关', () => {
      this.level += 1;
      this.score = 0;
      this.handIndex = 0;
      this.levelStart = Date.now();
      this.newHand();
    });
  }

  private failLevel(): void {
    const durationMs = Date.now() - this.levelStart;
    saveHighlight({
      timestamp: Date.now(),
      level: this.level,
      score: this.score,
      passed: false,
      durationMs,
    });
    this.showOverlay('闯关失败', `本关得分 ${this.score}（过关需 ≥ ${PASS_SCORE}）`, '重玩本关', () => {
      this.score = 0;
      this.handIndex = 0;
      this.levelStart = Date.now();
      this.newHand();
    });
  }

  private showHighlights(): void {
    const list = loadHighlights();
    const body =
      list.length === 0
        ? '暂无记录'
        : list
            .slice(-10)
            .reverse()
            .map((r) => {
              const d = new Date(r.timestamp);
              const time = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(
                2,
                '0',
              )}:${String(d.getMinutes()).padStart(2, '0')}`;
              return `第 ${r.level} 关 · 得分 ${r.score} · ${r.passed ? '过关' : '失败'} · ${time}`;
            })
            .join('\n');
    this.showOverlay('高光时刻', body, '关闭', () => {});
  }

  private showOverlay(title: string, body: string, buttonLabel: string, onButton: () => void): void {
    const W = this.scale.width;
    const H = this.scale.height;
    this.overlay.removeAll(true);
    const dim = this.add.rectangle(0, 0, W + 4, H + 4, 0x000000, 0.72);
    const panel = this.add.rectangle(0, 0, W - 120, 420, COLORS.panel, 1).setStrokeStyle(2, COLORS.accent);
    const titleText = addText(this, 0, -150, title, { fontSize: '44px', color: COLORS.white, fontStyle: 'bold' });
    const bodyText = addText(this, 0, -10, body, {
      fontSize: '24px',
      color: COLORS.muted,
      wordWrap: { width: W - 200 },
      align: 'center',
    });
    const btn = addButton(this, 0, 150, 260, 72, buttonLabel, () => {
      this.overlay.setVisible(false);
      onButton();
    });
    this.overlay.add([dim, panel, titleText, bodyText, btn]);
    this.overlay.setVisible(true);
  }
}
