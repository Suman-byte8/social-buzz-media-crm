import crypto from "crypto";
import bcrypt from "bcryptjs";

const ALGORITHM = "aes-256-cbc";

// The encryption/decryption key is derived from a secret string.
//
// Historically the key was `SHA256(SESSION_SECRET || hardcoded default)`, and
// this value differed between environments (dev vs Render) and over time as
// `.env` values changed. Because the shared database holds passwords encrypted
// under an older key, decrypting with only the "current" single key can fail
// with OpenSSL's `bad decrypt` on deployments lacking a matching SESSION_SECRET.
//
// To stay backwards-compatible, we keep an ordered list of *candidate* secrets
// used for decryption. The first candidate whose key successfully produces
// printable output wins. New writes always use the current (first) secret.
const secretCandidates = [
  process.env.SESSION_SECRET,
  // Previous default fallback (was used when SESSION_SECRET was unset).
  "social_buzz_media_crm_secret_key_32bytes",
  // Previous .env value (used in local/dev before a dedicated secret existed).
  "your_session_secret",
].filter(Boolean).filter((value, index, arr) => arr.indexOf(value) === index);

const ENCRYPTION_KEYS = secretCandidates.map((secret) =>
  crypto.createHash("sha256").update(String(secret)).digest()
);

// Primary key used for NEW encryptions. When SESSION_SECRET is set that is the
// current secret; otherwise we fall back to the first known candidate.
const ENCRYPTION_KEY = ENCRYPTION_KEYS[0];

const isEncrypted = (text) =>
  typeof text === "string" && text.startsWith("enc:");

const isBcryptHash = (text) =>
  typeof text === "string" && (text.startsWith("$2a$") || text.startsWith("$2b$"));

// Heuristic to reject AES-CBC output that decrypted with the wrong key but
// happened to pass OpenSSL padding checks (produces non-ASCII garbage). Real
// passwords are short printable text; ASCII-only non-control characters are a
// very strong signal the right key was used.
const looksLikePassword = (text) => {
  if (!text || text.length < 1 || text.length > 256) return false;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const printable =
      (code >= 0x20 && code <= 0x7e) || // ASCII printable (incl. space)
      code === 0x09 || code === 0x0a || code === 0x0d; // tabs/newlines
    if (!printable) return false;
  }
  return true;
};

const decryptWith = (key, iv, encryptedHex) => {
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

export const encryptPassword = (text) => {
  if (!text) return null;
  if (isEncrypted(text)) return text;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `enc:${iv.toString("hex")}:${encrypted}`;
};

export const decryptPassword = (text) => {
  if (!text) return "";
  if (isEncrypted(text)) {
    const parts = text.split(":");
    if (parts.length >= 3) {
      const iv = Buffer.from(parts[1], "hex");
      const encryptedText = parts[2];
      for (let i = 0; i < ENCRYPTION_KEYS.length; i++) {
        try {
          const decrypted = decryptWith(ENCRYPTION_KEYS[i], iv, encryptedText);
          if (looksLikePassword(decrypted)) {
            if (i > 0) {
              // eslint-disable-next-line no-console
              console.warn(
                `[password] Decrypted with fallback secret candidate #${i}. ` +
                  `Set SESSION_SECRET consistently across deployments.`
              );
            }
            return decrypted;
          }
        } catch (err) {
          // Wrong key (bad decrypt/padding) or invalid data — try next candidate.
        }
      }
      // eslint-disable-next-line no-console
      console.error(
        "[password] Could not decrypt stored password with any known key."
      );
      return "";
    }
    return "";
  }
  if (isBcryptHash(text)) {
    // eslint-disable-next-line no-console
    console.error(
      "Legacy bcrypt hash cannot be decrypted. User must re-save password."
    );
    return "";
  }
  return text;
};

export const needsReEncryption = (text) => {
  return !text || isBcryptHash(text) || (!isEncrypted(text) && text !== "");
};

// Async so the legacy-bcrypt-hash fallback path (bcrypt.compare) never
// blocks the event loop — compareSync ties up the whole process for the
// ~100ms a bcrypt comparison takes, which stalls every other in-flight
// request on a single-threaded Node server.
export const comparePassword = async (inputPassword, storedPassword) => {
  if (!inputPassword || !storedPassword) return false;
  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(inputPassword, storedPassword);
  }
  const actualPassword = decryptPassword(storedPassword);
  return inputPassword === actualPassword;
};
