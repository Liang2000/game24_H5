## Context

- 现有求解器 `src/core/solver.ts` 提供 `isSolvable(values)`（精确有理数、无浮点）与 `solve(values)`；纯 TS、无 Phaser 依赖。
- 现有场景：`MenuScene`（主菜单，两个按钮 → Challenge/Hint）、`ChallengeScene`、`HintScene`；UI 助手在 `src/game/ui.ts`（`addButton`/`addText`/`addCard`/`COLORS`），牌面映射 `faceLabel` 在 `src/core/game.ts`。
- 部署为纯静态 H5（nginx），无后端、无服务器状态。见 proposal.md - Why。

## Goals / Non-Goals

**Goals:**
- 离线枚举 1–13 全部非降序 4 张牌组合（1820 组），用 `isSolvable` 判定可解，产出静态 `combos.json`。
- 提供按单张牌面过滤展示的界面（A–K 13 张卡片），主菜单可进入。
- 复用求解器与现有 UI 助手，不改动现有模块行为。

**Non-Goals:**
- 不引入后端 API / 数据库；结果集是静态 JSON 资产。
- 不为每个组合展示具体解法表达式——界面只展示「组合」（4 个牌面数值）。
- 不修改现有 `solver`/`solo-challenge`/`hint` 的行为。

## Decisions

1. **静态 JSON 资产（用户已确认）**：结果集生成为 `public/combos.json`，Vite 构建时复制进 `dist/`，由 nginx 随应用静态发布，运行时 `fetch('/combos.json')` 加载。备选（后端 API）因项目纯静态且结果集固定而放弃。

2. **枚举方式**：四重循环 `1 ≤ i ≤ j ≤ k ≤ l ≤ 13` 生成非降序组合（自然去重，共 C(16,4)=1820 组），逐个调用 `isSolvable([i,j,k,l])`。备选（递归/排列枚举后去重）更复杂且无收益。

3. **数据格式**：`combos.json` 为扁平数组，每项是 4 个非降序数值，如 `[[1,1,3,8],[1,1,4,6],...]`；界面按 `combo.includes(selectedValue)` 过滤。数据集规模小（约千级），逐次线性过滤足够；无需预建倒排索引。

4. **生成脚本复用求解器**：新增 `scripts/generate-combos.ts`，`import { isSolvable } from '../src/core/solver'`，经 `tsx` 执行；新增 npm 脚本 `generate:combos`。备选（在脚本内重写最小判定逻辑）有重复实现风险，放弃。

5. **新场景**：新增 `ComboScene`，从 `MenuScene` 增加第三个入口进入；13 张卡片复用 `faceLabel`，结果列表用可滚动容器承载，避免某牌面（如 8/9）组合过多溢出屏幕。

## Risks / Trade-offs

- [生成文件漂移 / 与脚本不同步] → 脚本确定、可重跑；提交 `combos.json` 并在 README 或脚本注释记录再生成命令。
- [结果列表过长溢出] → 用可滚动容器；必要时后续加分页。
- [Node 侧导入求解器] → `solver.ts` 无 Phaser 依赖、纯 TS，经 `tsx` 可正常导入；实现时验证。
- [数据集体积] → 仅含可解组合的 4 元组，体积远小于全量解法，静态加载无压力。

## Migration Plan

1. 实现生成脚本并运行，产出并提交 `public/combos.json`。
2. 新增 `ComboScene` 与菜单入口；`fetch('/combos.json')` 加载。
3. 部署：`combos.json` 随 `dist/` 发布到 nginx，无需数据/后端迁移。
4. 回滚：移除新场景、菜单入口与资产文件即可，无状态需迁移。
