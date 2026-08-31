// Render's free tier spins a web service down after ~15 minutes without
// any inbound HTTP traffic, and the next request then pays a 30-60s cold
// start. Pinging our own public URL on an interval shorter than that
// timeout counts as genuine inbound traffic, so Render never sees the
// service go idle in the first place.
//
// RENDER_EXTERNAL_URL is set automatically by Render on every web service
// (https://render.com/docs/environment-variables#all-services) — nothing
// to configure there. Locally (and on any host that doesn't set it) this
// just logs once and does nothing, since there's no cold-start problem to
// work around in dev.
const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes — safely under Render's ~15 minute idle timeout

export const startKeepAlivePing = () => {
  const baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.KEEP_ALIVE_URL;

  if (!baseUrl) {
    console.log("[keep-alive] No RENDER_EXTERNAL_URL/KEEP_ALIVE_URL set — skipping self-ping (expected outside Render).");
    return;
  }

  const ping = async () => {
    try {
      const start = Date.now();
      const res = await fetch(baseUrl);
      console.log(`[keep-alive] Pinged ${baseUrl} — ${res.status} in ${Date.now() - start}ms`);
    } catch (err) {
      // A single failed ping isn't worth crashing over — Render's own
      // health checks and the next real user request are what actually
      // matter; this is just a best-effort nudge to avoid idling out.
      console.warn(`[keep-alive] Ping to ${baseUrl} failed:`, err.message || err);
    }
  };

  setInterval(ping, PING_INTERVAL_MS);
  console.log(`[keep-alive] Self-ping enabled, every ${PING_INTERVAL_MS / 60000} minutes, targeting ${baseUrl}`);
};
