# Redundancy & Modularity Audit — pro_store

**Audited:** `app/`, `lib/`, `components/`, `types/`, `db/`, `email/`
**Excluded:** `Example/`, `node_modules/`, `.next/`, `lib/generated/`, `.claude/`

---

## Summary

The codebase is well-structured for a learning project. The key existing abstractions (`requireAdmin`, `mapProduct/mapCart/mapOrder`, `formatError`, `DeleteDialog`, `Pagination`) show good instincts. The main pain points cluster around three themes: a repeated "auth + DB user lookup" block in user-actions that duplicates work across three functions; two nav components and two dashboard layouts that are structurally identical; and a `useTransition` + toast response handler that is copy-pasted into almost every interactive component. There are also two concrete bugs discovered during the audit (a misused `defaultValue` in sign-up, and a `Pagination` component that silently loses the current search params).

---

## Summary Table

| # | Severity | Title | Files | Effort | Risk |
|---|----------|-------|-------|--------|------|
| 1 | High | Auth + user lookup repeated in user-actions | `lib/actions/user-actions.ts` | Small | Low |
| 2 | High | `formatError` typed as `any` | `lib/utils.ts` | Small | Low |
| 3 | Medium | Admin list pages share identical shell | `app/admin/orders/`, `products/`, `users/` | Medium | Low |
| 4 | Medium | MainNav duplicated verbatim | `app/admin/main-nav.tsx`, `app/user/main-nav.tsx` | Small | Low |
| 5 | Medium | AdminLayout and UserLayout are near-identical | `app/admin/layout.tsx`, `app/user/layout.tsx` | Small | Low |
| 6 | Medium | `useTransition` + toast handler copy-pasted everywhere | 6+ component files | Medium | Low |
| 7 | Low | `converToPlainObject` is dead code | `lib/utils.ts` | Tiny | None |
| 8 | Low | Pagination silently breaks navigation (bug) | `components/shared/pagination.tsx` | Tiny | Medium |
| 9 | Low | Dead code + debug log in search and overview | `app/(root)/search/page.tsx`, `app/admin/overview/page.tsx` | Tiny | None |
| 10 | Low | signUpForm uses wrong `defaultValue` for Name field (bug) | `app/(auth)/sign-up/sign-up-form.tsx` | Tiny | Medium |

---

## Findings

---

### [H] 1. Auth + user-lookup block repeated three times in user-actions

**Locations:**
- `lib/actions/user-actions.ts:L100-L106` (`updateUserAddress`)
- `lib/actions/user-actions.ts:L130-L132` (`updateUserPaymentMethod`)
- `lib/actions/user-actions.ts:L156-L158` (`updateProfile`)

**Observation:**

All three functions open with the exact same two-step operation:

```ts
const session = await auth();
const currentUser = await prisma.user.findFirst({
  where: { id: session?.user?.id },
});
if (!currentUser) throw new Error("User not found");
```

The function `getUserById(userId)` already exists in the same file (L89-L96) but accepts a `userId` argument. None of these three callers reuse it — they each hit the database independently.

**Impact:**

This is the highest-risk duplication in the codebase because it involves auth. If the session check logic ever needs to change (e.g., checking for account suspension, or changing the error message), you have to remember to update three places. If you miss one, it silently lets the old check stand — a classic security drift bug.

**Why this pattern matters to learn:**

This is the "extract-until-it-hurts" principle. When you see the same two lines appearing three times in the same file and they all do the same job (get the currently logged-in user from the DB), that is the exact moment to extract a private helper. It does not need to be exported — it can live at the top of the file, only used internally.

**Recommendation:**

Add this helper near the top of `lib/actions/user-actions.ts`, above the exported functions:

```ts
// lib/actions/user-actions.ts

const getAuthenticatedUser = async () => {
  const session = await auth();
  const user = await prisma.user.findFirst({
    where: { id: session?.user?.id },
  });
  if (!user) throw new Error("User not found");
  return user;
};
```

Then each of the three functions becomes:

```ts
export async function updateUserAddress(data: ShippingAddress) {
  try {
    const currentUser = await getAuthenticatedUser();
    // ... rest unchanged
```

**Effort:** Small — three call sites, all in one file.
**Risk:** Low — no API surface changes. The logic is identical to what is there now.

---

