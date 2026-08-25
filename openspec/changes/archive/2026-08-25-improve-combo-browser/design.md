## Context

改动全部落在 `src/game/scenes/ComboScene.ts`，涉及卡片布局、选择状态与结果渲染三处。现有实现要点：

- 卡片用 5 列网格布局 13 张牌，结果标题固定在 `y=438`，结果区从 `y=480` 开始。
- 选择模型是「点即过滤」，无多选、无选中态、无清空。
- 结果在 `listContainer` 内单栏垂直排列，容器原点在 `(W/2, viewportTop)`，文本默认水平居中，导致过宽时左右越出遮罩边界。

数据与求解器不变（`combos.json`、`isSolvable` 均不受影响）。动机见 proposal.md - Why。

## Goals / Non-Goals

**Goals:**
- 卡片改为 7 列 × 2 行（13 张牌 + 第 14 格【清空】），消除提示文字被 J/Q/K 遮挡。
- 结果三栏展示，首栏留边界间距，缩短滚动距离。
- 多选并列过滤：最多 4 张、AND 关系、选中淡绿高亮、可再点取消、可一键清空。

**Non-Goals:**
- 不改 `public/combos.json`、求解器、主菜单入口、单人挑战与提示两模块。
- 不做 OR（或）关系、不做排除（NOT）过滤。
- 不做结果分页/虚拟化（列表最多 1362 项，现容器已可承受）。

## Decisions

1. **卡片网格：7 列 × 2 行，第 14 格为【清空】**
   - 13 张牌（A–K）与【清空】共 14 个瓦片，按 7 列排列：第 1 行 7 张牌，第 2 行 6 张牌 +【清空】。
   - 【清空】复用 `addButton`，视觉与牌卡区分；`cardW=74`、`gapX=14` 时总宽 602，适配 720 画布。
   - 结果标题 `resultHeader` 下移到第 2 行卡片下方（约 `y≈350`），确保「数据已就绪」不被遮挡。
   - 备选：保持 5 列 3 行但上移标题——被否，因为 3 行更高，遮挡问题更严重。

2. **选择模型：`selected: number[]` + toggle + 上限 4**
   - 点未选卡片且 `selected.length < 4` → 加入；再点已选卡片 → 移出（toggle）；`length === 4` 时点第 5 张 → 忽略。
   - 选中态用淡绿底色（如 `0xc8e6c9`）重绘瓦片矩形，未选中恢复 `COLORS.card`。
   - 备选：纯「只加不 toggle、靠【清空】重置」——被否，缺少单张撤销，体验差。

3. **过滤逻辑：`selected.every(v => combo.includes(v))`**
   - 从单值 `includes(v)` 改为对全部已选值取 AND；`selected` 为空时保持「数据已就绪/请选择」提示态。

4. **结果三栏渲染**
   - 列宽 = `viewportW / 3`，三列中心相对容器原点取 `-colW`、`0`、`+colW`，首列左缘留 ≥ 1 个 `gapX` 边距，避免越出遮罩左边界。
   - 第 `i` 项放在 `col = i % 3`、`row = floor(i / 3)`，行高 `lineH` 不变；`maxScroll` 按 `ceil(count / 3) * lineH` 计算。
   - 最大组合串「K · K · K · K」在 24px 下约 143px，远小于列宽 ~213px，不会截断。

## Risks / Trade-offs

- [三栏下文本仍可能拥挤] → 列宽 213px 覆盖最宽组合，字体保持 24px；若未来加「显示解法」等更宽文本，再降字号或换 2 栏。
- [选中态与【清空】交互一致性] → toggle 已入 spec；【清空】幂等，重复点击无副作用。
- [布局改动误伤提示模块] → 仅改 `ComboScene`，不动 `HintScene`/`ChallengeScene`，回归以 `npm test` + `npm run build` 兜底。

## Migration Plan

- 前端静态改动，无后端/数据迁移。
- 发布：`npm run build` 后按既有流程将 `dist/` 上传至 `/var/www/game24`（tar over SSH）。

## Open Questions

（无——toggle、第 5 张忽略、清空幂等均已在 spec/design 中定案。）
