// bun run server/remote-server/index.ts
// 将 `npm run build:remote` 产物目录 server/remote-dist 作为静态站点根目录提供访问
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stat } from "node:fs/promises";

// @ts-ignore — Bun 运行时
import { serve } from "bun";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 4096;
const HOSTNAME = "0.0.0.0";

const ROOT = path.resolve(__dirname, "../remote-dist");

function contentType(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".ico":
      return "image/x-icon";
    case ".woff2":
      return "font/woff2";
    case ".woff":
      return "font/woff";
    default:
      return "application/octet-stream";
  }
}

serve({
  port: PORT,
  hostname: HOSTNAME,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname !== "/" && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    const relative =
      pathname === "/" || pathname === "" ? "index.html" : pathname.slice(1);

    const filePath = path.resolve(ROOT, relative);
    const relToRoot = path.relative(ROOT, filePath);
    if (relToRoot.startsWith("..") || path.isAbsolute(relToRoot)) {
      return new Response("Forbidden", { status: 403 });
    }

    let st;
    try {
      st = await stat(filePath);
    } catch {
      return new Response("Not Found", { status: 404 });
    }

    if (st.isDirectory()) {
      const indexPath = path.join(filePath, "index.html");
      try {
        st = await stat(indexPath);
      } catch {
        return new Response("Not Found", { status: 404 });
      }
      if (!st.isFile()) {
        return new Response("Not Found", { status: 404 });
      }
      // @ts-ignore — Bun
      const file = Bun.file(indexPath);
      return new Response(file, {
        headers: { "Content-Type": contentType(indexPath) },
      });
    }

    if (!st.isFile()) {
      return new Response("Not Found", { status: 404 });
    }

    // @ts-ignore — Bun
    const file = Bun.file(filePath);
    return new Response(file, {
      headers: { "Content-Type": contentType(filePath) },
    });
  },
});

console.log(`Remote static server → ${ROOT}`);
console.log(`Listening on http://${HOSTNAME}:${PORT}`);
