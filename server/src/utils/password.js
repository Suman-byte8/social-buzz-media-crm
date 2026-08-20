import crypto from "crypto";
import bcrypt from "bcryptjs";

const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(String(process.env.SESSION_SECRET || "social_buzz_media_crm_secret_key_32bytes"))
  .digest();

const isEncrypted = (text) =>
  typeof text === "string" && text.startsWith("enc:");

const isBcryptHash = (text) =>
  typeof text === "string" && (text.startsWith("$2a$") || text.startsWith("$2b$"));

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
    try {
      const parts = text.split(":");
      const iv = Buffer.from(parts[1], "hex");
      const encryptedText = parts[2];
      const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (err) {
      console.error("Decryption error:", err.message);
      return text;
    }
  }
  if (isBcryptHash(text)) {
    console.warn("Legacy bcrypt hash detected — cannot decrypt. User must re-save password.");
    return "";
  }
  return text;
};

export const needsReEncryption = (text) => {
  return !text || isBcryptHash(text) || (!isEncrypted(text) && text !== "");
};

export const comparePassword = (inputPassword, storedPassword) => {
  if (!inputPassword || !storedPassword) return false;
  if (isBcryptHash(storedPassword)) {
    return bcrypt.compareSync(inputPassword, storedPassword);
  }
  const actualPassword = decryptPassword(storedPassword);
  return inputPassword === actualPassword;
};
