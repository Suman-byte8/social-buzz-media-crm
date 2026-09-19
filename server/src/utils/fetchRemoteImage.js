import dns from "node:dns/promises";
import net from "node:net";

// Used by the Notes tab's "image links" flow: the user pastes a URL to an
// image hosted elsewhere, and we mirror it into Drive so the note doesn't
// depend on that link staying alive. Fetching a URL the user supplies is an
// SSRF vector (it could point at an internal service instead of an image
// host), so this validates scheme, resolved IP, response content-type, and
// size before anything is handed back to the caller.
const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20MB
const FETCH_TIMEOUT_MS = 15000;

const isPrivateIp = (ip) => {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
    return false;
  }
  // IPv6 loopback/link-local/unique-local
  const lower = ip.toLowerCase();
  return lower === "::1" || lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd");
};

export const fetchImageAsBuffer = async (imageUrl) => {
  let parsed;
  try {
    parsed = new URL(imageUrl);
  } catch {
    throw new Error("Invalid image URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https image URLs are allowed");
  }

  const addresses = await dns.lookup(parsed.hostname, { all: true }).catch(() => []);
  if (addresses.length === 0) {
    throw new Error("Could not resolve image host");
  }
  if (addresses.some((addr) => isPrivateIp(addr.address))) {
    throw new Error("This image URL is not allowed");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(parsed.toString(), { signal: controller.signal, redirect: "follow" });
  } catch (err) {
    throw new Error(`Could not fetch image: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Image URL responded with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error("That URL does not point to an image");
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large (max 20MB)");
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large (max 20MB)");
  }

  const nameFromPath = parsed.pathname.split("/").filter(Boolean).pop() || "image";
  const hasExtension = /\.[a-z0-9]{2,5}$/i.test(nameFromPath);
  const extension = contentType.split("/")[1]?.split(";")[0] || "jpg";
  const fileName = hasExtension ? nameFromPath : `${nameFromPath}.${extension}`;

  return { buffer, contentType, fileName };
};
