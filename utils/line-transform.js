export const allowedExtensions = [
  ".ts",
  ".png",
  ".jpg",
  ".webp",
  ".ico",
  ".html",
  ".js",
  ".css",
  ".txt",
];

function isAbsoluteUrl(url) {
  return /^https?:\/\//i.test(url);
}

export function createLineTransform(baseUrl) {
  let buffer = "";

  return new TransformStream({
    transform(chunk, controller) {
      const text = buffer + new TextDecoder().decode(chunk);
      const lines = text.split(/\r?\n/);
      buffer = lines.pop() || "";

      const processed = lines
        .map((line) => {
          // Check if it's a video segment first (even if absolute)
          if (
            line.endsWith(".m3u8") ||
            line.endsWith(".ts") ||
            line.endsWith(".html")
          ) {
            const fullUrl = isAbsoluteUrl(line)
              ? line // Use as-is if already absolute
              : line.startsWith("/")
              ? `${new URL(baseUrl).origin}${line}`
              : `${baseUrl}${line}`;
            return `/m3u8-proxy?url=${fullUrl}`;
          }

          // Return absolute URLs as-is only if they're not video segments
          if (isAbsoluteUrl(line)) return line;

          if (allowedExtensions.some((ext) => line.endsWith(ext))) {
            const fullUrl = line.startsWith("/")
              ? `${new URL(baseUrl).origin}${line}`
              : `${baseUrl}${line}`;
            return `/m3u8-proxy?url=${fullUrl}`;
          }

          return line;
        })
        .join("\n");

      controller.enqueue(new TextEncoder().encode(processed + "\n"));
    },
    flush(controller) {
      if (buffer) {
        const line = buffer;
        let final = line;

        // Check for video segments first (even if absolute)
        if (
          line.endsWith(".m3u8") ||
          line.endsWith(".ts") ||
          line.endsWith(".html")
        ) {
          const fullUrl = isAbsoluteUrl(line)
            ? line // Use as-is if already absolute
            : line.startsWith("/")
            ? `${new URL(baseUrl).origin}${line}`
            : `${baseUrl}${line}`;
          final = `/m3u8-proxy?url=${fullUrl}`;
        } else if (!isAbsoluteUrl(line)) {
          // Handle other allowed extensions only if not absolute
          if (allowedExtensions.some((ext) => line.endsWith(ext))) {
            const fullUrl = line.startsWith("/")
              ? `${new URL(baseUrl).origin}${line}`
              : `${baseUrl}${line}`;
            final = `/m3u8-proxy?url=${fullUrl}`;
          }
        }

        controller.enqueue(new TextEncoder().encode(final));
      }
    },
  });
}
