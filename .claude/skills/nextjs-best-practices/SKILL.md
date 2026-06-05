---
name: nextjs-best-practices
description: Build and maintain Next.js applications using App Router conventions. Use this skill whenever you are working in the `app/` directory, creating or editing `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, or `route.ts` files, writing Server Actions, choosing between Server and Client Components, configuring metadata, or deciding between `fetch` / route handlers / server actions for data flow. Apply this even when the user hasn't explicitly asked for "Next.js best practices" — any Next.js work should follow these conventions by default. Do NOT use Pages Router (`pages/` directory) patterns unless the user is explicitly working in a legacy Pages Router project. Does NOT cover async waterfall elimination, React.cache/LRU deduping, or bundle optimization — see vercel-react-best-practices for those.
---

# Modern Next.js (App Router, v16)

These rules target **Next.js 16+** with the App Router and **Cache Components enabled** (`cacheComponents: true` in `next.config.ts`). Several defaults and file names changed in this version — treat older patterns as wrong unless the project is explicitly pinned to an older Next version.

## Version-specific facts to remember

- `middleware.ts` is deprecated. Use `proxy.ts` with an exported `proxy` function.
- `fetch()` is **not implicitly cached**. Nothing is cached by default. Opt in with the `'use cache'` directive.
- `params` and `searchParams` in pages and layouts are **Promises**. Await them.
- `unstable_cache` and `fetch(url, { next: { revalidate } })` are legacy patterns. Use `'use cache'` + `cacheLife` + `cacheTag` instead.

## Server vs Client Components

Server Components are the default. Only add `'use client'` when the component needs one of:

- React hooks (`useState`, `useEffect`, `useReducer`, `useContext`, etc.)
- Browser APIs (`window`, `document`, `localStorage`, geolocation, etc.)
- Event handlers (`onClick`, `onChange`, `onSubmit`) attached to DOM elements
- Third-party libraries that require the browser (most chart libs, maps, etc.)

Push `'use client'` as far down the tree as possible. A client component can render server-component children if they're passed as props (including `children`) — use this to keep interactive leaves without clientifying whole pages.

**Example — bad (clientifies an entire page for one interactive widget):**

```tsx
'use client';
export default function DashboardPage() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <h1>Dashboard</h1>
      <ExpensiveDataTable />
      <button onClick={() => setOpen(true)}>Open</button>
    </div>
  );
}
```

**Example — good (isolate the interactive part):**

```tsx
// app/dashboard/page.tsx — stays a Server Component
export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <ExpensiveDataTable />
      <OpenButton />
    </div>
  );
}

