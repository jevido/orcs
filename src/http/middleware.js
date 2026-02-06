/**
 * Composes an array of middleware functions and a final handler
 * into a single async function (onion model).
 */
export function compose(middlewares, handler) {
  return async function (ctx) {
    let index = -1;

    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;

      if (i < middlewares.length) {
        return await middlewares[i](ctx, () => dispatch(i + 1));
      }

      return await handler(ctx);
    }

    return dispatch(0);
  };
}
