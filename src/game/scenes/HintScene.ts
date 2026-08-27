import Phaser from 'phaser';
import { addButton, addText, COLORS } from '../ui';
import { faceLabel } from '../../core/game';
import { solve } from '../../core/solver';

const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

export class HintScene extends Phaser.Scene {
  private selected: number[] = [];
  private boxTexts: Phaser.GameObjects.Text[] = [];
  private resultText!: Phaser.GameObjects.Text;

  constructor() {
    super('Hint');
  }

  create(): void {
    this.selected = [];
    const W = this.scale.width;

    addButton(this, 70, 44, 100, 48, '返回', () => this.scene.start('Menu'), { fontSize: '22px' });
    addText(this, W / 2, 44, '24 点提示', { fontSize: '40px', color: COLORS.white, fontStyle: 'bold' });
    addText(this, W / 2, 92, '选择 4 张牌，点【提示】查看解法（可重复）', {
      fontSize: '22px',
      color: COLORS.muted,
    });

    // 4 个数字框
    this.boxTexts = [];
    const boxSize = 96;
    const boxGap = 20;
    const boxTotal = boxSize * 4 + boxGap * 3;
    const boxStartX = (W - boxTotal) / 2 + boxSize / 2;
    const boxY = 180;
    for (let i = 0; i < 4; i++) {
      const x = boxStartX + i * (boxSize + boxGap);
      const box = this.add.container(x, boxY);
      const rect = this.add
        .rectangle(0, 0, boxSize, boxSize, COLORS.panel, 1)
        .setStrokeStyle(2, COLORS.panelBorder);
      const txt = addText(this, 0, 0, '', { fontSize: '38px', color: COLORS.white, fontStyle: 'bold' });
      box.add([rect, txt]);
      box.setSize(boxSize, boxSize);
      box.setInteractive({ useHandCursor: true });
      const idx = i;
      box.on('pointerup', () => this.clearBox(idx));
      this.boxTexts.push(txt);
    }

    // 13 张可选卡片
    const cardW = 74;
    const cardH = 96;
    const cols = 5;
    const gapX = 14;
    const gapY = 18;
    const gridTotal = cardW * cols + gapX * (cols - 1);
    const gridStartX = (W - gridTotal) / 2 + cardW / 2;
    const gridY = 340;
    VALUES.forEach((v, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gridStartX + col * (cardW + gapX);
      const y = gridY + row * (cardH + gapY);
      const tile = this.add.container(x, y);
      const rect = this.add.rectangle(0, 0, cardW, cardH, COLORS.card, 1).setStrokeStyle(2, 0xd8d8e8);
      const label = addText(this, 0, 0, faceLabel(v), {
        fontSize: '30px',
        color: COLORS.black,
        fontStyle: 'bold',
      });
      tile.add([rect, label]);
      tile.setSize(cardW, cardH);
      tile.setInteractive({ useHandCursor: true });
      tile.on('pointerup', () => this.pick(v));
    });

    // 操作按钮
    addButton(this, W / 2 - 130, 720, 220, 72, '提示', () => this.showSolutions(), {
      fill: 0x1f6e54,
      fontSize: '30px',
    });
    addButton(this, W / 2 + 130, 720, 220, 72, '清空', () => this.clearAll(), {
      fontSize: '30px',
    });

    this.resultText = addText(this, W / 2, 790, '', {
      fontSize: '18px',
      color: COLORS.white,
      wordWrap: { width: W - 80 },
      align: 'left',
      lineSpacing: 2,
    }).setOrigin(0.5, 0);
  }

  private pick(v: number): void {
    if (this.selected.length >= 4) return;
    // 大小王各限选一张
    if (v >= 14 && this.selected.includes(v)) return;
    this.selected.push(v);
    this.updateBoxes();
  }

  private clearBox(idx: number): void {
    if (idx < 0 || idx >= this.selected.length) return;
    this.selected.splice(idx, 1);
    this.updateBoxes();
  }

  private clearAll(): void {
    this.selected = [];
    this.updateBoxes();
  }

  private updateBoxes(): void {
    for (let i = 0; i < 4; i++) {
      this.boxTexts[i].setText(i < this.selected.length ? faceLabel(this.selected[i]) : '');
    }
    this.resultText.setText('');
  }

  private showSolutions(): void {
    if (this.selected.length !== 4) {
      this.resultText.setText('请先选择 4 张牌');
      return;
    }
    const sols = solve(this.selected);
    if (sols.length === 0) {
      this.resultText.setText('无解');
      return;
    }
    this.resultText.setText(sols.map((s, i) => `${i + 1}. ${s} = 24`).join('\n'));
  }
}
