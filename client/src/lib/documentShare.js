// Shared helpers for sharing an actual file via WhatsApp instead of a link
// — used by the invoice builder (useInvoiceActions.js). Agreements are
// email-only (see agreementEmail.js) and don't need these.

/**
 * Attempts to hand `blob` to the OS/browser's native share sheet (Web Share
 * API, level 2) so the person can pick WhatsApp/Mail/etc. and the actual
 * file gets attached — not a link. Supported on mobile Chrome/Safari and
 * modern desktop Chrome/Edge; unsupported browsers (e.g. Firefox) should
 * fall back to a link-based flow.
 *
 * Returns "shared" (done), "cancelled" (user closed the share sheet — don't
 * fall back, they declined on purpose), or "unsupported"/"failed" (caller
 * should fall back to a link-based flow).
 */
export async function shareFileNatively({ blob, fileName, mimeType, title, text }) {
  if (typeof navigator === "undefined" || !navigator.canShare) return "unsupported";
  const file = new File([blob], fileName, { type: mimeType });
  if (!navigator.canShare({ files: [file] })) return "unsupported";
  try {
    await navigator.share({ files: [file], title, text });
    return "shared";
  } catch (err) {
    if (err?.name === "AbortError") return "cancelled";
    console.warn("Web Share failed:", err);
    return "failed";
  }
}

// wa.me expects digits only, with country code, no "+" — same format used
// for the WhatsApp click-to-chat button elsewhere on your sites.
export function buildWhatsAppUrl(phoneNumber, message) {
  const digitsOnly = String(phoneNumber).replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