### [H] 2. `formatError` typed as `any` — violates strict TypeScript

**Locations:**
- `lib/utils.ts:L26-L27`

**Observation:**

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatError(error: any) {
```

The project uses TypeScript strict mode. The `eslint-disable` comment is a suppression of a real violation. This function is called 18 times across all five action files.

**Impact:**

`any` disables TypeScript's type checking on `error` completely. If you access a property that doesn't exist (e.g., `error.issues` on a non-Zod error), TypeScript won't warn you. Using `unknown` forces you to prove what `error` is before touching it, which is exactly what the function's `if` chain already does — so the fix is almost free.

**Why this matters to learn:**

`catch (error)` in TypeScript gives you `unknown` by default (since TS 4.0) because an error can genuinely be anything — a string, a number, a class instance. Annotating it as `any` turns off safety. The right pattern is `unknown` + type-narrowing guards, which this function already has — it just needs the annotation corrected.

**Recommendation:**

```ts
export const formatError = (error: unknown): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "ZodError" &&
    "issues" in error
  ) {
    const zodError = error as { issues: { message: string }[] };
    return zodError.issues.map((issue) => issue.message).join(". ");
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "PrismaClientKnownRequestError" &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  ) {
    const prismaError = error as { meta?: { target?: string[] } };
    const field = prismaError.meta?.target?.[0] ?? "Field";
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const msg = (error as { message: unknown }).message;
    return typeof msg === "string" ? msg : JSON.stringify(msg);
  }

  return "An unknown error occurred";
};
```

Note: Convert from `export function` to `export const` as an arrow function while you're there, to match the project's stated preference.

**Effort:** Small.
**Risk:** Low — the logic is unchanged, you are only correcting the type annotation and removing the eslint-disable comment.

---

### [M] 3. Three admin list pages share an identical structural shell

**Locations:**
- `app/admin/orders/page.tsx:L32-L103`
- `app/admin/products/page.tsx:L37-L99`
- `app/admin/users/page.tsx:L29-L80`

**Observation:**

All three pages have the exact same outer structure:

```tsx
<div className="space-y-2">
  <div className="flex items-center gap-3">
    <h2 className="h2-bold">{title}</h2>
    {searchText && (
      <div>
        Filter by <i>&quot;{searchText}&quot;</i>
        <Link href={clearHref}>
          <Button variant="outline" size="sm">Remove Filter</Button>
        </Link>
      </div>
    )}
  </div>
  <div className="overflow-x-auto">
    <Table>
      <TableHeader> ... </TableHeader>
      <TableBody> ... </TableBody>
    </Table>
    {totalPages > 1 && <Pagination page={page} totalPages={totalPages} />}
  </div>
</div>
```

The only parts that differ are the heading text, the clear-filter href, the table columns, and the data.

**Impact:**

This is a medium-severity pattern because the table body rows genuinely differ — you cannot trivially merge them. But the outer wrapper (title + filter banner + pagination) is pure copy-paste. If you want to add a "results count" or change the filter display style, you change it in three places.

**Why this matters to learn:**

This is the "wrapper vs content" split that React makes easy. You do not need to abstract the entire table — just the wrapper. This is called a "layout component" pattern.

**Recommendation:**

Create `app/admin/components/admin-list-layout.tsx`:

```tsx
// A Server Component — no 'use client' needed

type AdminListLayoutProps = {
  title: string;
  searchText?: string;
  clearHref: string;
  totalPages: number;
  page: number;
  children: React.ReactNode; // the <Table> goes here
};

const AdminListLayout = ({
  title, searchText, clearHref, totalPages, page, children,
}: AdminListLayoutProps) => (
  <div className="space-y-2">
    <div className="flex items-center gap-3">
      <h2 className="h2-bold">{title}</h2>
      {searchText && (
        <div>
          Filter by <i>&quot;{searchText}&quot;</i>
          <Link href={clearHref}>
            <Button variant="outline" size="sm">Remove Filter</Button>
          </Link>
        </div>
      )}
    </div>
    <div className="overflow-x-auto">
      {children}
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} />}
    </div>
  </div>
);
```

Each admin page then just provides the table as `children`. The table columns stay different — that is intentional and should not be merged.

**Effort:** Medium — three pages to update, but the change in each is mechanical.
**Risk:** Low — purely structural, no data or business logic involved.

---

### [M] 4. MainNav component is copy-pasted verbatim between admin and user areas

**Locations:**
- `app/admin/main-nav.tsx:L1-L42`
- `app/user/main-nav.tsx:L1-L41`

**Observation:**

Both files are character-for-character identical except for the `links` array:

```ts
// admin/main-nav.tsx
const links = [
  { title: "Overview", href: "/admin/overview" },
  { title: "Products", href: "/admin/products" },
  { title: "Orders", href: "/admin/orders" },
  { title: "Users", href: "/admin/users" },
];

