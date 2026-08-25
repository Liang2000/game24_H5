## 1. 数据生成

- [x] 1.1 新增 `scripts/generate-combos.ts`，四重循环枚举 1≤i≤j≤k≤l≤13 的非降序组合并调用 `isSolvable`，把可解组合写成 `public/combos.json`（扁平数组，每项 4 个非降序数值）。验证：脚本枚举共 1820 组；产物 `combos.json` 存在，每条含 4 个 1–13 的非降序值；抽验含已知可解 [1,1,3,8] 且不含无解 [1,1,1,1]。
- [x] 1.2 新增 dev 依赖 `tsx` 与 npm 脚本 `generate:combos`。验证：`npm run generate:combos` 成功执行并（重新）生成 `public/combos.json`。

## 2. 场景与入口

- [x] 2.1 新增 `ComboScene`：`fetch('/combos.json')` 加载数据，渲染 13 张 A–K 牌面卡片（复用 `faceLabel`），点击后过滤展示所有含该牌面数值的组合，结果区用可滚动容器。验证：浏览器中进入该场景，点 Q 显示所有含 12 的可解组合，点其他牌面列表随之切换。
- [x] 2.2 在 `MenuScene` 增加第三个入口按钮，跳转到 `ComboScene`。验证：主菜单出现该入口，点击进入组合速查界面。

## 3. 集成与发布

- [x] 3.1 将 `ComboScene` 注册进 `src/game/config.ts` 的场景列表。验证：`npm run build` 通过，且 `dist/combos.json` 存在。
- [x] 3.2 运行 `npm test` 与 `npm run build` 全量回归。验证：现有测试全部通过、构建无 TS 错误，单人挑战与提示两模块行为不变。
