import { sendDocumentEmail } from "@/services/clientService";
import { API_BASE_URL } from "@/services/apiClient";

// Agreements are shared by email only (no WhatsApp) — a real "attach the
// file" WhatsApp send needs either browser file-share support (unreliable
// on desktop) or the WhatsApp Business API, neither of which is in scope.

const getStreamUrl = (agreement) => `${API_BASE_URL}/documents/${agreement.id}/stream`;

const buildMessage = (agreement, { attached, link } = {}) => {
  if (attached) {
    return `Hi, please find the agreement "${agreement.fileName}" attached.`;
  }
  let message = `Hi, please find the agreement "${agreement.fileName}".`;
  if (link) {
    message += `\n\nView / download: ${link}`;
  }
  return message;
};

/**
 * Sends the agreement to the client's email. Tries a real SMTP send with
 * the PDF attached first (see server/src/utils/mailer.js — requires
 * SMTP_HOST/SMTP_USER/SMTP_PASS in server/.env); if that fails, falls back
 * to opening the user's own mail app with a direct PDF link, since mailto:
 * can't carry an attachment. Returns which path was used so the caller can
 * show the right confirmation message; only throws if there's truly nothing
 * more to try.
 */
export async function sendAgreementEmail(agreement, client) {
  const subject = `Agreement: ${agreement.fileName}`;

  try {
    await sendDocumentEmail(agreement.id, {
      to: client.email,
      subject,
      text: buildMessage(agreement, { attached: true }),
    });
    return { method: "attachment" };
  } catch {
    // Expected when SMTP isn't configured yet or a send fails — fall
    // through to the mailto: fallback below rather than surfacing this as
    // an error.
  }

  const body = buildMessage(agreement, { link: getStreamUrl(agreement) });
  window.location.href = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { method: "mailto" };
}
