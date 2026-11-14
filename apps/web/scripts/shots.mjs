#!/usr/bin/env node
/**
 * Visual QA: drive a real chromium over the DevTools protocol and capture the
 * site at specific scroll depths.
 *
 *   node scripts/shots.mjs [origin] [outDir]
 *
 * `chromium --screenshot` cannot do this: it captures as soon as load fires,
 * which lands mid-intro-animation, and it cannot scroll — and scroll position
 * is the entire subject of this page. So we attach to the browser, set the
 * scroll, let the scrub settle, then grab the frame.
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";

const origin = process.argv[2] ?? "http://localhost:4317";
const outDir = resolve(process.argv[3] ?? "/tmp/pingus-shots");
const PORT = 9333;
const WIDTH = 1440;
const HEIGHT = 900;

/**
 * name, path, scroll position.
 *
 * Home-page positions are fractions of the scrollable height rather than
 * pixels: the page length changes every time a section is resized, and fixed
 * offsets silently drift off the thing they were meant to show.
 */
const SHOTS = [
  ["01-hero", "/", 0],
  ["02-thaw-a", "/", 0.09],
  ["03-thaw-b", "/", 0.18],
  ["04-thaw-c", "/", 0.27],
  ["05-thaw-d", "/", 0.35],
  ["06-words", "/", 0.46],
  ["07-collection", "/", 0.56],
  ["08-figures", "/", 0.68],
  ["09-rules", "/", 0.78],
  ["10-quote", "/", 0.88],
  ["11-cta", "/", 1.0],
  ["12-mint", "/mint", 0],
  ["13-gallery", "/gallery", 0],
  ["14-token", "/pingu/1337", 0],
];

mkdirSync(outDir, { recursive: true });

const profile = mkdtempSync(join(tmpdir(), "pingus-cdp-"));
const browser = spawn(
  "chromium",
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targetUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const json = await res.json();
      if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error("chromium devtools endpoint never came up");
}

/** Minimal CDP client over the browser-level websocket. */
function connect(url) {
  const ws = new WebSocket(url);
  let nextId = 1;
  const pending = new Map();

  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    if (msg.error) entry.reject(new Error(JSON.stringify(msg.error)));
    else entry.resolve(msg.result);
  });

  const ready = new Promise((res, rej) => {
    ws.addEventListener("open", () => res());
    ws.addEventListener("error", (e) => rej(e));
  });

  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });

  return { ws, ready, send };
}

const wsUrl = await targetUrl();
const cdp = connect(wsUrl);
await cdp.ready;

const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await cdp.send("Target.attachToTarget", {
  targetId,
  flatten: true,
});

const call = (method, params = {}) => cdp.send(method, params, sessionId);

await call("Page.enable");
await call("Runtime.enable");
await call("Emulation.setDeviceMetricsOverride", {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: 1,
  mobile: false,
});

const evaluate = async (expression) => {
  const r = await call("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception?.description ?? "eval failed");
  }
  return r.result?.value;
};

let lastPath = null;
const errors = [];

for (const [name, path, scrollY] of SHOTS) {
  if (path !== lastPath) {
    await call("Page.navigate", { url: `${origin}${path}` });
    // Wait for the app to mount and web fonts to settle.
    await sleep(1400);
    await evaluate("document.fonts.ready.then(() => true)");
    await sleep(600);
    lastPath = path;
  }

  if (scrollY > 0) {
    // Values <= 1 are a fraction of the scrollable height; anything larger is
    // a literal pixel offset.
    await evaluate(`
      (() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const y = ${scrollY} <= 1 ? Math.round(max * ${scrollY}) : ${scrollY};
        window.scrollTo(0, y);
        document.documentElement.scrollTop = y;
        return y;
      })()
    `);
    await sleep(900);
  } else {
    await evaluate("window.scrollTo(0, 0); true");
    await sleep(500);
  }

  const { data } = await call("Page.captureScreenshot", { format: "png" });
  writeFileSync(resolve(outDir, `${name}.png`), Buffer.from(data, "base64"));
  process.stdout.write(`${name} `);
}

// Surface anything the page logged as an error — a silent render failure
// looks identical to a working page in a screenshot.
const pageErrors = await evaluate(
  "JSON.stringify(window.__shotErrors ?? [])"
).catch(() => "[]");
errors.push(...JSON.parse(pageErrors || "[]"));

console.log(`\n${outDir}`);
if (errors.length) console.log("page errors:", errors);

await call("Page.close").catch(() => {});
cdp.ws.close();
browser.kill();
process.exit(0);
