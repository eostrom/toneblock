/**
 * Wraps a promise-returning function to discard its return value.
 * Useful for event handlers where a void return is expected and the promise
 * is intentionally not awaited.
 *
 * @param f - The promise-returning function to wrap.
 * @returns A function that calls `f` and discards the result.
 */
export const unwait =
  <Params extends unknown[], Result>(f: (...args: Params) => Promise<Result>) =>
  (...args: Params): void => {
    void f(...args)
  }
