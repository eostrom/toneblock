## Process

- On encountering obstacles, ask the user for guidance.
    - Example: if a test suite fails because a web platform API is not implemented in the testing environment,
      ask the user before creating a mock implementation.
- When implementing a new feature, write unit tests first to clarify the desired behavior.
- Use Wallaby to check test status and code coverage.
- Run `pnpm lint-check` to identify violations and `pnpm lint-fix` to resolve them automatically where possible.
    - If the lint check fails, **do not disable the rule**. If there's a simple way to fix the violation, do so. Otherwise, notify the user and leave the violation in place.

## Configuration

- Reuse tools already in use when possible.
  - For example, if the project uses pnpm, use pnpm to manage dependencies.

## Code style

- Avoid the `any` type assiduously.
  - Allow it, reluctantly, in tests.
- Use `const` and `let` instead of `var`.
  - Prefer `const` and immutable variables in general.
  - Allow `let` in `for` loops.
- Avoid abbreviations, especially one-letter ones.
  - For example, use `position`, not `pos`.
  - Allow exceptions for one-line functions and consistency with libraries.
- If a JSDoc comment can fit on one line, keep it on one line.
- If a function can fit on one line (without braces), keep it on one line.
- If an if statement can fit on one line (without braces), keep it on one line.
- In JSDoc comments, test descriptions, comments, and other prose, use backquotes to mark variable names, type names, and other code terms.
  - Don't quote "null" or "true" or "false."
  - In some cases an English word or phrase is better than a code term. For example "a solved grid" instead of `solvedGrid`.
- Avoid inline comments that merely restate what the code is doing.
  - Comments should explain _why_ the code is doing what it is doing.

## Implementation practices

- Use `unwait` from `src/utils/promise` to wrap promise-returning functions in event handlers or lifecycle hooks where a void return is expected and the promise is intentionally not awaited.
- SolidJS components
  - Avoid destructuring props or signals, as this breaks reactivity in SolidJS. Use direct access (e.g., `props.name` or `signal()`) unless within a tracking context where it's explicitly desired.

## Testing

- Prefer the `user-event` library over the lower-level `fireEvent` interface.
- Avoid terms like "should" and "correctly" in test descriptions.
  - Tests are inherently about how the code should correctly behave. The test decription should describe that behavior.
  - Example: Instead of "should return the correct value", write "returns the sum of its parameters."
- When testing complex UI states like "indicating move," consider creating or using custom Vitest matchers to keep test assertions readable and semantic.
