import Phaser from 'phaser';
import { addButton, addText, COLORS } from '../ui';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;

    addText(this, W / 2, H * 0.22, '24 点', {
      fontSize: '110px',
      color: COLORS.white,
      fontStyle: 'bold',
    });
    addText(this, W / 2, H * 0.31, '益智小游戏 · 用四张牌凑出 24', {
      fontSize: '26px',
      color: COLORS.muted,
    });

    addButton(this, W / 2, H * 0.48, 440, 100, '单人挑战', () => this.scene.start('Challenge'), {
      fontSize: '34px',
    });
    addButton(this, W / 2, H * 0.60, 440, 100, '24 点提示', () => this.scene.start('Hint'), {
      fontSize: '34px',
    });
  }
}
