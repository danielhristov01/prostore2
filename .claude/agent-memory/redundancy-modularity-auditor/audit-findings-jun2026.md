---
name: audit-findings-jun2026
description: Redundancy audit findings (June 2026, second pass) — status, priority, and notes
metadata:
  type: project
---

## Audit Date: 2026-06-05 (second pass — same session, confirming all prior findings still open)

## High Priority
- **Auth + user lookup trinity** — `auth()` + `prisma.user.findFirst({ where: { id: session?.user?.id } })` repeated 3x in user-actions.ts (L100-106, L130-132, L156-158). Candidate for a `getSessionUser()` helper. `getUserById` exists but isn't reused here. STATUS: still open.
- **`formatError` uses `any` type** — L27 in lib/utils.ts has explicit eslint-disable. Candidate for `unknown` + type narrowing. STATUS: still open.
- **`any` types in auth.ts callbacks** — session, jwt, and authorized callbacks all typed `: any` (auth.ts L59, L71, L118). These are NextAuth callback parameters with known types in `next-auth`. STATUS: new finding.
- **`revalidatePath` typo in updateUser** — user-actions.ts L231 calls `revalidatePath("/admin/user")` (singular), should be `/admin/users`. STATUS: new finding (bug).

## Medium Priority
- **Admin list page shell** — orders/page.tsx, products/page.tsx, users/page.tsx all share: requireAdmin, searchText filter banner, Table wrapper, DeleteDialog, Pagination. ~70 lines structural duplication. STATUS: still open.
- **MainNav component fully duplicated** — app/admin/main-nav.tsx and app/user/main-nav.tsx are identical except the `links` array. Both 40 lines. STATUS: still open.
- **AdminLayout vs UserLayout** — Nearly identical header shell. Differ only by AdminSearch presence. STATUS: still open.
- **`useTransition` + toast pattern** — add-to-cart.tsx and cart-table.tsx share identical action→toast handlers. MarkAsPaidButton and MarkAsDeliveredButton in order-details-table.tsx are inline components with the same shape. STATUS: still open.
- **Order table rows** — user/orders/page.tsx and admin/orders/page.tsx render near-identical table rows. STATUS: still open.
- **`signUpDefaultValues.email` used for Name field** — sign-up-form.tsx L43 bug: `defaultValue={signUpDefaultValues.email}` on the Name input. STATUS: still open.
- **`deal-countdown.tsx` zero-check duplicated** — The four-field `=== 0` condition at L36-40 (inside setInterval) and L55-59 (render guard) is copy-pasted. Extract an `isCountdownFinished(time)` helper. STATUS: new finding.
- **Two `console.log` left in production** — admin/overview/page.tsx L28 and user/profile/profile-form.tsx L25. STATUS: overview was known, profile-form is new.

## Low Priority
- **`converToPlainObject`** — defined in lib/utils.ts but never used in source. Dead code. STATUS: still open.
- **search/page.tsx dead return** — L54-56: unreachable `return { title: "Search" }` after `return` on L50. STATUS: still open.
- **`revalidatePath("/admin/user")` vs correct path** — noted above, promoted to High because it's a real bug.

## Status
- All findings: not yet acted on. None from first audit pass have been resolved.
