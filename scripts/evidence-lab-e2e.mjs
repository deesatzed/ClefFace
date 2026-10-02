#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const port = Number(process.env.EVIDENCE_LAB_E2E_PORT || 8098);
const url = `http://127.0.0.1:${port}/`;
const server = spawn(process.execPath, ["scripts/with-app-env.mjs", "vite", "dev", "--host", "127.0.0.1", "--port", String(port)], {
  stdio: ["ignore", "pipe", "pipe"],
});
let browser;

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const pageErrors = [];
  desktop.on("pageerror", (error) => pageErrors.push(String(error)));
  const response = await desktop.goto(url, { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200, "homepage must render");
  await assertVisible(desktop, "heading", "Does the answer follow the evidence?");
  await desktop.waitForTimeout(500);
  await desktop.getByRole("tab", { name: "Meaning stays" }).click();
  await desktop.waitForTimeout(100);
  const preservingBody = await desktop.locator("body").innerText();
  assert.match(preservingBody, /same boundary meaning/, `meaning-preserving tab must update the rationale; received: ${preservingBody.slice(0, 1200)}`);
  await desktop.getByRole("button", { name: "Create experiment" }).click();
  await assertVisible(desktop, "heading", "Create an exploratory experiment");
  await desktop.getByLabel("Exact text to replace").fill("larger than 10");
  await desktop.getByLabel("Replacement text (blank removes evidence)").fill("larger than 5");
  await desktop.getByRole("button", { name: "Create exploratory case" }).click();
  await desktop.getByText("Provider unavailable", { exact: false }).waitFor({ state: "visible", timeout: 10000 });
  await desktop.getByRole("button", { name: "Save to library" }).click();
  await desktop.getByText("Saved locally in this browser.", { exact: false }).waitFor({ state: "visible", timeout: 10000 });
  assert.deepEqual(pageErrors, [], "page must not raise uncaught errors");

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(url, { waitUntil: "domcontentloaded" });
  await assertVisible(mobile, "heading", "Does the answer follow the evidence?");
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  assert.equal(overflow, false, "390px mobile view must not have page-level horizontal overflow");
  console.log(JSON.stringify({ ok: true, url, desktop: "core journey passed", mobile: "390px no page overflow" }));
} catch (error) {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
  await Promise.race([new Promise((resolve) => server.once("exit", resolve)), delay(2000)]);
  if (!server.killed) server.kill("SIGKILL");
}

async function waitForServer() {
  let lastError = "not started";
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    if (server.exitCode !== null) throw new Error(`local Vite server exited before ready: ${lastError}`);
    await delay(250);
  }
  throw new Error(`local Vite server did not become ready: ${lastError}`);
}

async function assertVisible(page, role, name) {
  const locator = page.getByRole(role, { name, exact: false });
  await locator.waitFor({ state: "visible", timeout: 10000 });
}
