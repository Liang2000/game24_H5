import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { ChallengeScene } from './scenes/ChallengeScene';
import { HintScene } from './scenes/HintScene';
import { ComboScene } from './scenes/ComboScene';

// 单页 H5：纵向 720×1280，Phaser 自适应缩放居中。
export const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 720,
    height: 1280,
  },
  scene: [MenuScene, ChallengeScene, HintScene, ComboScene],
};
