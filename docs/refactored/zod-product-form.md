# Zod / RHF fix: `components/admin/product-form.tsx`

Date: 2026-05-16
Scope: TypeScript errors from `tsc --noEmit` on the new admin product form.

## Errors fixed

1. `components/admin/product-form.tsx:22` (TS2322) — `resolver` was a union of two incompatible `Resolver<...>` types (`updateProductSchema` adds `id`, `insertProductSchema` does not), so it couldn't be assigned to `useForm<z.infer<typeof insertProductSchema>>`'s resolver slot.
2. `components/admin/product-form.tsx:26` (TS2322) — `productDefaultValues.stock` was the string `"0"` but `insertProductSchema.stock` is `z.number()`. `images: []` was inferred as `never[]` instead of `string[]`.

## Files touched (3 hunks, 4 changed lines)

| File | Lines changed | What changed |
| --- | --- | --- |
| `lib/constants/index.ts` | 2 | `images: []` -> `images: [] as string[]`; `stock: "0"` -> `stock: 0` |
| `components/admin/product-form.tsx` | 1 (import) | Added `Resolver` to the `react-hook-form` import |
| `components/admin/product-form.tsx` | 1 (resolver) | Cast the update-branch resolver to `Resolver<z.infer<typeof insertProductSchema>>` via `unknown` |

## Approach and why

- **Minimal cast over re-typing the form.** The form is typed against `insertProductSchema` (no `id`). Re-typing the whole form to a union of both schemas would ripple through every `form.handleSubmit` / `form.getValues` site once the form body is implemented. A single `as unknown as Resolver<...>` cast is the smallest change that preserves runtime behavior: at runtime the update resolver still validates `id` (so update submissions stay safe), only the static type is widened to match the form's declared shape.
- **`as unknown as Resolver<...>`, not a direct cast.** TS rejected the direct cast (TS2352) because the two `Resolver` types don't sufficiently overlap. The `unknown` intermediate is the conventional escape hatch and is local to one line, so the unsafety is contained.
- **Fixed defaults instead of changing the schema.** `stock` is genuinely a number in the domain model, so the right fix is the default value, not loosening the validator to `z.string()`. Same for `images`: it's a `string[]` everywhere else, the literal `[]` just needed an annotation so TS doesn't infer `never[]`.
- **Did not import the schema type into `lib/constants/index.ts`.** `lib/validators.ts` already imports `PAYMENT_METHODS` from `./constants`, so annotating `productDefaultValues` with `z.infer<typeof insertProductSchema>` would create a circular import. Inline value fixes avoid that.
- **Left `rating` / `numReviews` in `productDefaultValues` alone.** They are not in `insertProductSchema`, but the constant is consumed as a non-fresh object (no excess-property check fires), so they don't break the form and may be needed by other callers. Out of scope.

## Tips to avoid this class of issue

- When `useForm` can validate against more than one schema, declare a single form-values type up front (`type FormValues = z.infer<typeof updateProductSchema>` if it's the superset) and pick the schema based on `type` — don't keep the resolver as a conditional expression with two different generic outputs.
- Type your default-values objects: `const productDefaultValues: z.infer<typeof insertProductSchema> = {...}`. You'll catch `stock: "0"`-style drift at the source instead of at the first consumer.
- Empty arrays in `const` objects are inferred as `never[]`. Always annotate (`[] as string[]`) or type the parent object.
- Watch for circular imports when colocating types and constants — `constants` and `validators` referencing each other is a common trap. Push shared shapes into a third module if it ever gets worse.
- Prefer fixing the data to match the schema over loosening the schema to match the data. Schemas are the contract; if `stock` is a number, defaults must be a number.
- Use `as unknown as T` as a *last* resort for irreconcilable third-party generics (like RHF's `Resolver`). Keep the cast on a single line and add a brief comment if the reason isn't obvious.
- Run `npx tsc --noEmit` before committing — Next.js's dev server won't always surface these resolver-shape mismatches until build time.
