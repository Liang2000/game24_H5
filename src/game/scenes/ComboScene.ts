import Phaser from 'phaser';
import { addButton, addText, COLORS } from '../ui';
import { faceLabel } from '../../core/game';

const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export class ComboScene extends Phaser.Scene {
  private solvable: number[][] = [];
  private listContainer!: Phaser.GameObjects.Container;
  private resultHeader!: Phaser.GameObjects.Text;
  private viewportTop = 0;
  private viewportBottom = 0;
  private maxScroll = 0;

  constructor() {
    super('Combo');
  }

  create(): void {
    this.solvable = [];
    const W = this.scale.width;
    const H = this.scale.height;

    addButton(this, 70, 44, 100, 48, '返回', () => this.scene.start('Menu'), { fontSize: '22px' });
    addText(this, W / 2, 44, '可解组合速查', { fontSize: '40px', color: COLORS.white, fontStyle: 'bold' });
    addText(this, W / 2, 92, '点一张牌，查看所有含该牌面的可解组合', { fontSize: '22px', color: COLORS.muted });

    // 13 张牌面卡片
    const cardW = 74;
    const cardH = 96;
    const cols = 5;
    const gapX = 14;
    const gapY = 16;
    const gridTotal = cardW * cols + gapX * (cols - 1);
    const gridStartX = (W - gridTotal) / 2 + cardW / 2;
    const gridStartY = 170;
    VALUES.forEach((v, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gridStartX + col * (cardW + gapX);
      const y = gridStartY + row * (cardH + gapY);
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
      tile.on('pointerup', () => this.filterBy(v));
    });

    // 结果标题
    this.resultHeader = addText(this, W / 2, 438, '请选择一张牌', {
      fontSize: '24px',
      color: COLORS.white,
      fontStyle: 'bold',
    });

    // 可滚动结果区
    this.viewportTop = 480;
    this.viewportBottom = H - 40;
    const viewportH = this.viewportBottom - this.viewportTop;
    const viewportCenterY = (this.viewportTop + this.viewportBottom) / 2;
    const viewportW = W - 80;

    this.add
      .rectangle(W / 2, viewportCenterY, viewportW, viewportH, COLORS.panel, 1)
      .setStrokeStyle(2, COLORS.panelBorder);

    const maskShape = this.add
      .rectangle(W / 2, viewportCenterY, viewportW, viewportH, 0xffffff, 1)
      .setVisible(false);
    const mask = maskShape.createGeometryMask();

    this.listContainer = this.add.container(W / 2, this.viewportTop);
    this.listContainer.setMask(mask);

    // 滚轮 + 拖拽滚动
    const drag = { active: false, startY: 0, startScrollY: 0 };
    this.add
      .zone(W / 2, viewportCenterY, viewportW, viewportH)
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

  private filterBy(v: number): void {
    this.listContainer.removeAll(true);
    const list = this.solvable.filter((c) => c.includes(v));
    this.resultHeader.setText(`含 ${faceLabel(v)} 的可解组合（${list.length}）`);
    let y = 0;
    const lineH = 42;
    if (list.length === 0) {
      this.listContainer.add(addText(this, 0, 0, '（无）', { fontSize: '24px', color: COLORS.muted }));
    } else {
      for (const combo of list) {
        this.listContainer.add(
          addText(this, 0, y, combo.map(faceLabel).join(' · '), { fontSize: '24px', color: COLORS.white }),
        );
        y += lineH;
      }
    }
    this.listContainer.y = this.viewportTop;
    this.maxScroll = Math.max(0, y - (this.viewportBottom - this.viewportTop));
  }

  private scrollTo(y: number): void {
    const minY = this.viewportTop - this.maxScroll;
    const maxY = this.viewportTop;
    this.listContainer.y = Phaser.Math.Clamp(y, minY, maxY);
  }
}
