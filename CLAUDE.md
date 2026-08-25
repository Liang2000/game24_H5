# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

24 点 (24-point) puzzle game, built with Phaser 3 + TypeScript + Vite. The executable specification lives across: `README.md` (product description), `CONTEXT.md` (domain glossary), and `openspec/specs/` (OpenSpec canonical specs — `game-core`, `solver`, `solo-challenge`, `hint`, `highlights`).

## Tech stack (resolved)

**Phaser 3 + TypeScript + Vite**, deployed as an H5 web app via Nginx and run in the browser — matches `README.md` and the repo name `game24_H5`. The tech stack is recorded in `openspec/config.yaml` (the spec previously described a Python/PySide6 desktop `.exe`).

- Local storage: browser `localStorage` for score records (高光时刻).
- Solver: exact rational arithmetic using an integer numerator/denominator fraction type — do **not** use Python's `fractions.Fraction`; the arithmetic approach is stack-independent, only the rational-number representation changes.

## Domain vocabulary (authoritative: `CONTEXT.md`)

`CONTEXT.md` is the source of truth for naming. Use its terms exactly, including the `_Avoid:_` list (e.g. never "牌堆" for deck, "牌值/点数" for face value, "题/组" for a hand, "轮/局" for a level). Key terms:

- **Deck (牌组)** — standard 52-card deck; suits are decorative only.
- **Face value (牌面数值)** — A=1, J=11, Q=12, K=13, else the card's number.
- **Hand (题目)** — the 4 drawn cards' numbers to compute with.
- **Solution (解法)** — an expression using all 4 numbers exactly once, `+ − × ÷` and parentheses, equal to exactly 24. Intermediate fractions/negatives allowed; divisor ≠ 0.
- **Unsolvable (无解)** — no solution exists for a hand.
- **Level (关卡)** — a unit of 10 hands.
- **Pass (过关)** — score ≥ 8 within a level.
- **Highlights (高光时刻)** — locally saved score records.

## Game rules (two modules)

1. **单人挑战 (Solo challenge)** — each level is 10 hands shown one at a time. Scoring: +1 correct (including correctly judging "无解"), 0 skip, −1 wrong (score may go negative). Reaching ≥ 8 passes the level immediately. Player submits an expression (【提交】) or claims no-solution (【无解】). A 【跳过】 button is provided per the skip scoring rule (see `openspec/specs/solo-challenge`). 【高光时刻】 shows saved records.
2. **24 点提示 (Hint)** — 4 number boxes; player picks from 13 cards (A, 2–10, J, Q, K), repeats allowed, click a filled box to clear it; 【提示】 lists solutions.

## Solver requirements (`openspec/specs/solver`)

- Exact rational arithmetic, never floating point.
- Judge solvability of any 4 numbers (drives the "无解" verdict).
- List only "essentially different" solutions: expressions differing solely by commutativity/associativity of `+`/`×` collapse to one; different operators or structure are distinct. Cap output at 20 solutions.
- Expression validation accepts `+ − × ÷` and parentheses, compatible with `* /` and full-width symbols; must use the 4 given values each exactly once and equal 24.

## Docs conventions

- **Issue tracker** (`docs/agents/issue-tracker.md`): issues and specs live in GitHub; drive them with the `gh` CLI (`gh issue create/view/list/comment/edit/close`, repo inferred from `git remote -v`). GitHub shares one number space across issues and PRs, so a bare `#42` may be either.
- **Domain docs** (`docs/agents/domain.md`): before exploring, read `CONTEXT.md` (or `CONTEXT-MAP.md` if present) and `docs/adr/` (does not exist yet); use the glossary's vocabulary in all output; if your output contradicts an ADR, flag it explicitly rather than silently overriding.
