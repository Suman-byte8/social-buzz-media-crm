import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const PREFIX = "enc:v1:";

const getKey = () => {
  const secret = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY is not set in environment variables");
  }
  return crypto.createHash("sha256").update(secret).digest();
};

export const encryptText = (plainText) => {
  if (plainText === null || plainText === undefined || plainText === "") return plainText;

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
};

export const decryptText = (value) => {
  if (typeof value !== "string" || !value.startsWith(PREFIX)) return value;

  try {
    const [ivB64, tagB64, dataB64] = value.slice(PREFIX.length).split(":");
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Failed to decrypt value:", error.message);
    return "";
  }
};
