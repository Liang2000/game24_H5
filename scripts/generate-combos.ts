// 离线枚举 24 点可解组合：1≤i≤j≤k≤l≤13 的非降序 4 张牌组合，
// 用求解器判定是否可解，把可解组合写成 public/combos.json（静态资产）。
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isSolvable } from '../src/core/solver';

const MIN = 1;
const MAX = 13;

const solvable: number[][] = [];
let total = 0;

for (let i = MIN; i <= MAX; i++) {
  for (let j = i; j <= MAX; j++) {
    for (let k = j; k <= MAX; k++) {
      for (let l = k; l <= MAX; l++) {
        total += 1;
        const combo = [i, j, k, l];
        if (isSolvable(combo)) {
          solvable.push(combo);
        }
      }
    }
  }
}

// 自检：已知可解 [1,1,3,8] 应在结果中，已知无解 [1,1,1,1] 应被排除。
const set = new Set(solvable.map((c) => c.join(',')));
if (total !== 1820) throw new Error(`自检失败：枚举总数应为 1820，实际 ${total}`);
if (!set.has('1,1,3,8')) throw new Error('自检失败：1,1,3,8 应为可解组合');
if (set.has('1,1,1,1')) throw new Error('自检失败：1,1,1,1 应为无解组合');

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'public', 'combos.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(solvable, null, 2) + '\n');

console.log(`枚举组合总数: ${total}`);
console.log(`可解组合数: ${solvable.length}`);
console.log(`已写入: ${outPath}`);
