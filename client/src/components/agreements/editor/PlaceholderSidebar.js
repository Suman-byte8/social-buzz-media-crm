"use client";
import React from "react";

// Inserts the real resolved value (not a raw {{token}}) at the cursor —
// {{token}} placeholders only get resolved once, at creation time (see
// agreementBuilderRoutes.js's buildInterpolationValues), so a token typed
// in later would never be replaced. Clicking a chip here always inserts
// something meaningful instead.
const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
};

function FieldGroup({ title, fields, onInsert }) {
  if (fields.length === 0) return null;
  return (
    <div className="mt-3 space-y-1.5">
      <p className="font-label-sm text-label-sm text-on-surface-variant">{title}</p>
      {fields.map((f) => (
        <button
          key={f.label}
          type="button"
          onClick={() => onInsert(f.value)}
          title={f.value}
          className="block w-full truncate rounded-md border border-outline-variant px-2.5 py-1.5 text-left text-body-sm text-on-surface hover:border-primary hover:text-primary"
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

export default function PlaceholderSidebar({ editor, agreement }) {
  const client = agreement?.client || {};

  const clientFields = [
    { label: "Legal name", value: client.legalName || client.name },
    { label: "Contact person", value: client.contactPersonName },
    { label: "Email", value: client.email },
    { label: "Phone", value: client.phoneNumber },
    { label: "WhatsApp number", value: client.whatsappNumber },
    { label: "Address", value: client.address },
    { label: "GSTIN", value: client.gstin },
    { label: "Website", value: client.website },
    { label: "Industry", value: client.industry },
    { label: "Services", value: client.servicesSelected },
    { label: "Client since", value: formatDate(client.clientSince) },
  ].filter((f) => f.value);

  const agreementFields = [{ label: "Agreement number", value: agreement?.agreementNumber }].filter((f) => f.value);

  const insert = (value) => {
    if (!editor) return;
    editor.chain().focus().insertContent(value).run();
  };

  return (
    <aside className="w-[220px] shrink-0 overflow-y-auto border-l border-outline-variant bg-surface p-4">
      <p className="font-label-md text-label-md text-on-surface">Insert field</p>
      <p className="mt-1 text-[11px] text-on-surface-variant">Click to insert at the cursor.</p>

      {clientFields.length === 0 && agreementFields.length === 0 && <p className="mt-3 text-[11px] text-on-surface-variant">No client fields available yet.</p>}
      <FieldGroup title="Client" fields={clientFields} onInsert={insert} />
      <FieldGroup title="Agreement" fields={agreementFields} onInsert={insert} />

      <p className="mt-5 font-label-md text-label-md text-on-surface">Remaining to fill</p>
      <p className="mt-1 text-[11px] text-on-surface-variant">
        [Bracketed] fields in the document — fees, dates, counts — are specific to this agreement and aren&apos;t pulled from the CRM. Use{" "}
        <span className="font-medium text-indigo-600">AI-fill Schedule A</span> in the toolbar to pull them from the accepted proposal automatically, or edit them directly in the text.
      </p>
    </aside>
  );
}
