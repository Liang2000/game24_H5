## 1. 牌面标签与可选卡片

- [x] 1.1 在 `src/core/game.ts` 的 `FACE_LABELS` 中新增 `14: 'V'`、`15: 'W'`；验证 `faceLabel(14) === 'V'` 且 `faceLabel(15) === 'W'`
- [x] 1.2 将 `src/game/scenes/HintScene.ts` 的 `VALUES` 扩展为 `[1..15]`（A–K 之后追加 14、15）；验证界面出现 15 张卡片且 V、W 位于 J、Q、K 之后

## 2. 大小王限选一张

- [x] 2.1 在 `HintScene.pick(v)` 中，当 `v >= 14` 且 `selected` 已含 `v` 时忽略本次点击；验证连续点击 V 两次仅填入一个 V，清空该框后可重新点选

## 3. 文档与测试

- [x] 3.1 更新 `CONTEXT.md`，补充小王（V=14）、大王（W=15）的牌面数值术语；验证新增术语与既有牌面数值条目格式一致
- [x] 3.2 在 `src/core/game.test.ts` 中为 `faceLabel` 补充 14→V、15→W 断言；验证 `npm test` 全部通过
- [x] 3.3 运行 `npm run build` 与 `npm test`；验证无类型错误、测试全绿，且布局在 720×1280 下不重叠（`npm run dev` 目测）
