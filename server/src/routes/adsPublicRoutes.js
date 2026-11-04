import express from "express";
import crypto from "crypto";
import { syncAds, ingestAdLead, normalizeGoogleLead, ingestMetaLeadgenEvent } from "../utils/adsSync.js";

// Endpoints called by machines, not signed-in users: the scheduled sync
// (GitHub Actions) and the Google / Meta lead webhooks. Mounted before the
// JWT gate in index.js, so each one checks its own shared secret instead,
// and each is disabled (503) until that secret is configured.
const router = express.Router();

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

// ── Scheduled sync ──────────────────────────────────────────────────────

router.post("/ads/cron-sync", async (req, res) => {
  const secret = process.env.ADS_SYNC_SECRET;
  if (!secret) return res.status(503).json({ success: false, message: "ADS_SYNC_SECRET is not configured" });
  if (!safeEqual(req.get("X-Sync-Secret"), secret)) return res.status(401).json({ success: false, message: "Invalid sync secret" });

  try {
    const days = req.query.days || req.body?.days;
    const results = await syncAds(req.app.locals.models, { days, trigger: "cron" });
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("[ads] Scheduled sync failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Google Ads lead form webhook ────────────────────────────────────────
// Configured per lead form in Google Ads: Webhook URL = this endpoint,
// Key = GOOGLE_ADS_LEAD_WEBHOOK_KEY. Google sends the key in the body.

router.post("/ads/webhooks/google-leads", async (req, res) => {
  const key = process.env.GOOGLE_ADS_LEAD_WEBHOOK_KEY;
  if (!key) return res.status(503).json({ message: "GOOGLE_ADS_LEAD_WEBHOOK_KEY is not configured" });
  if (!safeEqual(req.body?.google_key, key)) return res.status(401).json({ message: "Invalid key" });
  if (!req.body?.lead_id) return res.status(400).json({ message: "lead_id is required" });

  try {
    await ingestAdLead(req.app.locals.models, normalizeGoogleLead(req.body));
    res.status(200).json({});
  } catch (error) {
    console.error("[ads] Google lead webhook failed:", error);
    // A non-2xx makes Google retry the delivery later.
    res.status(500).json({ message: "Could not store lead" });
  }
});

// ── Meta Page `leadgen` webhook ─────────────────────────────────────────
// Callback URL = this endpoint, Verify token = META_WEBHOOK_VERIFY_TOKEN.

router.get("/ads/webhooks/meta", (req, res) => {
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) return res.status(503).send("META_WEBHOOK_VERIFY_TOKEN is not configured");
  if (req.query["hub.mode"] === "subscribe" && safeEqual(req.query["hub.verify_token"], verifyToken)) {
    return res.status(200).type("text/plain").send(String(req.query["hub.challenge"] || ""));
  }
  return res.sendStatus(403);
});

router.post("/ads/webhooks/meta", (req, res) => {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) return res.status(503).send("META_APP_SECRET is not configured");

  // Meta signs the exact raw bytes; req.rawBody is kept by express.json's
  // `verify` hook in index.js.
  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(req.rawBody || "").digest("hex")}`;
  if (!safeEqual(req.get("X-Hub-Signature-256"), expected)) return res.sendStatus(401);

  // Acknowledge first — Meta expects a fast 200 and retries slow deliveries.
  res.sendStatus(200);

  const models = req.app.locals.models;
  for (const entry of req.body?.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "leadgen" || !change.value?.leadgen_id) continue;
      ingestMetaLeadgenEvent(models, change.value).catch((err) => {
        // Not lost: the next scheduled sync polls the lead forms again.
        console.error(`[ads] Meta lead ${change.value.leadgen_id} failed:`, err.message);
      });
    }
  }
});

export default router;
