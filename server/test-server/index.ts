// bun run server/test-server/index.ts
// @ts-ignore
import { serve } from "bun";
serve({
  port: 4096,
  hostname: "0.0.0.0",
  fetch(req) {
    return new Response("Hello, world!", {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
});
console.log("Server is running on http://0.0.0.0:4096");