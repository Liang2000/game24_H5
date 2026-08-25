import Phaser from 'phaser';
import { faceLabel } from '../core/game';
import type { Card } from '../core/game';

export const COLORS = {
  bg: 0x1a1a2e,
  panel: 0x242440,
  panelBorder: 0x3a3a66,
  accent: 0x7ee0ff,
  white: '#ffffff',
  muted: '#a0a0b8',
  good: '#6ee7a0',
  bad: '#ff7b9c',
  card: 0xffffff,
  red: '#ff6b8a',
  black: '#1a1a2e',
};

export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  str: string,
  style: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, str, {
      fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
      ...style,
    })
    .setOrigin(0.5, 0.5);
}

export function addButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onClick: () => void,
  style: { fill?: number; labelColor?: string; fontSize?: string } = {},
): Phaser.GameObjects.Container {
  const fill = style.fill ?? 0x2a2a4a;
  const labelColor = style.labelColor ?? COLORS.white;
  const fontSize = style.fontSize ?? '28px';
  const c = scene.add.container(x, y);
  const rect = scene.add.rectangle(0, 0, w, h, fill, 1).setStrokeStyle(2, COLORS.accent);
  const text = addText(scene, 0, 0, label, { fontSize, color: labelColor, fontStyle: 'bold' });
  c.add([rect, text]);
  rect.setInteractive({ useHandCursor: true });
  rect.on('pointerdown', () => rect.setFillStyle(0x3a3a5a));
  rect.on('pointerout', () => rect.setFillStyle(fill));
  rect.on('pointerup', () => {
    rect.setFillStyle(fill);
    onClick();
  });
  return c;
}

export function addCard(
  scene: Phaser.Scene,
  x: number,
  y: number,
  card: Card,
): Phaser.GameObjects.Container {
  const w = 96;
  const h = 132;
  const c = scene.add.container(x, y);
  const isRed = card.suit === '♥' || card.suit === '♦';
  const color = isRed ? COLORS.red : COLORS.black;
  const rect = scene.add.rectangle(0, 0, w, h, COLORS.card, 1).setStrokeStyle(2, 0xd8d8e8);
  const valueText = addText(scene, 0, -h * 0.24, faceLabel(card.value), {
    fontSize: '34px',
    color,
    fontStyle: 'bold',
  });
  const suitText = addText(scene, 0, h * 0.16, card.suit, { fontSize: '44px', color });
  c.add([rect, valueText, suitText]);
  c.setSize(w, h);
  return c;
}