// user/main-nav.tsx
const links = [
  { title: "Profile", href: "/user/profile" },
  { title: "Orders", href: "/user/orders" },
];
```

The component signature, the `usePathname` logic, the active-link class, and the JSX are identical.

**Impact:**

Any change to the nav behavior — adding a new active-state style, changing the spacing, adding an icon — must be made in two places. This is the exact scenario where duplication causes drift.

**Why this matters to learn:**

This is textbook "parameterise the difference". The component logic is the same; only the data differs. Accept the data as a prop, and you have one component.

**Recommendation:**

Create `components/shared/main-nav.tsx` (it is reusable across features, so `components/shared/` is the right home):

```tsx
"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type NavLink = { title: string; href: string };

const MainNav = ({
  links,
  className,
  ...props
}: { links: NavLink[] } & React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();
  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname.includes(item.href) ? "" : "text-muted-foreground",
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
};

export default MainNav;
```

Then each layout imports the single component and passes its own `links` array. Delete both existing `main-nav.tsx` files.

**Effort:** Small.
**Risk:** Low — pure refactor, identical behavior.

---

### [M] 5. AdminLayout and UserLayout are nearly identical

**Locations:**
- `app/admin/layout.tsx:L1-L42`
- `app/user/layout.tsx:L1-L37`

**Observation:**

Both layouts render this exact shell:

```tsx
<div className="flex flex-col">
  <div className="border-b container mx-auto">
    <div className="flex items-center h-16 px-4">
      <Link href="/" className="w-22">
        <Image src="/images/logo.svg" height={48} width={48} alt={APP_NAME} />
      </Link>
      <MainNav className="mx-6" />
      <div className="ml-auto items-center flex space-x-4">
        {/* admin adds <AdminSearch /> here */}
        <Menu />
      </div>
    </div>
  </div>
  <div className="flex-1 space-y-4 p-8 pt-6 container mx-auto">
    {children}
  </div>
</div>
```

The only difference is that `AdminLayout` renders `<AdminSearch />` before `<Menu />`.

**Impact:**

Lower severity than the nav duplication because layout files change rarely. But it is a natural follow-on from Finding 4 — once you have a shared `MainNav`, the layouts can share a shell too.

**Recommendation:**

After resolving Finding 4, create a shared layout shell:

```tsx
// components/shared/dashboard-layout.tsx
// Server Component — no 'use client'

const DashboardLayout = ({
  nav,
  extraHeaderContent,
  children,
}: {
  nav: React.ReactNode;
  extraHeaderContent?: React.ReactNode;
  children: React.ReactNode;
}) => ( /* same HTML shell, nav and extraHeaderContent injected */ );
```

Admin layout passes `<AdminSearch />` as `extraHeaderContent`; user layout omits it.

**Effort:** Small — but depends on Finding 4 being done first.
**Risk:** Low.

---

### [M] 6. `useTransition` + toast handler is copy-pasted across six components

**Locations:**
- `components/shared/product/add-to-cart.tsx:L16-L47` (two handlers: add + remove)
- `app/(root)/cart/cart-table.tsx:L68-L101` (two inline handlers: add + remove)
- `app/(root)/order/[id]/order-details-table.tsx:L90-L130` (`MarkAsPaidButton` and `MarkAsDeliveredButton` — two inline sub-components)
- `components/shared/delete-dialog.tsx:L27-L38` (one handler)

**Observation:**

Every interactive button in this codebase follows the same shape:

```ts
const [isPending, startTransition] = useTransition();
// ...
startTransition(async () => {
  const res = await someAction(id);
  if (!res.success) {
    toast.error(res.message);
  } else {
    toast.success(res.message); // sometimes toast.message()
  }
});
```

The `MarkAsPaidButton` and `MarkAsDeliveredButton` inside `order-details-table.tsx` (L90-L130) are a particularly clear symptom: they are two separate inline component definitions that are identical except for which action they call.

**Impact:**

This is medium severity because the pattern works correctly. The problem is scale: there are 16 `if (!res.success)` checks spread across 10 components. If you decide to add a loading spinner style, or change error toast behavior globally (e.g., add a duration), you edit 10+ places.

**Why this matters to learn:**

This is a good candidate for a custom hook — a React concept worth understanding. A custom hook is just a function that starts with `use` and can call other hooks (`useTransition`, in this case). It packages up the repetitive wiring so your component only deals with "what action to call" and "what happens on success", not the plumbing around it.

**Recommendation:**

Create `lib/hooks/use-server-action.ts`:

```ts
"use client"; // hooks are always client-side

