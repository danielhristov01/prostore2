# Reference: You Don't Need useEffect

Reference for identifying and removing unnecessary `useEffect` calls. Each pattern is a code smell with a concrete fix.

**Core rule:** `useEffect` is for synchronizing with systems outside React (DOM, network, third-party libs, browser APIs). If no external system is involved, the Effect is probably wrong.

---

## Decision table

| Symptom in code                                         | Go to                                                                  |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| State derived from other state/props, synced via Effect | [1. Derived state](#1-derived-state)                                   |
| Expensive derivation you're caching in state            | [2. Expensive calculations](#2-expensive-calculations)                 |
| Effect resets all state when a prop changes             | [3. Reset all state on prop change](#3-reset-all-state-on-prop-change) |
| Effect resets _some_ state when a prop changes          | [4. Adjust state on prop change](#4-adjust-state-on-prop-change)       |
| Effect runs logic tied to a user action                 | [5. Event logic in Effect](#5-event-logic-in-effect)                   |
| Effect sends a POST triggered by user action            | [6. POST on event](#6-post-on-event)                                   |
| Multiple Effects that setState to trigger each other    | [7. Chains of Effects](#7-chains-of-effects)                           |
| Effect with `[]` deps for app startup                   | [8. App initialization](#8-app-initialization)                         |
| Effect calls parent's `onChange` after state updates    | [9. Notify parent](#9-notify-parent)                                   |
| Child fetches then pushes data up via Effect            | [10. Pass data up](#10-pass-data-up)                                   |
| Effect subscribes to external store (window, etc.)      | [11. External store subscription](#11-external-store-subscription)     |
| Effect fetches data based on props/state                | [12. Data fetching](#12-data-fetching)                                 |

---

## 1. Derived state

**Symptom:** State variable that is always computed from other state/props, kept in sync via Effect.

```jsx
// 🔴 Bad
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);
```

```jsx
// ✅ Good
const fullName = firstName + ' ' + lastName;
```

**Why:** Extra render with stale value, then re-render. Calculating during render is free, automatic, and can't desync.

---

## 2. Expensive calculations

**Symptom:** Derived value is slow; instinct is to cache it in state via Effect.

```jsx
// 🔴 Bad
const [visibleTodos, setVisibleTodos] = useState([]);
useEffect(() => {
  setVisibleTodos(getFilteredTodos(todos, filter));
}, [todos, filter]);
```

```jsx
// ✅ Good — plain calculation, if fast enough
const visibleTodos = getFilteredTodos(todos, filter);

// ✅ Good — memoized, if actually slow
const visibleTodos = useMemo(
  () => getFilteredTodos(todos, filter),
  [todos, filter],
);
```

**Why:** `useMemo` caches across renders without triggering extra render passes. Note: React Compiler memoizes automatically, so manual `useMemo` is often unneeded. Only reach for `useMemo` when profiling shows it matters.

---

## 3. Reset all state on prop change

**Symptom:** Effect that clears state when an identity-like prop (e.g., `userId`) changes.

```jsx
// 🔴 Bad
export const ProfilePage = ({ userId }) => {
  const [comment, setComment] = useState('');
  useEffect(() => {
    setComment('');
  }, [userId]);
};
```

```jsx
// ✅ Good — split component, pass key
export const ProfilePage = ({ userId }) => {
  return <Profile userId={userId} key={userId} />;
};

const Profile = ({ userId }) => {
  const [comment, setComment] = useState('');
};
```

**Why:** Changing the `key` tells React this is a conceptually different component — it remounts, resetting all state in the subtree in a single pass.

---

## 4. Adjust state on prop change

**Symptom:** Effect resets _some_ state when a prop changes, keeping the rest.

```jsx
// 🔴 Bad
const [selection, setSelection] = useState(null);
useEffect(() => {
  setSelection(null);
}, [items]);
```

```jsx
// ✅ Best — derive during render, no adjustment needed
const [selectedId, setSelectedId] = useState(null);
const selection = items.find((item) => item.id === selectedId) ?? null;

// ✅ Acceptable fallback — adjust during render with prev-value guard
const [prevItems, setPrevItems] = useState(items);
if (items !== prevItems) {
  setPrevItems(items);
  setSelection(null);
}
```

**Why:** Prefer lifting the derivation. If truly needed, calling `setState` during render (with a condition to avoid loops) is still better than Effect — React discards the in-progress render and retries before committing, skipping the stale DOM pass.

---

## 5. Event logic in Effect

**Symptom:** Logic belongs to a user action but runs in an Effect watching some state.

```jsx
// 🔴 Bad
useEffect(() => {
  if (product.isInCart) {
    showNotification(`Added ${product.name} to the shopping cart!`);
  }
}, [product]);
```

```jsx
// ✅ Good — extract function, call from handlers
const buyProduct = () => {
  addToCart(product);
  showNotification(`Added ${product.name} to the shopping cart!`);
};

const handleBuyClick = () => {
  buyProduct();
};
const handleCheckoutClick = () => {
  buyProduct();
  navigateTo('/checkout');
};
```

**Why:** Effects fire whenever dependencies change — including on mount with persisted state, causing phantom notifications. Ask: _why does this run?_ If the answer is "because the user did X," it's event logic.

---

## 6. POST on event

**Symptom:** POST request fired via Effect watching a flag set by an event handler.

```jsx
// 🔴 Bad
const [jsonToSubmit, setJsonToSubmit] = useState(null);
useEffect(() => {
  if (jsonToSubmit !== null) {
    post('/api/register', jsonToSubmit);
  }
}, [jsonToSubmit]);

const handleSubmit = (e) => {
  e.preventDefault();
  setJsonToSubmit({ firstName, lastName });
};
```

```jsx
// ✅ Good — POST directly in handler
const handleSubmit = (e) => {
  e.preventDefault();
  post('/api/register', { firstName, lastName });
};
```

**Note:** Analytics POSTs tied to the component _being displayed_ (e.g., `visit_form`) correctly belong in an Effect with `[]` deps — the reason they run is the display, not an interaction.

**Why:** Same rule as #5 — the cause is the click, not the render.

---

## 7. Chains of Effects

**Symptom:** Multiple Effects where each updates state that triggers the next.

```jsx
// 🔴 Bad
useEffect(() => {
  if (card !== null && card.gold) setGoldCardCount((c) => c + 1);
}, [card]);
useEffect(() => {
  if (goldCardCount > 3) {
    setRound((r) => r + 1);
    setGoldCardCount(0);
  }
}, [goldCardCount]);
useEffect(() => {
  if (round > 5) setIsGameOver(true);
}, [round]);
```

```jsx
// ✅ Good — derive during render, compute cascade in handler
const isGameOver = round > 5;

const handlePlaceCard = (nextCard) => {
  if (isGameOver) throw Error('Game already ended.');
  setCard(nextCard);
  if (nextCard.gold) {
    if (goldCardCount < 3) {
      setGoldCardCount(goldCardCount + 1);
    } else {
      setGoldCardCount(0);
      setRound(round + 1);
      if (round === 5) alert('Good game!');
    }
  }
};
```

**Why:** Each Effect = one re-render. Chains also break under state-restore scenarios (history, undo) because setting past state re-triggers the chain. Exception: if intermediate steps require network sync, chains are appropriate.

---

## 8. App initialization

**Symptom:** `useEffect(() => {...}, [])` in root component for one-time app setup.

```jsx
// 🔴 Bad — runs twice in dev (StrictMode)
const App = () => {
  useEffect(() => {
    loadDataFromLocalStorage();
    checkAuthToken();
  }, []);
};
```

```jsx
// ✅ Good — module flag inside Effect
let didInit = false;
const App = () => {
  useEffect(() => {
    if (!didInit) {
      didInit = true;
      loadDataFromLocalStorage();
      checkAuthToken();
    }
  }, []);
};
```

**Why:** StrictMode remounts components to surface bugs. App-load logic should run once per load, not once per mount.

---

## 9. Notify parent

**Symptom:** Effect calls `onChange` prop after internal state updates.

```jsx
// 🔴 Bad
const [isOn, setIsOn] = useState(false);
useEffect(() => {
  onChange(isOn);
}, [isOn, onChange]);
```

```jsx
// ✅ Good — update both in one handler
const updateToggle = (nextIsOn) => {
  setIsOn(nextIsOn);
  onChange(nextIsOn);
};

// ✅ Better — lift state, make fully controlled
const Toggle = ({ isOn, onChange }) => {
  const handleClick = () => {
    onChange(!isOn);
  };
};
```

**Why:** Effect-based notification causes child → render → parent → render. Same-event updates batch into one pass. If two components must stay in sync, lifting state eliminates the problem entirely.

---

## 10. Pass data up

**Symptom:** Child fetches data, then pushes it to parent via Effect + `onFetched` prop.

```jsx
// 🔴 Bad
const Child = ({ onFetched }) => {
  const data = useSomeAPI();
  useEffect(() => {
    if (data) onFetched(data);
  }, [onFetched, data]);
};
```

```jsx
// ✅ Good — parent fetches, passes down
const Parent = () => {
  const data = useSomeAPI();
  return <Child data={data} />;
};
```

**Why:** React's contract is top-down data flow. Upward data flow via Effects makes bugs untraceable. Fetch at the level that owns the data.

---

## 11. External store subscription

**Symptom:** Effect manually subscribes/unsubscribes to a browser API or external store and mirrors it into state.

```jsx
// 🔴 Not ideal
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    const updateState = () => {
      setIsOnline(navigator.onLine);
    };
    updateState();
    window.addEventListener('online', updateState);
    window.addEventListener('offline', updateState);
    return () => {
      window.removeEventListener('online', updateState);
      window.removeEventListener('offline', updateState);
    };
  }, []);
  return isOnline;
};
```

```jsx
// ✅ Good — useSyncExternalStore
const subscribe = (callback) => {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
};

const useOnlineStatus = () => {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine, // client snapshot
    () => true, // server snapshot
  );
};
```

**Why:** `useSyncExternalStore` is purpose-built — handles tearing, SSR, and concurrent rendering correctly. Manual mirroring with Effects is error-prone.

---

## 12. Data fetching

**Symptom:** Effect fetches based on `query`/`page`/etc. without cleanup, causing race conditions.

```jsx
// 🔴 Bad — no cleanup, stale responses can win
useEffect(() => {
  fetchResults(query, page).then((json) => setResults(json));
}, [query, page]);
```

```jsx
// ✅ Minimum viable — ignore flag for cleanup
useEffect(() => {
  let ignore = false;
  fetchResults(query, page).then((json) => {
    if (!ignore) setResults(json);
  });
  return () => {
    ignore = true;
  };
}, [query, page]);

// ✅ Better — extract into custom hook
const useData = (url) => {
  const [data, setData] = useState(null);
  useEffect(() => {
    let ignore = false;
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (!ignore) setData(json);
      });
    return () => {
      ignore = true;
    };
  }, [url]);
  return data;
};
```

**Why:** Fetches triggered by `query`/`page` are genuine sync-with-external-system cases (URL restores, back/forward nav — not just typing), so Effects are legitimate here. But raw Effects leak race conditions. Prefer framework-provided data fetching (React Query, SWR, RSC, Next.js data APIs) over hand-rolled Effects for caching, waterfalls, and SSR.

---

## Quick reference

- **Derivable from props/state** → calculate in render
- **Slow derivation** → `useMemo` (or let React Compiler handle it)
- **Reset subtree on identity change** → `key` prop
- **Adjust state on prop change** → derive, or `setState` during render with guard
- **Caused by user action** → event handler, not Effect
- **Cascading state updates** → compute in one handler, derive what you can
- **Once per app load** → module-level code or `didInit` flag
- **Notify parent** → call in same handler, or lift state up
- **Child → parent data** → fetch in parent, pass down
- **External store** → `useSyncExternalStore`
- **Data fetching** → framework mechanism; if Effect, always cleanup with `ignore` flag
