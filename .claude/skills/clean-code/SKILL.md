---
name: clean-code
description: Pragmatic coding standards - concise, direct, no over-engineering, no unnecessary comments
---

# Clean Code - Pragmatic AI Coding Standards

> **CRITICAL SKILL** — Be concise, direct, solution-focused. Write working code, not tutorials.

---

## Before Editing ANY File

Before changing a file, ask:

| Question                    | Why                         |
| --------------------------- | --------------------------- |
| What imports this file?     | Call sites may break        |
| What does this file import? | Interface changes propagate |
| Is this shared/reused?      | Multiple places affected    |
| What tests cover this?      | Tests may fail              |

> **Rule:** Edit the file + all dependent files in the SAME task. Never leave broken imports.

```
File to edit: UserService.ts
└── Who imports this? → UserController.ts, AuthController.ts
└── Do they need updating? → Check signatures, update together
```

---

## Meta Rule

| Situation                    | Action                                                                      |
| ---------------------------- | --------------------------------------------------------------------------- |
| Uncertain which pattern fits | Grep the codebase for prior art and match it. Consistency beats cleverness. |
| No clear requirement         | Ask, don't assume                                                           |

---

## Naming

| Situation                           | Action                                                             |
| ----------------------------------- | ------------------------------------------------------------------ |
| Naming a variable                   | Reveal intent: `userCount`, not `n` or `data`                      |
| Naming a function                   | Verb + noun: `getUserById()`, not `user()`                         |
| Naming a boolean                    | Question form: `isActive`, `hasPermission`, `canEdit`              |
| Naming a constant                   | SCREAMING_SNAKE: `MAX_RETRY_COUNT`                                 |
| Writing a comment to explain a name | Rename the variable until the comment is redundant, then delete it |

> **Rule:** If you need a comment to explain a name, rename it.

---

## Function Rules

| Rule                | Description                           |
| ------------------- | ------------------------------------- |
| **One Thing**       | Does one thing, does it well          |
| **One Level**       | One level of abstraction per function |
| **Few Args**        | Max 3 arguments, prefer 0-2           |
| **No Side Effects** | Don't mutate inputs unexpectedly      |

---

## Functions & Structure

| Situation                                         | Action                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| Function exceeds ~20 lines or 2 levels of nesting | Extract a helper with a verb-based name                                |
| Writing `if/else` that returns                    | Use early returns; flatten the happy path to the left margin           |
| Passing more than 3 positional arguments          | Convert to a single options/params object                              |
| Same literal (string, number) appears twice       | Extract to a named constant                                            |
| Mutating a function argument or outer variable    | Return a new value; keep functions pure by default                     |
| Function name needs "and"                         | Split it — it's doing two things                                       |
| Handling errors                                   | Fail loudly at the boundary, handle explicitly; never swallow silently |

## Anti-Patterns (DON'T)

| Don't                         | Do                                              |
| ----------------------------- | ----------------------------------------------- |
| Comment every line            | Let code self-document; delete obvious comments |
| Helper for a one-liner        | Inline it                                       |
| Factory for 2 objects         | Direct instantiation                            |
| `utils.ts` with 1 function    | Colocate with caller                            |
| "First we import..." preamble | Just write the code                             |
| Deep nesting                  | Guard clauses                                   |
| Magic numbers                 | Named constants                                 |
| God functions                 | Split by responsibility                         |

---

## Self-Check Before Completing

Before saying "task complete":

| Check                  | Question                                |
| ---------------------- | --------------------------------------- |
| **Goal met?**          | Did I do exactly what was asked?        |
| **All files updated?** | Did I update call sites and dependents? |
| **Types pass?**        | `tsc --noEmit` clean?                   |
| **Lint passes?**       | No new warnings or errors?              |
| **Nothing forgotten?** | Edge cases, env vars, `.env.example`?   |

> **Rule:** If any check fails, fix it before completing.

## Core Principles (reference)

SRP · DRY · KISS · YAGNI · Boy Scout Rule.
The tables above are how these apply in practice — don't invoke the acronyms, follow the rules.
