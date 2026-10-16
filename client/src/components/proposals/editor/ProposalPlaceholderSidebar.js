"use client";
import React, { useMemo, useState } from "react";

// Adapted from agreements/editor/PlaceholderSidebar.js — same search box,
// icons, value-alongside-label, copy/insert feedback, and live
// [bracketed]-scan-with-jump-to mechanics (all domain-agnostic internally);
// duplicated only because the field groups differ (Proposal fields instead
// of Agreement fields, see below).
const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
};

const formatStatus = (status) => (status ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null);

function collectTextBlocks(node, blocks = []) {
  if (!node || !Array.isArray(node.content)) return blocks;
  const isLeafTextBlock = node.content.length > 0 && node.content.every((c) => c.type === "text" || c.type === "hardBreak");
  if (isLeafTextBlock) {
    blocks.push(
      node.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("")
    );
  } else {
    node.content.forEach((child) => collectTextBlocks(child, blocks));
  }
  return blocks;
}

const BRACKET_RE = /\[[^\]]+\]/g;

function FieldRow({ icon, label, value, clientId, onInsert, onCopy, feedback }) {
  const hasValue = Boolean(value);
  return (
    <div className="group flex items-start gap-2 rounded-md border border-outline-variant px-2.5 py-2 hover:border-primary">
      <span className="material-symbols-outlined mt-0.5 text-[16px] text-on-surface-variant">{icon}</span>
      <button
        type="button"
        disabled={!hasValue}
        onClick={onInsert}
        title={hasValue ? `Insert "${value}" at the cursor` : "No value on file"}
        className="min-w-0 flex-1 text-left disabled:cursor-not-allowed"
      >
        <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
        {hasValue ? (
          <p className="truncate text-body-sm text-on-surface group-hover:text-primary">{value}</p>
        ) : (
          <p className="text-body-sm italic text-on-surface-variant/70">
            Not set{" "}
            {clientId && (
              <a
                href={`/clients/${clientId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="not-italic text-primary underline underline-offset-2 hover:text-primary/80"
              >
                — add in client record
              </a>
            )}
          </p>
        )}
      </button>
      {hasValue && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          title="Copy value"
          className="mt-0.5 shrink-0 rounded p-1 text-on-surface-variant opacity-0 hover:bg-surface-variant group-hover:opacity-100"
        >
          <span className="material-symbols-outlined text-[16px]">{feedback === "copied" ? "check" : "content_copy"}</span>
        </button>
      )}
      {feedback === "inserted" && <span className="absolute right-2 top-2 rounded bg-primary px-1.5 py-0.5 text-[10px] text-white">Inserted</span>}
    </div>
  );
}

function FieldGroup({ title, fields, clientId, onInsert, onCopy, feedbackFor }) {
  if (fields.length === 0) return null;
  return (
    <div className="mt-3 space-y-1.5">
      <p className="font-label-sm text-label-sm text-on-surface-variant">{title}</p>
      {fields.map((f) => (
        <div key={f.label} className="relative">
          <FieldRow
            icon={f.icon}
            label={f.label}
            value={f.value}
            clientId={clientId}
            onInsert={() => onInsert(f.label, f.value)}
            onCopy={() => onCopy(f.label, f.value)}
            feedback={feedbackFor(f.label)}
          />
        </div>
      ))}
    </div>
  );
}

export default function ProposalPlaceholderSidebar({ editor, proposal, pages, pageEditors, onSelectPage }) {
  const client = proposal?.client || {};
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState(null); // { key, type: "inserted" | "copied" }

  const flash = (key, type) => {
    setFeedback({ key, type });
    window.setTimeout(() => setFeedback((f) => (f?.key === key ? null : f)), 1200);
  };

  const insert = (label, value) => {
    if (!editor || !value) return;
    editor.chain().focus().insertContent(value).run();
    flash(label, "inserted");
  };

  const copy = async (label, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      flash(label, "copied");
    } catch {
      // Clipboard permission denied or unavailable — insert is still there.
    }
  };

  const feedbackFor = (label) => (feedback?.key === label ? feedback.type : null);

  const clientFields = [
    { label: "Legal name", icon: "badge", value: client.legalName || client.name },
    { label: "Contact person", icon: "person", value: client.contactPersonName },
    { label: "Email", icon: "mail", value: client.email },
    { label: "Phone", icon: "call", value: client.phoneNumber },
    { label: "WhatsApp number", icon: "chat", value: client.whatsappNumber },
    { label: "Address", icon: "pin_drop", value: client.address },
    { label: "Website", icon: "language", value: client.website },
    { label: "Industry", icon: "apartment", value: client.industry },
    { label: "Services", icon: "checklist", value: client.servicesSelected },
    { label: "Client since", icon: "event", value: formatDate(client.clientSince) },
  ];

  // Only real Proposal columns — no dateOfIssue/validUntil here, since
  // those are baked into the document text at creation time, not stored as
  // their own fields on the Proposal row.
  const proposalFields = [
    { label: "Proposal number", icon: "tag", value: proposal?.proposalNumber },
    { label: "Title", icon: "description", value: proposal?.title },
    { label: "Status", icon: "flag", value: formatStatus(proposal?.status) },
    { label: "Created", icon: "event", value: formatDate(proposal?.createdAt) },
    { label: "Finalized", icon: "event_available", value: formatDate(proposal?.finalizedAt) },
  ];

  const quickFields = [{ label: "Today's date", icon: "calendar_month", value: formatDate(new Date()) }];

  const matchesQuery = (f) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return f.label.toLowerCase().includes(q) || (f.value || "").toLowerCase().includes(q);
  };
  const filteredClient = clientFields.filter(matchesQuery);
  const filteredProposal = proposalFields.filter(matchesQuery);
  const filteredQuick = quickFields.filter(matchesQuery);

  // Scans every page's content for literal "[bracketed]" fields the master
  // template leaves for manual entry — same live-checklist mechanics as
  // PlaceholderSidebar.js.
  const remainingItems = useMemo(() => {
    const map = new Map();
    (pages || []).forEach((page, pageIndex) => {
      collectTextBlocks(page.content).forEach((text) => {
        const matches = text.match(BRACKET_RE);
        if (!matches) return;
        matches.forEach((phrase) => {
          if (!map.has(phrase)) map.set(phrase, { phrase, count: 0, pageId: page.id, pageIndex });
          map.get(phrase).count += 1;
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.pageIndex - b.pageIndex);
  }, [pages]);

  const filteredRemaining = query.trim() ? remainingItems.filter((r) => r.phrase.toLowerCase().includes(query.trim().toLowerCase())) : remainingItems;

  const jumpToPlaceholder = (pageId, phrase) => {
    onSelectPage?.(pageId);
    const pageEditor = pageEditors?.[pageId];
    if (!pageEditor) return;
    let target = null;
    pageEditor.state.doc.descendants((node, pos) => {
      if (target || !node.isTextblock) return true;
      const idx = node.textContent.indexOf(phrase);
      if (idx !== -1) target = { from: pos + 1 + idx, to: pos + 1 + idx + phrase.length };
      return false;
    });
    if (target) pageEditor.chain().focus().setTextSelection(target).scrollIntoView().run();
  };

  const nothingFound = filteredClient.length === 0 && filteredProposal.length === 0 && filteredQuick.length === 0 && filteredRemaining.length === 0;

  return (
    <aside className="flex w-[260px] shrink-0 flex-col overflow-y-auto border-l border-outline-variant bg-surface p-4">
      <p className="font-label-md text-label-md text-on-surface">Insert field</p>
      <p className="mt-1 text-[11px] text-on-surface-variant">Click a field to insert its value at the cursor, or copy it for use elsewhere.</p>

      <div className="relative mt-3">
        <span className="material-symbols-outlined pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">search</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search fields…"
          className="w-full rounded-md border border-outline-variant bg-surface py-1.5 pl-8 pr-7 text-body-sm text-on-surface outline-none focus:border-primary"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-on-surface-variant hover:bg-surface-variant">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {nothingFound && <p className="mt-3 text-[11px] text-on-surface-variant">No fields match &quot;{query}&quot;.</p>}

      <FieldGroup title="Client" fields={filteredClient} clientId={client.id} onInsert={insert} onCopy={copy} feedbackFor={feedbackFor} />
      <FieldGroup title="Proposal" fields={filteredProposal} onInsert={insert} onCopy={copy} feedbackFor={feedbackFor} />
      <FieldGroup title="Quick insert" fields={filteredQuick} onInsert={insert} onCopy={copy} feedbackFor={feedbackFor} />

      {filteredRemaining.length > 0 && (
        <div className="mt-5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <p className="font-label-md text-label-md text-on-surface">Remaining to fill</p>
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">{remainingItems.length}</span>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Specific to this proposal — discovery notes, goals, fees — not pulled from the CRM. Click one to jump to it, or edit it directly in the text.
          </p>
          <div className="space-y-1">
            {filteredRemaining.map((item) => (
              <button
                key={item.phrase}
                type="button"
                onClick={() => jumpToPlaceholder(item.pageId, item.phrase)}
                title={`Jump to this on page ${item.pageIndex + 1}`}
                className="flex w-full items-center justify-between gap-2 rounded-md border border-dashed border-amber-300 bg-amber-50 px-2.5 py-1.5 text-left hover:border-amber-500"
              >
                <span className="truncate text-body-sm text-amber-900">{item.phrase}</span>
                <span className="shrink-0 text-[10px] text-amber-700">
                  p.{item.pageIndex + 1}
                  {item.count > 1 ? ` ×${item.count}` : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
