"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";

const WhatsAppIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.842.508 3.622 1.454 5.184L2 22l4.978-1.433A9.953 9.953 0 0012.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.06a8.024 8.024 0 01-4.412-1.316l-.316-.19-3.2.921.928-3.128-.207-.324A8.02 8.02 0 013.94 12c0-4.446 3.615-8.06 8.06-8.06s8.06 3.614 8.06 8.06-3.614 8.06-8.059 8.06z" />
  </svg>
);

const EmailIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 6-10 7L2 6" />
  </svg>
);

/**
 * Share button that opens a small menu with two channels: WhatsApp and
 * Email. Each option shows the destination pulled from the selected
 * client's record (phone / email), so the person can see exactly who
 * they're about to message before clicking, and sees "No email id" /
 * "No phone number" inline instead of only finding out after a click.
 */
export default function ShareMenu({
  client,
  isSending,
  onSendWhatsApp,
  onSendEmail,
  shareLabel = "Share invoice",
  busyText = "Preparing invoice link…",
  variant = "dark",
}) {
  const [open, setOpen] = useState(false);
  const [pickedPhoneKey, setPickedPhoneKey] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // The dropdown is rendered into a portal (document.body) rather than
  // inline, positioned via getBoundingClientRect() of the trigger button.
  // Callers that place this inside a scrollable/clipped container (e.g. a
  // table row inside an overflow-x-auto wrapper, which forces overflow-y to
  // clip too) would otherwise have the dropdown cut off.
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handleClickOutside = (e) => {
      if (buttonRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  const hasClient = Boolean(client);

  // All numbers we could reach for this client. The WhatsApp-specific
  // number is listed first (and is the default pick); the general phone
  // number is only added when it actually differs, so a client with a
  // single number never sees redundant choices.
  const phoneOptions = useMemo(() => {
    if (!hasClient) return [];
    const options = [];
    if (client.whatsappNumber) {
      options.push({ key: "whatsapp", label: "WhatsApp", value: client.whatsappNumber });
    }
    if (
      client.phoneNumber &&
      client.phoneNumber !== client.whatsappNumber
    ) {
      options.push({
        key: "phone",
        label: client.whatsappNumber ? "Phone" : "Phone / WhatsApp",
        value: client.phoneNumber,
      });
    }
    // Back-compat: callers that still pass the collapsed `phone` field.
    if (!options.length && client.phone) {
      options.push({ key: "phone", label: "Phone", value: client.phone });
    }
    return options;
  }, [hasClient, client]);

  // The picked number is validated during render instead of via an
  // effect: if the selected client changes (or a key disappears) we fall
  // back to the first available option automatically.
  const selectedPhoneKey = phoneOptions.some((opt) => opt.key === pickedPhoneKey)
    ? pickedPhoneKey
    : phoneOptions[0]?.key ?? null;
  const selectedPhoneNumber =
    phoneOptions.find((opt) => opt.key === selectedPhoneKey)?.value || "";
  const hasPhone = Boolean(selectedPhoneNumber);
  const hasEmail = Boolean(client?.email);
  const hasMultipleNumbers = phoneOptions.length > 1;

  const triggerClassName =
    variant === "light"
      ? "rounded border border-[#DEDBD6] px-3 py-1.5 text-[12px] font-semibold tracking-wide text-ink hover:bg-[#F5F4F2] focus:outline-none focus:ring-2 focus:ring-[#E8262A]/40 disabled:cursor-not-allowed disabled:opacity-50"
      : "rounded border border-white/30 px-3 py-1.5 text-[12px] font-semibold tracking-wide hover:bg-white hover:text-ink focus:outline-none focus:ring-2 focus:ring-white/60 disabled:cursor-not-allowed disabled:opacity-50";

  const menu = open && menuPosition && (
    <div
      ref={menuRef}
      style={{ position: "fixed", top: menuPosition.top, right: menuPosition.right }}
      className="z-60 w-64 rounded-md border border-black/10 bg-white p-2 text-ink shadow-lg"
    >
      <div
        className={`rounded px-2 py-2 ${
          hasPhone && !isSending ? "hover:bg-[#F5F4F2]" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => {
            if (!hasPhone || isSending) return;
            onSendWhatsApp(selectedPhoneNumber);
            setOpen(false);
          }}
          disabled={!hasPhone || isSending}
          className="flex w-full items-center gap-3 text-left text-[13px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
            <WhatsAppIcon />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="font-medium">WhatsApp</span>
            <span className="truncate text-[11px] text-[#6E6A65]">
              {hasPhone ? selectedPhoneNumber : "No phone number"}
            </span>
          </span>
        </button>

        {/* Selectable destinations: pick which of the client's numbers
            (WhatsApp vs general phone) the invoice gets sent to. */}
        {hasMultipleNumbers && (
          <div className="mt-1.5 flex flex-col gap-1 pl-11">
            {phoneOptions.map((opt) => (
              <label
                key={opt.key}
                className="flex cursor-pointer items-center gap-2 text-[11px] text-[#6E6A65]"
                title={opt.value}
              >
                <input
                  type="radio"
                  name="share-whatsapp-number"
                  checked={opt.key === selectedPhoneKey}
                  onChange={() => setPickedPhoneKey(opt.key)}
                  disabled={isSending}
                  className="h-3 w-3 accent-[#25D366]"
                />
                <span>
                  {opt.label}:{" "}
                  <span className="text-ink">{opt.value}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          if (!hasEmail || isSending) return;
          onSendEmail();
          setOpen(false);
        }}
        disabled={!hasEmail || isSending}
        className="flex w-full items-center gap-3 rounded px-2 py-2 text-left text-[13px] hover:bg-[#F5F4F2] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] text-white">
          <EmailIcon />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-medium">Email</span>
          <span className="truncate text-[11px] text-[#6E6A65]">
            {hasEmail ? client.email : "No email id"}
          </span>
        </span>
      </button>

      {isSending && (
        <p className="mt-1 px-2 text-[11px] text-[#6E6A65]">{busyText}</p>
      )}
    </div>
  );

  return (
    <div className="relative ml-auto">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!hasClient}
        title={hasClient ? shareLabel : "Select a client to share"}
        className={triggerClassName}
      >
        Share
      </button>

      {typeof document !== "undefined" && createPortal(menu, document.body)}
    </div>
  );
}
