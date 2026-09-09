import { sendDocumentEmail } from "@/services/clientService";
import { API_BASE_URL } from "@/services/apiClient";
import { shareFileNatively, buildWhatsAppUrl } from "@/lib/documentShare";

// Shares an already-uploaded lead document (a PDF proposal/agreement) by
// email or WhatsApp. Unlike the invoice builder's share flow, there's
// nothing to generate here — the file already exists on Drive with a
// Document id — so this is closer to agreementEmail.js, just with a
// WhatsApp path added too.

const getStreamUrl = (document) => `${API_BASE_URL}/documents/${document.id}/stream`;

/**
 * Emails the document to `toEmail`. Tries a real SMTP send with the PDF
 * attached first; if that fails (SMTP not configured, transient error),
 * falls back to opening the user's own mail app with a direct PDF link,
 * since mailto: can't carry an attachment.
 */
export async function shareLeadDocumentByEmail(document, toEmail) {
  const subject = `Document: ${document.fileName}`;

  try {
    await sendDocumentEmail(document.id, {
      to: toEmail,
      subject,
      text: `Hi, please find the document "${document.fileName}" attached.`,
    });
    return { method: "attachment" };
  } catch {
    // Expected when SMTP isn't configured yet or a send fails — fall
    // through to the mailto: fallback below rather than surfacing this as
    // an error.
  }

  const body = `Hi, please find the document "${document.fileName}".\n\nView / download: ${getStreamUrl(document)}`;
  window.location.href = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { method: "mailto" };
}

/**
 * Shares the document to `phoneNumber` over WhatsApp. Tries handing the
 * actual PDF bytes to the OS/browser share sheet first (real attachment,
 * not a link) — supported on mobile Chrome/Safari and modern desktop
 * Chrome/Edge. Falls back to a wa.me link carrying the document's direct
 * PDF link on browsers without file-sharing support.
 */
export async function shareLeadDocumentByWhatsApp(document, phoneNumber) {
  const streamUrl = getStreamUrl(document);
  const message = `Hi, please find the document "${document.fileName}".\n\nView / download: ${streamUrl}`;

  try {
    const res = await fetch(streamUrl);
    if (res.ok) {
      const blob = await res.blob();
      const shareResult = await shareFileNatively({
        blob,
        fileName: document.fileName,
        mimeType: "application/pdf",
        title: document.fileName,
        text: `Hi, please find the document "${document.fileName}" attached.`,
      });
      if (shareResult === "shared" || shareResult === "cancelled") return { method: "native-share" };
    }
  } catch {
    // Expected on browsers/devices without file-sharing support, or a
    // failed fetch — the wa.me link fallback below handles it.
  }

  window.open(buildWhatsAppUrl(phoneNumber, message), "_blank");
  return { method: "wa.me" };
}
