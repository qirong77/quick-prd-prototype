#!/usr/bin/env node
/**
 * 本地执行 `next build --turbopack` 后，将 standalone 可运行目录复制到 `server/remote-dist/`，便于上传到弱性能服务器。
 * 结构对齐 Next 官方：standalone + `.next/static` + `public`。
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

process.chdir(root);

console.log("[build:remote] next build --turbopack …");
execSync("npx next build --turbopack", { stdio: "inherit", env: process.env });

const standaloneDir = join(root, ".next", "standalone");
const staticSrc = join(root, ".next", "static");
const remoteDir = join(root, "server", "remote-dist");

if (!existsSync(standaloneDir)) {
    console.error('[build:remote] 未找到 .next/standalone，请确认 next.config 中已设置 output: "standalone"。');
    process.exit(1);
}
if (!existsSync(staticSrc)) {
    console.error("[build:remote] 未找到 .next/static");
    process.exit(1);
}

console.log("[build:remote] 写入 server/remote-dist/ …");
rmSync(remoteDir, { recursive: true, force: true });
mkdirSync(remoteDir, { recursive: true });

cpSync(standaloneDir, remoteDir, { recursive: true });

const remoteStatic = join(remoteDir, ".next", "static");
mkdirSync(dirname(remoteStatic), { recursive: true });
cpSync(staticSrc, remoteStatic, { recursive: true });

const publicSrc = join(root, "public");
const publicDst = join(remoteDir, "public");
if (existsSync(publicSrc)) {
    cpSync(publicSrc, publicDst, { recursive: true });
} else {
    mkdirSync(publicDst, { recursive: true });
}

/** 仅上传 `server/remote-dist/` 到服务器时，在服务器目录内执行 `npm start`（默认端口见根目录 `npm run start:remote`） */
const rootPkgPath = join(root, "package.json");
let pkgVersion = "0.0.0";
try {
    const pkg = JSON.parse(readFileSync(rootPkgPath, "utf8"));
    if (typeof pkg.version === "string") pkgVersion = pkg.version;
} catch {
    /* ignore */
}
writeFileSync(join(remoteDir, "package.json"), readFileSync(join(root, "package.json"), "utf8"), "utf8");

console.log("[build:remote] 完成：server/remote-dist/ 内含 node_modules 与 .next，为 Next standalone 运行所需（无法在服务端省略）。");
