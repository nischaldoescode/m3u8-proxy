import { createLineTransform,  allowedExtensions, } from "../utils/line-transform.js";

export async function m3u8Proxy(ctx) {
  try {
    const url = ctx.request.url.searchParams.get("url");
    if (!url) {
      ctx.response.status = 400;
      ctx.response.body = "url is required";
      return;
    }

    const isStatic = allowedExtensions.some((ext) => url.endsWith(ext));
    const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);

    const urlObj = new URL(url);
    const domain = `${urlObj.protocol}//${urlObj.hostname}`;

    const response = await fetch(url, {
      headers: {
        accept: "*/*",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "sec-ch-ua": `"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"`,
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": `"Windows"`,
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
    });

    console.log("Response status:", response.status, "for URL:", url);
    console.log(
      "Response headers:",
      [...response.headers.entries()],
      "for URL:",
      url
    );
    if (!response.ok || !response.body) {
      console.error(
        `Fetch failed: ${response.status} ${response.statusText} for URL: ${url}`
      );
      ctx.response.status = 502;
      ctx.response.body = `Failed to fetch upstream: ${response.status} ${response.statusText}`;
      return;
    }
    const headers = new Headers(response.headers);
    if (!isStatic) headers.delete("content-length");
    const originalContentType = response.headers.get("content-type");

    if (
      url.endsWith(".m3u8") &&
      !originalContentType.includes("mpegurl") &&
      !originalContentType.includes("text/plain")
    ) {
      const text = await response.text();
      console.error("Expected m3u8 but got HTML/Error page:", text.slice(0,200));
      ctx.response.status = 502;
      ctx.response.body = "Upstream returned HTML instead of m3u8";
      return;
    }


    // Allow CORS
    headers.set("access-control-allow-origin", "*");
    if (url.endsWith(".m3u8")) {
      headers.set("content-type", "application/vnd.apple.mpegurl");
    }

    const isVideoSegment = url.includes("page-") && url.endsWith(".html");
    if (isVideoSegment && !originalContentType?.includes("mpegurl")) {
      const responseData = await response.arrayBuffer();
      const uint8Array = new Uint8Array(responseData);

      const binaryData = extractTsDataFromHtml(uint8Array, url);

      if (binaryData) {
        // Override content-type for video segments
        headers.set("content-type", "video/mp2t");
        headers.set("content-disposition", "inline");
        headers.delete("content-encoding");
        headers.set("content-length", binaryData.length.toString());

        ctx.response.status = 200;
        ctx.response.headers = headers;
        ctx.response.body = binaryData;
        return;
      } else {
        console.error("Could not extract TS data from HTML wrapper");
        ctx.response.status = 502;
        ctx.response.body = "Failed to extract video data";
        return;
      }
    }

    ctx.response.status = 200;
    ctx.response.headers = headers;

    const upstreamStream = response.body;

    const resultStream = isStatic
      ? upstreamStream
      : upstreamStream.pipeThrough(createLineTransform(baseUrl));

    ctx.response.body = resultStream;
  } catch (err) {
    console.error(err);
    ctx.response.status = 500;
    ctx.response.body = "Internal Server Error";
  }
  // Function to extract TS data from HTML wrapper
  function extractTsDataFromHtml(uint8Array, url) {
    try {
      // Look for the TS sync byte pattern (0x47) to find where binary data starts
      let startIndex = -1;
      let endIndex = uint8Array.length;

      // Find the first occurrence of TS sync byte (0x47)
      for (let i = 0; i < uint8Array.length; i++) {
        if (uint8Array[i] === 0x47) {
          // Verify this is actually TS data by checking if sync bytes repeat every 188 bytes
          let isValidTs = true;
          for (
            let j = i;
            j < Math.min(i + 188 * 5, uint8Array.length);
            j += 188
          ) {
            if (uint8Array[j] !== 0x47) {
              isValidTs = false;
              break;
            }
          }
          if (isValidTs) {
            startIndex = i;
            break;
          }
        }
      }

      if (startIndex === -1) {
        console.error("No TS sync bytes found");
        return null;
      }

      // Find the end of binary data by looking backwards from the end
      const textDecoder = new TextDecoder("utf-8", { fatal: false });
      const endPortion = textDecoder.decode(uint8Array.slice(-500)); // Check last 500 bytes

      // If we find HTML markers at the end, work backwards to find where binary data ends
      const htmlEndMarkers = [
        "</div>",
        "</html>",
        "shadowDomRoot",
        "bis_skin_checked",
      ];
      let foundHtmlEnd = false;

      for (const marker of htmlEndMarkers) {
        if (endPortion.includes(marker)) {
          foundHtmlEnd = true;
          break;
        }
      }

      if (foundHtmlEnd) {
        // Work backwards from end to find last valid TS packet
        for (let i = uint8Array.length - 1; i >= startIndex; i--) {
          if (uint8Array[i] === 0x47 && (i - startIndex) % 188 === 0) {
            endIndex = i + 188; // Include the complete TS packet
            break;
          }
        }
      }

      console.log(
        `Extracted TS data: ${startIndex} to ${endIndex} (${
          endIndex - startIndex
        } bytes) for URL: ${url}`
      );

      // Return the extracted binary TS data
      return uint8Array.slice(startIndex, endIndex);
    } catch (error) {
      console.error("Error extracting TS data:", error);
      return null;
    }
  }
}





