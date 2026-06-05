---
name: audit-findings-jun2026
description: First redundancy audit findings (June 2026) — status, priority, and notes
metadata:
  type: project
---

## Audit Date: 2026-06-05

## High Priority
- **Auth + user lookup trinity** — `auth()` + `prisma.user.findFirst({ where: { id: session?.user?.id } })` repeated 3x in user-actions.ts (L100-106, L130-132, L156-158). Candidate for a `getSessionUser()` helper. `getUserById` exists but isn't reused here.
- **`formatError` uses `any` type** — L27 in lib/utils.ts has explicit eslint-disable. Candidate for `unknown` + type narrowing.

## Medium Priority
- **Admin list page shell** — orders/page.tsx, products/page.tsx, users/page.tsx all share: requireAdmin, searchText filter banner, Table wrapper, DeleteDialog, Pagination. ~70 lines of structural duplication.
- **MainNav component fully duplicated** — app/admin/main-nav.tsx and app/user/main-nav.tsx are identical except the `links` array. Both 40 lines.
- **AdminLayout vs UserLayout** — Nearly identical header shell (logo, MainNav, Menu). Differ only by AdminSearch presence.
- **`useTransition` + toast pattern** — addItemToCart / removeItemFromCart handlers in add-to-cart.tsx and cart-table.tsx share identical shape. MarkAsPaidButton and MarkAsDeliveredButton inside order-details-table.tsx are inline components doing the same thing.
- **Order table rows** — user/orders/page.tsx and admin/orders/page.tsx render near-identical table rows (id, date, total, paid, delivered columns).
- **signUpDefaultValues bug** — sign-up-form.tsx L43 uses `signUpDefaultValues.email` instead of `signUpDefaultValues.name` for the Name field defaultValue.

## Low Priority
- **`converToPlainObject`** — defined in lib/utils.ts but never used in the source (only in generated/seed files). Dead code.
- **Pagination bug** — components/shared/pagination.tsx L14: `useSearchParams` is referenced but not called (missing `()`). Should be `const searchParams = useSearchParams()`.
- **`console.log(summary)`** — admin/overview/page.tsx L28, leftover debug log.
- **search/page.tsx dead return** — L54-56: unreachable `return { title: "Search" }` after `return` on L50.

## Status
- All findings: not yet acted on (first audit)
