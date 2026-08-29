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
  });

  return transporter;
};

export const sendMail = async ({ to, subject, text, attachments }) => {
  const client = getTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  return client.sendMail({ from, to, subject, text, attachments });
};
