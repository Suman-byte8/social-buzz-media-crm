"use client";

import React from "react";

export default function ContactInfoCard({ member }) {
  return (
    <div className="bg-surface rounded-xl border border-outline-variant p-6 shadow-card">
      <h2 className="font-headline-sm text-headline-sm text-on-surface mb-5">Contact Information</h2>
      <ul className="space-y-4">
        <li className="flex items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px] text-primary shrink-0">mail</span>
          <a className="font-body-md text-body-md hover:text-primary transition-colors hover:underline truncate" href={member.email ? `mailto:${member.email}` : "#"}>
            {member.email || "No email on file"}
          </a>
        </li>
        <li className="flex items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px] text-primary shrink-0">call</span>
          <span className="font-body-md text-body-md">{member.number || member.phoneNumber || "No phone on file"}</span>
        </li>
        <li className="flex items-center gap-3 text-on-surface-variant">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-primary shrink-0">
            <path d="M12.04 4.5C7.34 4.5 3.54 7.83 3.54 12.5c0 2.06 1 3.94 2.62 5.14-.13-.47-.21-.95-.21-1.44 0-.28.03-.57.07-.85.06-.43.14-.86.24-1.27-.91-.27-1.64-.71-2.21-1.32-.08.59-.13 1.2-.13 1.81 0 4.18 3.42 7.6 7.59 7.6h.05c.49 0 .99-.04 1.47-.11.04-.49.07-.98.07-1.47s-.02-.98-.07-1.47c.61.06 1.18.11 1.75.11.56 0 1.13-.06 1.69-.16.01-.32.02-.65.02-.98 0-3.91-.97-7.54-2.57-10.64-.12-.23-.26-.46-.39-.69.28.26.55.56.78.87 2.14-1.29 4.74-2.08 7.57-2.08 4.71 0 8.51 3.59 8.51 8s-3.81 8-8.51 8c-1.51 0-2.91-.37-4.15-.99-.14-.06.29-.49.21-.62-.2-.27-.49-.41-.77-.53-1.84-.95-3.12-2.82-3.12-5.01 0-2.63 1.64-4.85 3.93-5.82.29-.12.61-.23.93-.31.02.22.03.45.03.68zm-3.72 5.69c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25-1.25zm4.98 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25-1.25z" />
          </svg>
          <span className="font-body-md text-body-md">
            {member.whatsappNumber ? (
              <a
                href={`https://wa.me/${member.whatsappNumber.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                {member.whatsappNumber}
              </a>
            ) : (
              "No WhatsApp on file"
            )}
          </span>
        </li>
        <li className="flex items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px] text-primary shrink-0">location_on</span>
          <span className="font-body-md text-body-md">{member.address || "No address on file"}</span>
        </li>
      </ul>
    </div>
  );
}
