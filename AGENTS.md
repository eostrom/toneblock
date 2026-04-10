## Process

- On encountering obstacles, ask the user for guidance.
    - Example: if a test suite fails because a web platform API is not implemented in the testing environment,
      ask the user before creating a mock implementation.
- Use Wallaby to check test status and code coverage. 

## Configuration

- Reuse tools already in use when possible.
  - For example, if the project uses pnpm, use pnpm to manage dependencies.

## Code style

- Avoid abbreviations, especially one-letter ones.
    - For example, use `position`, not `pos`.  
    - Allow exceptions for one-line functions and consistency with libraries.
- If a JSDoc comment can fit on one line, keep it on one line.
- If a function can fit on one line (without braces), keep it on one line.
- If an if statement can fit on one line (without braces), keep it on one line.
- In JSDoc comments, test descriptions, and other prose, use backquotes to mark variable names, type names, and other code terms.
  - Don't quote "null" or "true" or "false."
  - In some cases an English word or phrase is better than a code term. For example "a solved grid" instead of `solvedGrid`.

## Testing

- Prefer the `user-event` library over the lower-level `fireEvent` interface.
- Avoid terms like "should" and "correctly" in test descriptions.
  - Tests are inherently about how the code should correctly behave. The test decription should describe that behavior.
  - Example: Instead of "should return the correct value", write "returns the sum of its parameters."
- Avoid inline comments that merely restate what the code is doing.
  - Comments should explain *why* the code is doing what it is doing. 
