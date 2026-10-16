import { sendDocumentEmail } from "@/services/clientService";
import { API_BASE_URL } from "@/services/apiClient";

// Mirrors agreementEmail.js exactly — duplicated only because its subject/
// body copy says "agreement", which would be wrong wording in a proposal
// email. The underlying mechanism (sendDocumentEmail by Document id, the
// SMTP→mailto fallback) is unchanged.

const getStreamUrl = (proposal) => `${API_BASE_URL}/documents/${proposal.id}/stream`;

const buildMessage = (proposal, { attached, link } = {}) => {
  if (attached) {
    return `Hi, please find the proposal "${proposal.fileName}" attached.`;
  }
  let message = `Hi, please find the proposal "${proposal.fileName}".`;
  if (link) {
    message += `\n\nView / download: ${link}`;
  }
  return message;
};

/**
 * Sends the proposal to the client's email. Tries a real SMTP send with the
 * PDF attached first; if that fails, falls back to opening the user's own
 * mail app with a direct PDF link. Returns which path was used so the
 * caller can show the right confirmation message.
 */
export async function sendProposalEmail(proposal, client) {
  const subject = `Proposal: ${proposal.fileName}`;

  try {
    await sendDocumentEmail(proposal.id, {
      to: client.email,
      subject,
      text: buildMessage(proposal, { attached: true }),
    });
    return { method: "attachment" };
  } catch {
    // Expected when SMTP isn't configured yet or a send fails — fall
    // through to the mailto: fallback below rather than surfacing this as
    // an error.
  }

  const body = buildMessage(proposal, { link: getStreamUrl(proposal) });
  window.location.href = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { method: "mailto" };
}
