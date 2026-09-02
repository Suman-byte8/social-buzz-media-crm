"use client";
import React from "react";
import ClientSelectDropdown from "./ClientSelectDropdown";

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
          <ClientSelectDropdown
            clients={clients}
            isClientLoading={isClientLoading}
            selectedClientId={selectedClientId}
            onClientChange={onClientChange}
          />
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
                {selectedClient.address || ""}
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
        <p className="mt-1 text-[10.5px] leading-[1.7] text-[#6E6A65]">
          {selectedClient
            ? selectedClient.address || ""
            : "Select a client to show their address."}
        </p>
      </div>
    </section>
  );
}
