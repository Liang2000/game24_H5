import Phaser from 'phaser';
import { addButton, addText, COLORS } from '../ui';
import { faceLabel } from '../../core/game';

const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const SELECTED_FILL = 0xc8e6c9; // 选中淡绿
const RESULT_COLS = 3;
const LINE_H = 42;
const TOP_PAD = 16; // 首行与结果区顶部的间距

export class ComboScene extends Phaser.Scene {
  private solvable: number[][] = [];
  private selected: number[] = [];
  private cardRects = new Map<number, Phaser.GameObjects.Rectangle>();
  private listContainer!: Phaser.GameObjects.Container;
  private resultHeader!: Phaser.GameObjects.Text;
  private viewportTop = 0;
  private viewportBottom = 0;
  private viewportW = 0;
  private maxScroll = 0;

  constructor() {
    super('Combo');
  }

  create(): void {
    this.solvable = [];
    this.selected = [];
    this.cardRects.clear();
    const W = this.scale.width;
    const H = this.scale.height;

    addButton(this, 70, 44, 100, 48, '返回', () => this.scene.start('Menu'), { fontSize: '22px' });
    addText(this, W / 2, 44, '可解组合速查', { fontSize: '40px', color: COLORS.white, fontStyle: 'bold' });
    addText(this, W / 2, 92, '点选 1–4 张牌，查看同时含所选牌面的可解组合', {
      fontSize: '22px',
      color: COLORS.muted,
    });

    // 13 张牌面卡片 + 1 个【清空】，共 14 个瓦片，按 7 列 × 2 行排列
    const cardW = 74;
    const cardH = 96;
    const cols = 7;
    const gapX = 14;
    const gapY = 16;
    const gridTotal = cardW * cols + gapX * (cols - 1);
    const gridStartX = (W - gridTotal) / 2 + cardW / 2;
    const row0Y = 168;
    const row1Y = row0Y + cardH + gapY;

    VALUES.forEach((v, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gridStartX + col * (cardW + gapX);
      const y = row === 0 ? row0Y : row1Y;
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
      tile.on('pointerup', () => this.toggle(v));
      this.cardRects.set(v, rect);
    });

    // 【清空】按钮占第二行末位（col=6, row=1）
    const clearX = gridStartX + (cols - 1) * (cardW + gapX);
    addButton(this, clearX, row1Y, cardW, cardH, '清空', () => this.clearSelection(), { fontSize: '24px' });

    // 结果标题（下移到第二行卡片下方，避免被 J/Q/K 遮挡）
    this.resultHeader = addText(this, W / 2, 366, '请选择一张牌', {
      fontSize: '24px',
      color: COLORS.white,
      fontStyle: 'bold',
    });

    // 可滚动结果区
    this.viewportTop = 400;
    this.viewportBottom = H - 40;
    const viewportH = this.viewportBottom - this.viewportTop;
    const viewportCenterY = (this.viewportTop + this.viewportBottom) / 2;
    this.viewportW = W - 80;

    this.add
      .rectangle(W / 2, viewportCenterY, this.viewportW, viewportH, COLORS.panel, 1)
      .setStrokeStyle(2, COLORS.panelBorder);

    const maskShape = this.add
      .rectangle(W / 2, viewportCenterY, this.viewportW, viewportH, 0xffffff, 1)
      .setVisible(false);
    const mask = maskShape.createGeometryMask();

    this.listContainer = this.add.container(W / 2, this.viewportTop);
    this.listContainer.setMask(mask);

    // 滚轮 + 拖拽滚动
    const drag = { active: false, startY: 0, startScrollY: 0 };
    this.add
      .zone(W / 2, viewportCenterY, this.viewportW, viewportH)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (p: Phaser.Input.Pointer) => {
        drag.active = true;
        drag.startY = p.y;
        drag.startScrollY = this.listContainer.y;
      });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!drag.active) return;
      this.scrollTo(drag.startScrollY + (p.y - drag.startY));
    });
    this.input.on('pointerup', () => {
      drag.active = false;
    });
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      this.scrollTo(this.listContainer.y - dy);
    });

    this.loadCombos();
  }

  private async loadCombos(): Promise<void> {
    try {
      const res = await fetch('./combos.json');
      const data = (await res.json()) as number[][];
      this.solvable = data;
      this.resultHeader.setText('数据已就绪，请选择一张牌');
    } catch {
      this.solvable = [];
      this.resultHeader.setText('数据加载失败');
    }
  }

  private toggle(v: number): void {
    if (this.selected.includes(v)) {
      this.selected = this.selected.filter((x) => x !== v);
    } else if (this.selected.length < 4) {
      this.selected = [...this.selected, v].sort((a, b) => a - b);
    }
    this.refreshCards();
    this.applyFilter();
  }

  private clearSelection(): void {
    this.selected = [];
    this.refreshCards();
    this.applyFilter();
  }

  private refreshCards(): void {
    for (const [v, rect] of this.cardRects) {
      rect.setFillStyle(this.selected.includes(v) ? SELECTED_FILL : COLORS.card);
    }
  }

  private applyFilter(): void {
    this.listContainer.removeAll(true);
    if (this.selected.length === 0) {
      this.resultHeader.setText('请选择一张牌');
      this.maxScroll = 0;
      return;
    }

    const list = this.solvable.filter((c) => this.selected.every((v) => c.includes(v)));
    this.resultHeader.setText(
      `含 ${this.selected.map(faceLabel).join(' · ')} 的可解组合（${list.length}）`,
    );

    const rows = Math.ceil(list.length / RESULT_COLS);
    const colW = this.viewportW / RESULT_COLS;

    if (list.length === 0) {
      const empty = addText(this, 0, TOP_PAD, '（无）', { fontSize: '24px', color: COLORS.muted });
      empty.setOrigin(0.5, 0);
      this.listContainer.add(empty);
    } else {
      list.forEach((combo, i) => {
        const col = i % RESULT_COLS;
        const row = Math.floor(i / RESULT_COLS);
        const x = (col - (RESULT_COLS - 1) / 2) * colW; // -colW, 0, +colW
        const y = row * LINE_H + TOP_PAD;
        const text = addText(this, x, y, combo.map(faceLabel).join(' · '), {
          fontSize: '24px',
          color: COLORS.white,
        });
        text.setOrigin(0.5, 0);
        this.listContainer.add(text);
      });
    }

    this.listContainer.y = this.viewportTop;
    this.maxScroll = Math.max(0, rows * LINE_H + TOP_PAD - (this.viewportBottom - this.viewportTop));
  }

  private scrollTo(y: number): void {
    const minY = this.viewportTop - this.maxScroll;
    const maxY = this.viewportTop;
    this.listContainer.y = Phaser.Math.Clamp(y, minY, maxY);
  }
}