import { useTransition } from "react";
import { toast } from "sonner";

type ActionResult = { success: boolean; message: string };

export const useServerAction = () => {
  const [isPending, startTransition] = useTransition();

  const execute = (
    action: () => Promise<ActionResult>,
    onSuccess?: () => void,
  ) => {
    startTransition(async () => {
      const res = await action();
      if (!res.success) {
        toast.error(res.message);
      } else {
        toast.success(res.message);
        onSuccess?.();
      }
    });
  };

  return { isPending, execute };
};
```

Usage in a component:

```tsx
// Before: 8 lines per handler, repeated everywhere
const [isPending, startTransition] = useTransition();
const handleDelete = () => {
  startTransition(async () => {
    const res = await deleteOrder(id);
    if (!res.success) toast.error(res.message);
    else toast.success(res.message);
  });
};

// After: 2 lines
const { isPending, execute } = useServerAction();
const handleDelete = () => execute(() => deleteOrder(id));
```

**Effort:** Medium — the hook itself is small, but there are ~10 call sites to update.
**Risk:** Low. Start with `DeleteDialog` alone to validate the pattern before updating everything else.

---

### [L] 7. `converToPlainObject` is exported but never used

**Locations:**
- `lib/utils.ts:L16-L18`

**Observation:**

```ts
export function converToPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
```

A grep across the entire source (excluding `Example/` and `node_modules/`) shows zero imports of this function. It also has a typo: `conver` instead of `convert`.

**Impact:**

Dead code inflates the apparent API surface of `lib/utils.ts`. Anyone reading the file assumes each export is needed.

**Recommendation:**

Delete the function. If you later need to serialize a Prisma object manually, add it back with the correct name `convertToPlainObject`.

Note: the existing `mapProduct`, `mapCart`, `mapOrder` functions already handle the real-world version of this need (Decimal-to-string coercion), which is why this generic helper is unused.

**Effort:** Tiny.
**Risk:** None — confirm unused before deleting.

---

### [L] 8. Pagination component has a bug — `useSearchParams` not called

**Locations:**
- `components/shared/pagination.tsx:L14`

**Observation:**

```ts
const searchParams = useSearchParams; // missing ()
```

`useSearchParams` is a function that must be called (`useSearchParams()`) to return the current search params. Without the parentheses, `searchParams` is assigned the function reference itself, and calling `.toString()` on it on L20 returns `"function useSearchParams() {...}"` — not the URL params.

This means `formUrlQuery` in the pagination click handler will build a URL using a garbage params string instead of the real current URL query. Pagination navigation will silently lose all existing filter parameters (e.g., a category filter gets dropped when you click "Next").

**Impact:**

This is a real user-facing bug. If you have filtered products by category and click page 2, the category filter disappears. It is marked Low severity here only because it is a one-character fix, but the user-experience impact is real.

**Recommendation:**

```ts
// Before (line 14):
const searchParams = useSearchParams;

