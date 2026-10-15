# Feature folders (ADR-0005)

Code lives in feature folders named after GLOSSARY.md terms. Read [docs/adr/0005-feature-folders-with-enforced-boundaries.md](docs/adr/0005-feature-folders-with-enforced-boundaries.md) before adding a feature, a screen, a route, a table, a contract, or anything in `shared/`.

- **Where things go**: `apps/native/{features,shared}/`, `apps/web/src/{features,shared}/`, `apps/server/src/{features,shared}/`. A feature holds `screens/ components/ hooks/ data/ i18n/ utils/` (only those it needs) and exposes itself through `index.ts` alone. `shared/` splits into `ui/`, `lib/` (clients, providers, the event bus) and `utils/` (pure helpers).
- **Imports**: inside a feature, import its own files by relative path. Everything else reaches a feature as `@/features/<feature>`, and only route files (expo-router `app/`, TanStack `routes/`, the server's `router.ts`) do that. Route files render a feature's screen, or compose several on Home, and hold no logic.
- **Cross-feature reactions** travel as events: add the event to `apps/native/shared/lib/events.ts`, `events.emit` it in one feature, `events.on` it in the other. Shared UI that needs a feature's piece takes it as a prop or slot from the route.
- **Strings (native)**: no literal UI text. A feature's `i18n/ar.ts` is the source catalogue; `i18n/en.ts` is typed `Catalog<typeof ar>` (from `@alrisali/i18n`); `i18n/index.ts` calls `registerCatalog("<feature>", { ar, en })` from `@/shared/lib/i18n` and adds `<feature>: typeof ar` to i18next's `ResourceNamespaceMap`. The screen imports `../i18n` and uses `useTranslation("<feature>")`; a wrong or missing key fails type-check. Shell strings (tab names) live in `shared/lib/i18n/common.*.ts`.
- **Direction (native)**: the layout direction comes from the launch language (`launchDirection`), not `I18nManager.isRTL`, which expo-localization's `forcesRTL` keeps true. Use Panel UI `Text` (it sets `writingDirection`), `start`/`end` utilities, and `useDirection()` for pixel maths.
- **Packages**: `domain`, `api`, `db-user` and `db-content` keep one `src/<feature>/` folder per feature plus `src/shared/`, imported as `@alrisali/<package>/<feature>`. A feature imports only its own subpath and `shared`; web `admin-<x>` features own `<x>`. oRPC contracts are written first in `packages/api/src/<feature>/`; the server implements them in `apps/server/src/features/<feature>/` from `@/shared/lib/orpc`; clients call them through `shared/lib/orpc`.
- **Enforcement**: `bun run check` runs oxlint `no-restricted-imports` (rules generated from the folders on disk in `scripts/boundaries/oxlint-boundaries.ts`) and dependency-cruiser (`.dependency-cruiser.cjs`, also `bun run check:boundaries`). A boundary error names the rule it broke; restructure the import rather than silencing it.

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `bunx ultracite fix`
- **Check for issues**: `bunx ultracite check`
- **Diagnose setup**: `bunx ultracite doctor`

Oxlint + Oxfmt (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns
- Avoid import cycles; move shared code into a module both sides import

### Security

- Add `rel="noopener noreferrer"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Oxlint + Oxfmt Can't Help

Oxlint + Oxfmt will catch most mechanical issues automatically. Focus your attention on:

1. **Business logic correctness** - Oxlint + Oxfmt can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Oxlint + Oxfmt. Run `bunx ultracite fix` before committing to ensure compliance.
