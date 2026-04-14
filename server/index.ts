// bun run server/test-server/index.ts
// pm2 start index.ts --interpreter bun
// @ts-ignore
import { serve } from "bun";

const REDIRECT_URL = "https://quick-prd-prototype.vercel.app/";

serve({
  port: 4096,
  hostname: "0.0.0.0",
  fetch() {
    return Response.redirect(REDIRECT_URL, 302);
  },
});
console.log(
  `Server is running on http://0.0.0.0:4096 → redirects to ${REDIRECT_URL}`,
);