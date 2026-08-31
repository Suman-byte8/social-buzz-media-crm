"use client";

import React, { useState } from "react";
import SendAgreementEmailModal from "./SendAgreementEmailModal";
import { sendAgreementEmail } from "./agreementEmail";

const GmailIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#4CAF50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" />
    <path fill="#1E88E5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z" />
    <polygon fill="#E53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
    <path
      fill="#C62828"
      d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"
    />
    <path
      fill="#FBC02D"
      d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"
    />
  </svg>
);

/**
 * Agreements are shared by email only. Clicking the icon opens an in-app
 * confirm → sending → result modal (SendAgreementEmailModal) instead of
 * window.confirm()/alert() — this component owns that lifecycle.
 */
export default function AgreementEmailButton({ agreement, client }) {
  const hasEmail = Boolean(client?.email);
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState("confirm"); // "confirm" | "sending" | "success" | "error"
  const [resultMessage, setResultMessage] = useState("");

  const openModal = () => {
    if (!hasEmail) return;
    setStatus("confirm");
    setResultMessage("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (status === "sending") return; // don't allow dismissing mid-send
    setModalOpen(false);
  };

  const handleConfirmSend = async () => {
    setStatus("sending");
    try {
      const result = await sendAgreementEmail(agreement, client);
      setStatus("success");
      setResultMessage(
        result.method === "attachment"
          ? `Agreement emailed to ${client.email}.`
          : "Couldn't send it automatically, so we opened your mail app with a link to the agreement instead."
      );
    } catch (e) {
      setStatus("error");
      setResultMessage(e.message || "Could not send the agreement email. Please try again.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={!hasEmail}
        title={hasEmail ? `Email agreement to ${client.email}` : "No client email on file"}
        className="p-1.5 text-secondary hover:text-primary hover:bg-gray-100 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {modalOpen && status === "sending" ? (
          <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
        ) : (
          <GmailIcon />
        )}
      </button>

      <SendAgreementEmailModal
        open={modalOpen}
        agreement={agreement}
        client={client}
        status={status}
        resultMessage={resultMessage}
        onConfirm={handleConfirmSend}
        onClose={closeModal}
      />
    </>
  );
}
