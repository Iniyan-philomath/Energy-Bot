import express from "express";
import { rateLimit } from "express-rate-limit";
import { ServiceError } from "./errors.js";
import { validateChat } from "./assistant.js";
export function createApp({ answer, reports, config, limit = 12 }) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Cache-Control", "no-store");
    const origin = req.get("Origin");
    const isAllowed =
      !origin ||
      config.origins.includes(origin) ||
      origin.endsWith(".onrender.com") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1");

    if (origin && isAllowed) {
      res.set("Access-Control-Allow-Origin", origin);
      res.vary("Origin");
    }
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      if (!isAllowed) return res.status(403).json({ error: "ORIGIN_NOT_ALLOWED" });
      return res.sendStatus(204);
    }
    if (origin && !isAllowed) {
      return res.status(403).json({ error: "ORIGIN_NOT_ALLOWED" });
    }
    next();
  });
  app.get("/health", (_req, res) =>
    res.json({
      status: "ok",
      configured: !!(config.groqKey && config.supabaseKey),
    }),
  );
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 60,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "RATE_LIMITED" },
    }),
  );
  app.use(express.json({ limit: "24kb" }));
  app.get("/api/report", async (_req, res, next) => {
    try {
      const report = await reports.get();
      res.json({
        ready: true,
        filename: config.objectPath.split("/").at(-1),
        pageCount: report.pageCount,
        imageHeavyPages: report.imageHeavyPages,
        modelConfigured: !!config.groqKey,
      });
    } catch (error) {
      next(error);
    }
  });
  let inFlight = 0;
  app.post(
    "/api/chat",
    rateLimit({
      windowMs: 60000,
      limit,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "RATE_LIMITED" },
    }),
    rateLimit({
      windowMs: 60000,
      limit: 60,
      keyGenerator: () => "model-budget",
      standardHeaders: false,
      legacyHeaders: false,
      message: { error: "RATE_LIMITED" },
    }),
    async (req, res, next) => {
      if (inFlight >= 3) return res.status(429).json({ error: "SERVER_BUSY" });
      inFlight++;
      try {
        const input = validateChat(req.body);
        res.json(await answer(input));
      } catch (error) {
        next(error);
      } finally {
        inFlight--;
      }
    },
  );
  app.use((_req, res) => res.status(404).json({ error: "NOT_FOUND" }));
  app.use((error, _req, res, _next) => {
    if (error.type === "entity.too.large")
      return res.status(413).json({ error: "REQUEST_TOO_LARGE" });
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ error: "INVALID_JSON" });
    const known = error instanceof ServiceError;
    console.error("API request failed:", known ? error.code : "INTERNAL_ERROR");
    res
      .status(known ? error.status : 500)
      .json({ error: known ? error.code : "INTERNAL_ERROR" });
  });
  return app;
}
