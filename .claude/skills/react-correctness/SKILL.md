---
name: react-correctness
description: Prevent React correctness and maintainability bugs in component state and effects. Use when writing or refactoring React components — especially when reaching for useEffect, adding useState, mirroring props into state, or resetting state on prop change. Covers: deriving state vs syncing, when Effects are legitimate, state localization, key-based reset. Does NOT cover performance optimization (re-rendering, memoization for perf, bundle size, waterfalls) — see vercel-react-best-practices for that.
---

# Writing React Components

Rules for React 19+ components. Each rule is a check the agent runs against code it writes or reviews.

## Hard rules

These are cheap to check and frequently violated. Run them on every component.

### Manual memoization is OFF by default

Do NOT write `useCallback`, `useMemo`, or `React.memo` unless one of three
conditions applies. Before writing any of these, **check `next.config.ts`
(or `next.config.js`) for `reactCompiler: true`**. If the compiler is on,
the bar is nearly impossible to clear — trust the compiler, write plain code.

**The three allowed cases:**

1. **Referential equality required by a library or external hook** that the
   compiler cannot statically analyze. Examples: `react-hook-form`'s
   `watch()`, `react-dnd` drag handlers, subscription callbacks passed into
   third-party observers, memoized selectors passed to Zustand/Redux.
   Add a comment naming the library and why reference stability matters.

2. **Value is in a `useEffect` or custom-hook dependency array** AND removing
   the memoization causes an infinite re-render loop or unwanted
   re-subscription. Add a comment naming the specific effect and the bug
   that memoization prevents.

3. **Compiler is not enabled** AND the component has a re-render problem
   confirmed in React DevTools Profiler. Cite the profiler finding (which
   component, how many unnecessary renders, what triggered them) in a
   comment. "It might re-render" is not a finding — it must be measured.

**Do NOT add manual memoization:**

- To "help" the compiler. It does not need help.
- Because a function is passed as a prop. Passing functions as props is
  fine; the compiler handles reference stability.
- Because a child component is wrapped in `React.memo`. If the child is
  memoized, the compiler will stabilize the parent's callbacks and values
  appropriately.
- "Just in case." Memoization has a runtime cost and a maintenance cost
  (dep arrays drift). Unused memoization is a net negative.

If the agent is about to write `useCallback`, `useMemo`, or `React.memo`
and cannot point to one of the three cases above with a concrete reason,
the correct action is to remove the wrapper and write the inline value.

### Before adding `useEffect`, ask: _is this synchronizing with something outside React?_

If no — DOM, network, subscriptions, browser APIs — it's probably wrong.

Common Effect smells, all covered in detail in `references/you-dont-need-useeffect.md`:

- State derived from other state/props
- State reset when a prop changes (use `key` instead)
- Logic tied to a user action (use event handler instead)
- Cascading `setState` chains between Effects
- `onChange`-style notifications to parent after state updates
- Child fetching data and pushing it up to parent

**When Effects are correct:** external store subscriptions (prefer `useSyncExternalStore`), genuine data fetching driven by props/URL (with `ignore`-flag cleanup), analytics tied to display, app-level init.

If writing or keeping a `useEffect`, read the reference file first.

### Don't mirror props into state

```tsx
// 🔴 Bad
function Avatar({ user }) {
  const [name, setName] = useState(user.name);
  // name goes stale when user changes
}

// ✅ Good
function Avatar({ user }) {
  const name = user.name;
}
```

Only legitimate reason: the state represents an _uncommitted edit_ of the prop value (e.g., a form input the user is typing into before saving). In that case, document why.

### Derive, don't store

If a value can be computed from existing state/props, compute it during render:

```tsx
// 🔴 Bad
const [fullName, setFullName] = useState('');
useEffect(() => setFullName(first + ' ' + last), [first, last]);

// ✅ Good
const fullName = first + ' ' + last;
```

### `useMemo` / `useCallback` / `memo` only with justification

Default to not using them. Add only when there's a measured perf problem _or_ a referential-equality requirement (e.g., a value in a dep array that must be stable). Note in a comment why it's there.

### Localize state

State belongs in the lowest component that uses it. Lift only when a sibling needs it. Don't hoist to the top "just in case."

### Component identity via `key`

To reset a subtree when an identity-like prop changes (`userId`, `conversationId`), pass that prop as `key` — don't write Effects that manually clear state.

```tsx
<Profile userId={userId} key={userId} />
```

## Soft preferences

Stylistic. Follow unless the surrounding codebase does otherwise — match existing style.

- Arrow functions for components: `const Foo = () => { ... }`
- TypeScript: explicit props types; return types when non-obvious
- Small, single-responsibility components; flat JSX
- Group related code together (handlers near the JSX that uses them, derived values near their consumers)
- Handler names follow `handle<Thing><Action>`: `handleSubmit`, `handleEmailChange`
- Composition over configuration — if a component has 3+ boolean props controlling rendering, reach for `children` or a `variant` discriminator instead
- Stable, meaningful list `key`s — never array index when the list can reorder

## Data fetching

Prefer the framework's mechanism (Next.js server components, server actions, React Query, SWR) over hand-rolled `useEffect` + `fetch`. If fetching in an Effect is genuinely the right call, always include cleanup:

```tsx
useEffect(() => {
  let ignore = false;
  fetchResults(query).then((json) => {
    if (!ignore) setResults(json);
  });
  return () => {
    ignore = true;
  };
}, [query]);
```

See `references/you-dont-need-useeffect.md` §12 for the full pattern and race-condition reasoning.

## Self-check before finishing a component

1. Any `useEffect`? → Justify it (external system sync) or remove it.
2. Any `useState` that's always derivable from props/other state? → Remove, compute in render.
3. Any prop mirrored into state without an editing reason? → Remove.
4. Any `useMemo` / `useCallback` / `memo` without a stated reason? → Remove.
5. Any state that's only used by one child component? → Push it down.
6. Any manual state-reset logic tied to a prop change? → Replace with `key`.

## Reference

- `references/you-dont-need-useeffect.md` — 13 `useEffect` anti-patterns with concrete fixes. Load on demand when writing, evaluating, or refactoring any `useEffect`.
