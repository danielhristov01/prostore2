---
name: codebase-architecture
description: Stack, module layout, and key existing abstractions for pro_store
metadata:
  type: project
---

## Stack
- Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, Prisma v7, NextAuth
- No test suite

## Module Layout
- `lib/actions/` — all server actions (cart.action.ts, order.action.ts, product.actions.ts, review.actions.ts, user-actions.ts)
- `lib/utils.ts` — all shared helpers: cn, formatError, formatCurrency, formatDateTime, formatId, round2, mapProduct, mapCart, mapOrder, mapOrderItem, formUrlQuery, converToPlainObject
- `lib/validators.ts` — all Zod schemas in one file
- `lib/constants/index.ts` — all app constants
- `lib/auth.guard.ts` — requireAdmin() guard (calls auth(), redirects to /unauthorized)
- `types/index.ts` — all TypeScript types derived from Zod schemas
- `components/shared/` — shared UI components (DeleteDialog, Pagination, product/, header/)
- `components/admin/product-form.tsx` — shared create/update product form

## Key Existing Abstractions
- `requireAdmin()` in lib/auth.guard.ts — used in all admin pages
- `mapProduct`, `mapCart`, `mapOrder`, `mapOrderItem` — Prisma Decimal-to-string converters in lib/utils.ts
- `formatError(error)` — unified Zod + Prisma error formatter in lib/utils.ts (uses `any` type, has eslint-disable comment)
- `DeleteDialog` — reusable delete confirmation component, action injected as prop
- `Pagination` — reusable pagination, has bug: `useSearchParams` not called (missing parentheses on line 14)
- `{ success: boolean, message: string }` — standard return shape from all server actions

## Auth Pattern
- `auth()` called 9 times across action files — not all are guarded, some just read session
- `prisma.user.findFirst({ where: { id: session?.user?.id } })` repeated 3x in user-actions.ts (lines 102, 131, 157) — candidate for helper
- `getUserById(userId)` exists in user-actions.ts but is only used in order.action.ts — not reused within user-actions itself

## Conventions
- Arrow functions everywhere in components; `export function` used in lib/utils.ts (mixed, not a violation per project rules since standards say arrow functions "only" for components)
- All server actions in lib/actions/[feature].ts
- `'use server'` at top of all action files
- `'use client'` on all forms and interactive components
