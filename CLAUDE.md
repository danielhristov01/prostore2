# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## About Me

I'm a junior developer actively learning modern web development. I am focused on learning the fundamentals of next.js, react, typescript, prisma, neon.

## How to Help Me

- Explain the "why" behind suggestions, not just the "what" — especially around architectural choices, patterns, and tradeoffs
- When introducing a concept I may not know (e.g., RSC boundaries, caching strategies, DB indexing, SSR, ISR, handling states, prop drilling, lifting states, react hooks), briefly explain it before using it
- Flag anti-patterns or footguns even if I didn't ask — I'd rather learn than ship bad code
- Suggest better approaches when you see them, but be direct about tradeoffs (performance, complexity, maintainability)
- Don't over-engineer: prefer the simplest solution that fits, and call out when I'm overcomplicating things
- Point out relevant docs or official sources when useful, so I can dig deeper on my own

## Communication Style

- Always challenge my assumptions. I'd rather be corrected, instead of you agreeing to everything
- Be blunt. Skip pleasantries, hedging, and softening language — no "great question," "you're right," or apologies. Push back hard when I'm wrong; prioritize correct, working solutions over protecting my feelings.


## When to check docs
- if asked about prisma - always relate to prisma v7. **IMPORTANT** Prisma v7 has breaking changes compared to v6. Always check relevant documentation before answering
- if asked about next auth - always check relevant documentation about next auth in the official next-auth website. This lib is rapidly changing, especially in the past 3 months.

<!-- ## When asked for details

- Be as detailed as possible
- Check official documentation and provide a summary of what it says
- Propose up to 3 solutions
- Assume I am juniour and learning how to code. Explain as to a such -->

## Stack

- Next.js **16.2.4** with App Router (`app/` directory) — predates most training data
- React **19.2.4**
- Tailwind CSS **v4** via `@tailwindcss/postcss` (note: v4 has a different config model than v3)
- TypeScript with strict mode and `@/*` path alias mapped to repo root

## Commands

- `npm run dev` — start dev server on http://localhost:3000
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next`)

There is no test setup in this project.

## Before writing Next.js code

Per `AGENTS.md`: this is Next.js 16, which has breaking changes from the versions in your training data. Before touching routing, data fetching, caching, server components, server actions, middleware, or config, consult the relevant guide under `node_modules/next/dist/docs/` (organized as `01-app/`, `02-pages/`, `03-architecture/`, `04-community/`).
