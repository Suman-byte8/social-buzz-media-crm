"use client";
import React from "react";

export default function BillingDetails({
  clients,
  isClientLoading,
  selectedClientId,
  onClientChange,
  engagement,
  onEngagementChange,
}) {
  const selectedClient = clients.find(
    (c) => String(c.id) === String(selectedClientId),
  );

  return (
    <section className="mt-9 grid grid-cols-2 gap-6 border-y border-[#DEDBD6] py-5">
      <div>
        <p className="font-display text-[9.5px] font-700 uppercase tracking-[.24em] text-[#6E6A65]">
          Billed to
        </p>

        {/*
          data-html2canvas-ignore: this dropdown is an on-screen editing
          control only. The exported PDF should show the selected client's
          name/address just once, in the plain text block below — not the
          picker widget as well (that was causing the client name to
          appear twice in the exported PDF).
        */}
        <div className="mt-2" data-html2canvas-ignore="true">
          <label className="sr-only" htmlFor="billToClient">
            Select client
          </label>
          <select
            id="billToClient"
            value={selectedClientId}
            onChange={(e) => onClientChange(e.target.value)}
            disabled={isClientLoading}
            className="w-full max-w-[74mm] cursor-pointer rounded border border-[#DEDBD6] bg-white px-2 py-1.5 font-display text-[13px] font-700 text-[#1A1A1A] focus:outline-none focus:border-[#E8262A] focus:ring-1 focus:ring-[#E8262A]"
          >
            <option value="">
              {isClientLoading ? "Loading clients…" : "Select a client…"}
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2">
          {selectedClient ? (
            <>
              <p className="font-display text-[15px] font-700">
                {selectedClient.name}
              </p>
              {selectedClient.email && (
                <p className="mt-0.5 text-[10.5px] text-[#6E6A65]">
                  {selectedClient.email}
                </p>
              )}
              <p className="mt-0.5 text-[10.5px] leading-[1.6] text-[#6E6A65]">
                {selectedClient.address || "—"}
              </p>
            </>
          ) : (
            <p className="text-[10.5px] text-[#6E6A65]">
              Select a client to autofill billing details.
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="font-display text-[9.5px] font-700 uppercase tracking-[.24em] text-[#6E6A65]">
          Engagement
        </p>
        <input
          type="text"
          value={engagement.title}
          onChange={(e) =>
            onEngagementChange({ ...engagement, title: e.target.value })
          }
          className="mt-2 w-full bg-transparent font-display text-[15px] font-700 outline-none"
        />
        <textarea
          value={engagement.description}
          onChange={(e) =>
            onEngagementChange({ ...engagement, description: e.target.value })
          }
          rows={2}
          className="mt-1 w-full resize-none bg-transparent text-[10.5px] leading-[1.7] text-[#6E6A65] outline-none"
        />
      </div>
    </section>
  );
}
