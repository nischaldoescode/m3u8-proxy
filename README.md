# m3u8-proxy
A Deno Proxy For serving m3u8 playlist url through the proxy.

# Usage
There is no main endpoint here which will show you, welcome stuff.
That is why You will have serve your m3u8 url as

`/m3u8-proxy?url=<YOUR_URL_HERE>`

# Working
if you parse the actual m3u8 url it will rewrite the m3u8 content as
You will need to provide a valid master playlist or the index playlist for this to work

 ## Original
    https://example.com/index.m3u8

 ## From the Proxy
  ``/m3u8-proxy?url=https://example.com/index.m3u8``

# Note It will also replace the segments or any file present on the index.m3u8
  ## Original
      https://example.com/segment-0.ts
  
  ## From the Proxy
      /m3u8-proxy?url=https://example.com/segment-0.ts
  
  ## It will also work for segment file data which are binary and wrapped around .html files Some Providers do that in that case Your index.m3u8 will contain .html files which are just segment data but are being        wrapped around these files as text 
  
### index Playlist in such case

          https://example.com/segment-0.html
          
### Which will be treated same as .ts file throught the proxy

# IF you hate this readme then I am happy if you Format this. I hate writing Docs.. Thank You.
