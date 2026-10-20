import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { ServiceError } from "../src/errors.js";
const config = {
  origins: ["https://energybot.onrender.com"],
  objectPath: "audit.pdf",
  groqKey: "test-only",
  supabaseKey: "test-only",
};
async function running(t, overrides = {}) {
  const app = createApp({
    config,
    reports: { get: async () => ({ pageCount: 73, imageHeavyPages: [18] }) },
    answer: async () => ({ answer: "Test response", citations: [] }),
    ...overrides,
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}
test("health and report readiness expose no credentials", async (t) => {
  const url = await running(t);
  const health = await (await fetch(`${url}/health`)).json();
  assert.deepEqual(health, { status: "ok", configured: true });
  const report = await (await fetch(`${url}/api/report`)).json();
  assert.equal(report.filename, "audit.pdf");
  assert.equal(report.pageCount, 73);
  assert.ok(!JSON.stringify(report).includes("test-only"));
});
test("CORS permits configured site and rejects unknown origins", async (t) => {
  const url = await running(t);
  const allowed = await fetch(`${url}/api/chat`, {
    method: "OPTIONS",
    headers: { Origin: config.origins[0] },
  });
  assert.equal(allowed.status, 204);
  assert.equal(
    allowed.headers.get("access-control-allow-origin"),
    config.origins[0],
  );
  assert.equal(
    (
      await fetch(`${url}/api/report`, {
        headers: { Origin: "https://unknown.example" },
      })
    ).status,
    403,
  );
});
test("invalid JSON and oversized requests fail without model calls", async (t) => {
  const url = await running(t, {
    answer: async () => {
      throw new Error("not expected");
    },
  });
  const send = (body) =>
    fetch(`${url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  assert.equal((await send("{bad")).status, 400);
  assert.equal(
    (await send(JSON.stringify({ question: "x".repeat(30000) }))).status,
    413,
  );
  assert.equal(
    (await send(JSON.stringify({ question: "", mode: "report" }))).status,
    400,
  );
});
test("API limits requests and returns a retryable 429", async (t) => {
  const url = await running(t, { limit: 1 });
  const send = () =>
    fetch(`${url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Test", mode: "electrical" }),
    });
  assert.equal((await send()).status, 200);
  assert.equal((await send()).status, 429);
});
test("provider errors return stable codes without leaking details", async (t) => {
  const url = await running(t, {
    reports: {
      get: async () => {
        throw new ServiceError("REPORT_UNAVAILABLE");
      },
    },
  });
  const response = await fetch(`${url}/api/report`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "REPORT_UNAVAILABLE" });
});
