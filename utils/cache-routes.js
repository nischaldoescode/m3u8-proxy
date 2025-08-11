export function cacheRoutes(maxAgeSeconds = 3600) {
  return async (ctx, next) => {
    await next();

    // Apply Cache-Control only if not already set
    if (!ctx.response.headers.has("Cache-Control")) {
      ctx.response.headers.set(
        "Cache-Control",
        `public, max-age=${maxAgeSeconds}, must-revalidate`
      );
    }
  };
}