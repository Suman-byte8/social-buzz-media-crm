"use client";
import React from "react";

// Inserts the real resolved value (not a raw {{token}}) at the cursor —
// {{token}} placeholders only get resolved once, at creation time (see
// agreementBuilderRoutes.js's buildInterpolationValues), so a token typed
// in later would never be replaced. Clicking a chip here always inserts
// something meaningful instead.
export default function PlaceholderSidebar({ editor, agreement }) {
  const client = agreement?.client || {};

  const fields = [
    { label: "Client legal name", value: client.legalName || client.name },
    { label: "Client contact person", value: client.contactPersonName },
    { label: "Client email", value: client.email },
    { label: "Client phone", value: client.phoneNumber },
    { label: "Client address", value: client.address },
    { label: "Client GSTIN", value: client.gstin },
    { label: "Agreement number", value: agreement?.agreementNumber },
  ].filter((f) => f.value);

  const insert = (value) => {
    if (!editor) return;
    editor.chain().focus().insertContent(value).run();
  };

  return (
    <aside className="w-[220px] shrink-0 overflow-y-auto border-l border-outline-variant bg-surface p-4">
      <p className="font-label-md text-label-md text-on-surface">Insert field</p>
      <p className="mt-1 text-[11px] text-on-surface-variant">Click to insert at the cursor.</p>
      <div className="mt-3 space-y-1.5">
        {fields.length === 0 && <p className="text-[11px] text-on-surface-variant">No client fields available yet.</p>}
        {fields.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => insert(f.value)}
            title={f.value}
            className="block w-full truncate rounded-md border border-outline-variant px-2.5 py-1.5 text-left text-body-sm text-on-surface hover:border-primary hover:text-primary"
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="mt-5 font-label-md text-label-md text-on-surface">Remaining to fill</p>
      <p className="mt-1 text-[11px] text-on-surface-variant">
        [Bracketed] fields in the document — fees, dates, counts — are specific to this agreement and aren&apos;t pulled from the CRM. Edit them directly in the text.
      </p>
    </aside>
  );
}