// After:
const searchParams = useSearchParams();
```

**Effort:** Tiny.
**Risk:** Low — straightforward fix.

---

### [L] 9. Dead code and debug log in search and overview pages

**Locations:**
- `app/(root)/search/page.tsx:L54-L56` — unreachable `return` statement
- `app/admin/overview/page.tsx:L28` — `console.log(summary)`

**Observation:**

In `search/page.tsx`, the `generateMetadata` function already returns at L50. The block at L54-L56 (`return { title: "Search" }`) can never be reached:

```ts
  } else {
    return { title: "Search Products" }; // returns here at L50-52
  }
  return { title: "Search" }; // dead — TypeScript should catch this
}
```

In `overview/page.tsx`, `console.log(summary)` on L28 is a leftover debug statement. This leaks the entire order summary object to the server console in production.

**Recommendation:**

Delete the unreachable return in `search/page.tsx`. Delete the `console.log` in `overview/page.tsx`.

**Effort:** Tiny.
**Risk:** None.

---

### [L] 10. Sign-up form uses wrong `defaultValue` for the Name field (bug)

**Locations:**
- `app/(auth)/sign-up/sign-up-form.tsx:L43`

**Observation:**

```tsx
<Label htmlFor="email">Name</Label>  // label says "Name"
<Input
  id="name"
  name="name"
  defaultValue={signUpDefaultValues.email}  // but uses .email (empty string)
  ...
```

The `signUpDefaultValues` object is:
```ts
export const signUpDefaultValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};
```

Both `name` and `email` default to `""`, so the bug does not cause a visible problem today. But the intent is clearly `signUpDefaultValues.name`. If someone ever changes `signUpDefaultValues.name` to a test value like `"Test User"` during development, the Name field would still show an empty string (because it is reading from `.email`), which would be confusing to debug.

**Recommendation:**

```tsx
// Line 43: change .email to .name
defaultValue={signUpDefaultValues.name}
```

**Effort:** Tiny.
**Risk:** None — same value currently, but corrects semantic intent.

---

## Non-Findings (Intentional Duplication)

These look duplicated but should stay separate:

1. **`addItemToCart` in `add-to-cart.tsx` vs `cart-table.tsx`** — Both call the same action, but the context is different. `add-to-cart.tsx` is a product-page widget (shows success toast with a "Go to cart" link). `cart-table.tsx` is the cart page itself (no redirect needed). The different success handling is intentional.

2. **`getLatestProducts`, `getProductBySlug`, `getProductById`, `getFeaturedProducts`** — These look like trivially similar Prisma queries, but each has a different access pattern and `where` clause. Merging them into one "getProducts" function would create a confusing options bag. Keep them separate.

3. **`insertProductSchema` and `updateProductSchema`** — `updateProductSchema` extends `insertProductSchema`. This is the correct Zod pattern and should not be flattened.

4. **`MarkAsPaidButton` and `MarkAsDeliveredButton` as inline components in `order-details-table.tsx`** — Flagged in Finding 6 for the `useTransition` duplication, but each should remain a small separate component because they call different actions and will likely diverge (e.g., confirmation dialog before marking paid). The hook in Finding 6 addresses the wiring duplication without forcing them to merge.

5. **`shippingAddressDefaultValues` in constants vs `shippingAddressSchema` in validators** — These serve different purposes. The schema validates; the default values seed the form. They should stay in their respective files.

---

## Suggested Execution Order

Work through these in this sequence to minimize conflicts and maximize learning:

1. **Fix the Pagination bug (Finding 8)** — One character. Fixes a real navigation bug and costs nothing.

2. **Fix the sign-up `defaultValue` bug (Finding 10)** — One word change. Fixes a semantic bug before it can ever cause confusion.

3. **Delete dead code (Findings 7 and 9)** — Remove `converToPlainObject`, the unreachable return in search, and the `console.log`. Cleans the slate before the real work.

4. **Extract `getAuthenticatedUser` helper in user-actions (Finding 1)** — Small, contained to one file, high correctness value. Good warm-up refactor.

5. **Fix `formatError` typing (Finding 2)** — Convert from `any` to `unknown`. Teaches a core TypeScript lesson and removes the eslint suppression.

6. **Extract shared `MainNav` component (Finding 4)** — Small, clearly wins, no risk. Creates a shared component you can point to as a reference.

7. **Collapse AdminLayout / UserLayout (Finding 5)** — Natural follow-on from #6. Does not depend on anything else.

8. **Extract `useServerAction` hook (Finding 6)** — Start with `DeleteDialog` only. Once you're satisfied with the pattern, roll it out to `add-to-cart.tsx`, then `cart-table.tsx`, then `order-details-table.tsx`.

9. **Extract `AdminListLayout` shell (Finding 3)** — Do this last because it is the most structural change and involves three files simultaneously. Lower urgency than the bugs and the hook.