// components/dashboard/OpenButton.tsx
('use client');
export function OpenButton() {
  const [open, setOpen] = useState(false);
  return <button onClick={() => setOpen(true)}>Open</button>;
}
```

## Data Fetching

- Fetch in Server Components by default. No `useEffect` + `fetch` for initial data.
- Use the database client (Prisma) directly in Server Components. Do not build an internal API route just to call it from the same app.
- Use route handlers (`app/*/route.ts`) only for external callers: webhooks, third-party integrations, mobile/CLI clients, or endpoints that need specific status codes or headers.
- From Client Components, never `fetch('/api/...')` your own app's routes. Import and `await` a Server Action instead. `fetch()` to external origins (public APIs, third parties) is still fine. True exceptions — file uploads with progress, streaming, direct-to-storage uploads — use browser APIs or a purpose-built route handler.

## Caching (Cache Components model)

With `cacheComponents: true`, **nothing is cached unless you opt in**. Opt in with the `'use cache'` directive at the top of an async function, page, layout, or component. Configure the entry with `cacheLife` (duration) and `cacheTag` (invalidation key).

### The pattern

```ts
// Cached data-fetching function
import { cacheLife, cacheTag } from 'next/cache';

async function getProducts() {
  'use cache';
  cacheLife('hours');
  cacheTag('products');

  return prisma.product.findMany();
}
```

Place `'use cache'` as close to the data fetching as possible — at the function or component level, not at the layout. Caching a layout caches everything underneath it, which is rarely what you want.

### Invalidation

Invalidate by tag from a Server Action after mutations:

```ts
'use server';
import { updateTag } from 'next/cache';

export async function createProduct(input: CreateProductInput) {
  const product = await prisma.product.create({ data: input });
  updateTag('products'); // refreshes anything cached under this tag
  return { ok: true, data: product };
}
```

Use `revalidatePath` only when the cache isn't tagged — tags are the preferred invalidation primitive.

### Duration

Use `cacheLife` with a named profile (`'seconds'`, `'minutes'`, `'hours'`, `'days'`, `'weeks'`, `'max'`) or a config object for precise control:

```ts
cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
```

Only one `cacheLife` call should execute per function invocation. Different branches can call it with different values, but only one must run.

## Async `params` and `searchParams`

`params` and `searchParams` in pages and layouts are **Promises** and must be awaited.

```tsx
// app/items/[id]/page.tsx
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ItemPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { sort } = await searchParams;
  // ...
}
```

## Server Actions

Server Actions are the default mutation primitive. Put them in `lib/actions/[feature].ts` with `'use server'` at the top of the file.

### Required pattern

1. `'use server'` at the top of the file (or inline `'use server'` in an async function).
2. Validate inputs with Zod before touching anything.
3. Wrap the work in `try/catch`.
4. Return a typed result.
5. Call `updateTag` (or `revalidatePath` for untagged caches) after successful mutations.

```ts
// lib/actions/items.ts
'use server';

import { z } from 'zod';
import { updateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';

const createItemSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
});

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export const createItem = async (
  input: z.infer<typeof createItemSchema>,
): Promise<ActionResult<{ id: string }>> => {
  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input' };
  }

  try {
    const item = await prisma.item.create({ data: parsed.data });
    updateTag('items');
    return { ok: true, data: { id: item.id } };
  } catch (err) {
    console.error('createItem failed', err);
    return { ok: false, error: 'Could not create item' };
  }
};
```

Notes:

- Never trust client-sent input. Validate with Zod even when TypeScript says the shape is correct — types are erased at runtime.
- Do not leak raw error messages to the client. Log the detail; return a safe user-facing string.
- If authentication is required, check it at the top of the action. Return early on failure.

## Route Structure

- `app/[route]/page.tsx` — route page
- `app/[route]/layout.tsx` — shared layout for the segment
- `app/[route]/loading.tsx` — Suspense fallback for the segment
- `app/[route]/error.tsx` — error boundary (must be a Client Component)
- `app/[route]/not-found.tsx` — 404 UI, triggered by `notFound()`
- `app/api/[...]/route.ts` — HTTP endpoints (only when a Server Action won't do)
- `proxy.ts` — request interception at the network boundary
- Dynamic segments: `app/items/[id]/page.tsx`, `app/shop/[...slug]/page.tsx`

Use `redirect()` from `next/navigation` for redirects and `notFound()` to trigger the nearest `not-found.tsx`. Do not throw custom errors or return JSX to signal these states.

## File Organization

- Components: `components/[feature]/ComponentName.tsx`
- Pages: `app/[route]/page.tsx`
- Server Actions: `lib/actions/[feature].ts`
- Types: `types/[feature].ts`
- Validations: `validations/[feature].ts` (Zod schemas)
- Lib/Utils: `lib/[utility].ts`
- Database client, env parsing, server-only modules: `lib/` with `import 'server-only'` where appropriate

## Naming

- Components: PascalCase (`ItemCard.tsx`)
- Files: Match component name or kebab-case
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)

## Loading and Error UX

- Provide `loading.tsx` for any route that does meaningful server work.
- Provide `error.tsx` at least at the root and at any segment where failures need custom recovery.
- Use `<Suspense>` boundaries around slower independent chunks inside a page so the rest can stream.
- With Cache Components, cached parts render instantly as a static shell; wrap uncached/dynamic parts in `<Suspense>` so they stream in without blocking the shell.
- Keep `error.tsx` minimal — it runs on the client and must not import server-only code.
- Display user-friendly error messages via toast

## Forms

Server Actions are the default path. Use `useActionState` on the client to wire up pending/error state without extra libraries.

React Hook Form + Zod is appropriate when the form is complex (many fields, conditional fields, heavy client-side validation feedback). In that case, still validate on the server — never rely on client-side validation alone.

Whichever path you take:

- Validate server-side with the same Zod schema used on the client.
- Return `{ ok, data | error }` from the action; surface `error` to the user via toast or inline message.
- Call `updateTag` after successful mutations so cached data refreshes.

## Metadata and SEO

- Use the Metadata API (`export const metadata` or `generateMetadata`) in layouts and pages.
- Prefer static `metadata` when values don't depend on request data.
- Use `generateMetadata` only when the title/description comes from dynamic content (e.g., item name from the database). Keep it fast — it blocks the response.
- Set `metadataBase` once in the root layout so Open Graph image URLs resolve correctly.

## Images and Fonts

- Use `next/image` for images — never a bare `<img>` tag for content images.
- Use `next/font` for custom fonts; do not load fonts via `<link>` in `head`.
