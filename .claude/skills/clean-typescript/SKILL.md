---
name: clean-typescript
description: Write clean, correct, idiomatic TypeScript. Use this skill whenever you are writing, editing, or reviewing `.ts` or `.tsx` files — including defining types/interfaces, typing function signatures, handling API responses, modeling data, or deciding between `type` vs `interface`, `enum` vs union, `any` vs `unknown`. Apply this even when the user hasn't explicitly asked for "clean code" or "best practices" — any TypeScript work should follow these conventions by default.
---

# Clean TypeScript

TypeScript is a **correctness and clarity tool**, not ceremony. Types should reduce bugs and cognitive load, not add noise. When a type is hard to understand, it is probably wrong.

## General Principles

- Types should explain intent
- If a type is hard to understand, it’s probably wrong
- Favor maintainability over theoretical completeness. A slightly less "clever" type that's obvious to read wins.

## Strictness

- Never use `any`. Use `unknown` and narrow it, or define a real type.
- Never use non-null assertions (`!`) to silence the compiler. If you truly know a value is defined, narrow it with a guard or restructure the code so the compiler knows too. The only acceptable `!` is after an explicit check the compiler can't follow (e.g., `Map.get` after `Map.has`) — and even then, prefer restructuring.
- Never use `@ts-ignore` or `@ts-expect-error` without a comment explaining why and a plan to remove it.

## `type` vs `interface`

Default to `type`. It's more flexible (supports unions, intersections, mapped types, conditionals) and the syntax is consistent with everything else.

Use `interface` only when:

- You are declaring a public API shape that consumers may legitimately want to extend via declaration merging (rare).
- You are extending a class or another interface and the intent is inheritance.

This means: **props, API responses, database models, and domain entities are all `type`.** Do not mix styles in the same file.

## Discriminated Unions for State

Model states, results, and variants as discriminated unions with a literal `type`/`kind`/`status` tag. This forces callers to handle every case and makes invalid states unrepresentable.

**Example — bad:**

```ts
type Request = {
  loading: boolean;
  data?: User;
  error?: Error;
};
// Allows { loading: true, data: user, error: err } — nonsense.
```

**Example — good:**

```ts
type Request =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };
```

## Infer From the Source of Truth

Do not re-declare types that already exist elsewhere. Derive them.

- Prisma models: `import type { User } from '@prisma/client'` or `Prisma.UserGetPayload<{ include: {...} }>` for relations.
- Zod schemas: `type Input = z.infer<typeof inputSchema>`.
- API response shapes: validate with Zod at the boundary, then `z.infer` the type.
- React component props: `type Props = ComponentProps<typeof Button>` when wrapping.

Duplicated type declarations drift. Derived types cannot.

## Runtime Validation at Boundaries

Types are erased at runtime. Any data crossing an untrusted boundary — HTTP request bodies, URL params, `localStorage`, env vars, third-party APIs — must be validated, not just cast.

- Use Zod (or equivalent) at the boundary.
- `JSON.parse` returns `any` — treat its output as `unknown` and validate immediately.
- `as SomeType` on untrusted input is a bug.

## Functions & APIs

- Annotate parameters. Annotate return types on exported functions.
- Keep signatures short. If a function needs more than ~3 positional params, pass an options object.
- Avoid overloads unless they meaningfully improve the API. Overloads are a maintenance burden and often a union or generic does the job.
- Name parameters descriptively. `fn(userId: string)` beats `fn(id: string)` when the function is about users.

## Nullability & Safety

- Handle `null` and `undefined` explicitly at the edges where they enter.
- Prefer `undefined` over `null` for "absent." Use `null` only when an external API or the database forces it.
- Prefer narrowing via control flow and guards

## Enums & Constants

Avoid `enum`. Use string literal unions or `as const` objects.

Reasons: `enum` emits runtime code, numeric enums have surprising reverse-mapping behavior, and unions are simpler, tree-shakeable, and compare by value.

- Keep runtime output predictable and minimal

## Error Handling

- Type errors and error states explicitly
- Prefer result objects or typed errors over throwing where appropriate
- Do not hide failure modes behind broad types
