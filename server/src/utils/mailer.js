import nodemailer from "nodemailer";

// Built once and reused across every call, same pattern as getDriveClient()
// in googleDrive.js — nodemailer's SMTP transport keeps its connection pool
// warm, so rebuilding it per request would throw that away for nothing.
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "Email sending is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS " +
        "(and optionally SMTP_SECURE, MAIL_FROM) in server/.env."
    );
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587,
    secure: SMTP_SECURE === "true", // true for port 465 (implicit TLS), false for 587 (STARTTLS)
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // Without `pool`, nodemailer opens a brand-new TCP+TLS+AUTH handshake
    // with Gmail on every single sendMail() call — that's the dominant cost
    // in production (Gmail is noticeably slower to complete this handshake
    // from cloud/datacenter IPs like Render's than from a home connection).
    // Pooling keeps a small set of authenticated connections open and
    // reuses them across requests within this process's lifetime, so only
    // the first send after a cold start pays full price.
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    // nodemailer's defaults (2min connection / 10min socket) let a stuck
    // send hang far longer than any HTTP client will wait, so a slow Gmail
    // handshake looks like the app is frozen. Fail fast instead so the UI's
    // error state (and a retry) kicks in within seconds, not minutes.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return transporter;
};

export const sendMail = async ({ to, subject, text, attachments }) => {
  const client = getTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  return client.sendMail({ from, to, subject, text, attachments });
};
