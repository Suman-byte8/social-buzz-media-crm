// The one built-in master agreement template — a hand-authored Tiptap
// (ProseMirror) JSON document reproducing the agency's supplied "SBM
// Service Agreement Template" PDF: the parties block, all 14 numbered
// clauses verbatim, the signature block, and Schedule A's four sub-tables.
// This mirrors reportTemplates.js's role (the single source of truth for
// built-in content, served via GET /agreement-templates rather than
// hardcoded on the client) but for a flowing rich-text document instead of
// a page/element canvas — the content here is plain JSON (ProseMirror's
// document schema), so this file has no Tiptap dependency of its own.
//
// The PDF's own "How to use this template (delete before sending)" page IS
// reproduced here, in full, as the document's opening section — this is a
// generator for the template as the agency actually wrote it, not an
// edited-down version of it. Everything is a normal editable element, so
// deleting that section before sending to a client is the user's own call
// in the editor, exactly as the PDF's own instructions already describe.
//
// {{token}} placeholders (same double-curly convention reportTemplates.js
// uses) are only used for fields that map to real data — client fields,
// agency settings, or the generated agreement number/date. Every other
// [bracketed] field from the source PDF (fee amounts, day counts, revision
// limits, etc.) is left as plain editable text, exactly as the template's
// own instructions describe — the user fills these in the editor.

const text = (content, marks) => ({ type: "text", text: content, ...(marks ? { marks } : {}) });
const bold = (content) => text(content, [{ type: "bold" }]);
// ProseMirror's schema rejects text nodes with an empty string — a blank
// cell (e.g. the Signature/Date/Place rows below) needs a paragraph with
// NO content, not a paragraph containing an empty text node. Filtering out
// "" here (rather than converting it to a zero-length text node) is what
// makes `para("")` / bare `para()` produce a valid empty paragraph.
const para = (...children) => ({
  type: "paragraph",
  content: children.filter((c) => c !== "").map((c) => (typeof c === "string" ? text(c) : c)),
});
const heading = (level, content) => ({ type: "heading", attrs: { level }, content: [typeof content === "string" ? text(content) : content] });
const listItem = (...children) => ({ type: "listItem", content: [para(...children)] });
const orderedList = (...items) => ({ type: "orderedList", attrs: { start: 1 }, content: items });
const cell = (...paragraphs) => ({ type: "tableCell", content: paragraphs.length ? paragraphs : [para("")] });
const headerCell = (...paragraphs) => ({ type: "tableHeader", content: paragraphs.length ? paragraphs : [para("")] });
const row = (...cells) => ({ type: "tableRow", content: cells });
const table = (...rows) => ({ type: "table", content: rows });

function partiesTable() {
  return table(
    row(headerCell(para("")), headerCell(para(bold("Agency"))), headerCell(para(bold("Client")))),
    row(cell(para("Legal name")), cell(para("Social Buzz Media")), cell(para("{{clientLegalName}}"))),
    row(cell(para("Represented by")), cell(para("{{agencyRepresentative}}, Founder")), cell(para("{{clientContactPerson}}"))),
    row(cell(para("Address")), cell(para("{{agencyAddress}}")), cell(para("{{clientAddress}}"))),
    row(cell(para("GSTIN / PAN")), cell(para("{{agencyGstin}}")), cell(para("{{clientGstin}}"))),
    row(cell(para("Email for notices")), cell(para("{{agencyEmail}}")), cell(para("{{clientEmail}}")))
  );
}

function signaturesTable() {
  return table(
    row(headerCell(para("")), headerCell(para(bold("For Social Buzz Media"))), headerCell(para(bold("For the Client")))),
    row(cell(para("Name")), cell(para("{{agencyRepresentative}}")), cell(para("[ ]"))),
    row(cell(para("Designation")), cell(para("Founder")), cell(para("[ ]"))),
    row(cell(para("Signature")), cell(para("")), cell(para(""))),
    row(cell(para("Date")), cell(para("")), cell(para(""))),
    row(cell(para("Place")), cell(para("")), cell(para(""))),
    row(cell(para("Witness name and signature")), cell(para("")), cell(para("")))
  );
}

function servicesTable() {
  return table(
    row(headerCell(para(bold("Module"))), headerCell(para(bold("Included"))), headerCell(para(bold("Deliverables per month")))),
    row(
      cell(para("A — Social Media Marketing")),
      cell(para("[Yes / No]")),
      cell(para("[8] posts, [2] reels, [8] stories on [platforms]; calendar, captions, scheduling, comment monitoring"))
    ),
    row(
      cell(para("B — Local SEO and Google Business Profile")),
      cell(para("[Yes / No]")),
      cell(para("Profile optimisation (month 1), [4] profile posts, review replies, [10] citations, monthly ranking report"))
    ),
    row(
      cell(para("C — Paid Ads Management")),
      cell(para("[Yes / No]")),
      cell(para("Campaign setup and tracking (month 1), [4–6] creatives, weekly optimisation, weekly snapshot + monthly report on [platforms]"))
    ),
    row(cell(para("D — Add-ons")), cell(para("[List]")), cell(para("[Item, quantity]")))
  );
}

function feesTable() {
  return table(
    row(headerCell(para(bold("Item"))), headerCell(para(bold("Billing"))), headerCell(para(bold("Amount (₹)")))),
    row(cell(para("Monthly retainer")), cell(para("Monthly, in advance")), cell(para("[ ]"))),
    row(cell(para("Ad management fee for ad budget above ₹10,000")), cell(para("Monthly")), cell(para("10% of total monthly ad budget"))),
    row(cell(para("One-time setup")), cell(para("On signing")), cell(para("[ ]"))),
    row(cell(para("Add-ons")), cell(para("As used")), cell(para("[ ]"))),
    row(cell(para("GST")), cell(para("")), cell(para("[Included / 18% extra]")))
  );
}

function adBudgetTable() {
  return table(
    row(headerCell(para(bold("Term"))), headerCell(para(bold("Detail")))),
    row(cell(para("Monthly ad budget")), cell(para("₹[ ] on [Google / Meta / LinkedIn], paid by the Client to the platform"))),
    row(cell(para("Start date")), cell(para("[DD Month YYYY]"))),
    row(cell(para("Minimum Term")), cell(para("[3] months"))),
    row(cell(para("Billing date")), cell(para("[5th] of each month"))),
    row(cell(para("Notice period after Minimum Term")), cell(para("[30] days"))),
    row(cell(para("Currency")), cell(para("INR [or USD / AUD / GBP / CAD]")))
  );
}

function accessTable() {
  return table(
    row(headerCell(para(bold("Item"))), headerCell(para(bold("Detail")))),
    row(cell(para("Accounts to be shared")), cell(para("[Meta Business Manager, Google Ads, Google Business Profile, GA4, GTM, website]"))),
    row(cell(para("Client approver")), cell(para("[Name, phone, email]"))),
    row(cell(para("Agency account manager")), cell(para("[Name, phone, email]")))
  );
}

// Clauses 1-14, transcribed verbatim from the supplied PDF. Each clause is
// its own heading + one paragraph per numbered sub-point (not an
// auto-numbered list node — the source numbers each point manually inline,
// e.g. "1.1 ...", so plain paragraphs match it exactly).
function clauses() {
  return [
    heading(2, "1. Services and scope"),
    para("1.1 The Agency will provide the services, deliverables and quantities listed in Schedule A (the “Services”)."),
    para(
      "1.2 Anything not listed in Schedule A is out of scope. This includes ad spend, photo or video shoots, printing, influencer fees, website development and paid tools, unless Schedule A says otherwise."
    ),
    para(
      "1.3 Either Party may request a change in scope in writing (email or WhatsApp is enough). A change takes effect only once both Parties agree in writing on the revised deliverables and fees."
    ),
    para("1.4 Unused monthly deliverables do not carry forward to the next month, unless the delay was caused by the Agency."),

    heading(2, "2. Term and renewal"),
    para('2.1 This Agreement starts on the Effective date and runs for a minimum term of [3] months (the "Minimum Term").'),
    para("2.2 After the Minimum Term, it renews automatically month to month until either Party ends it under Clause 11."),
    para("2.3 One-time projects listed in Schedule A end when the project is delivered and paid for."),

    heading(2, "3. Fees and payment"),
    para(
      "3.1 The Client will pay the fees in Schedule A. Monthly fees are invoiced and payable in advance by the [5th] of each month. One-time fees are payable in full on signing."
    ),
    para('3.2 Fees are exclusive of GST unless Schedule A states "GST included". GST is charged at the applicable rate (currently 18%).'),
    para("3.3 Where the Client deducts TDS as required by law, it will share the TDS certificate within the statutory time."),
    para(
      "3.4 If an invoice is unpaid [7] days after its due date, the Agency may pause the Services and ad campaigns until payment is received. Overdue amounts carry interest of [1.5]% per month."
    ),
    para("3.5 Setup fees and fees for work already started are non-refundable."),
    para("3.6 After the Minimum Term, the Agency may revise its fees by giving [30] days' written notice."),

    heading(2, "4. Advertising spend and ad platforms"),
    para(
      "4.1 Ad spend is separate from the Agency's fees. The Client pays it directly to the ad platforms (Google, Meta, LinkedIn or others) using its own payment method on its own ad accounts."
    ),
    para(
      "4.2 If the Client asks the Agency to pay ad spend on its behalf, the Client will transfer that amount in advance. The Agency is not required to fund ad spend."
    ),
    para("4.3 The Agency will keep spend within the monthly ad budget in Schedule A. Any change in budget needs the Client's written approval."),
    para(
      "4.4 All ads are subject to each platform's policies. The Agency is not responsible for ad rejections, account restrictions or suspensions, delivery issues, or platform outages, but will make reasonable efforts to resolve them."
    ),
    para("4.5 Where the management fee is a percentage of ad budget, it is calculated on the budget approved for that month."),

    heading(2, "5. Client responsibilities, approvals and revisions"),
    para(
      "5.1 The Client will give the Agency, on time: access to the accounts listed in Schedule A, brand assets, product and offer details, and one decision-maker for approvals."
    ),
    para(
      "5.2 The Client confirms that all information, offers, prices, claims, images and testimonials it provides are accurate and that it has the right to use them. The Client is responsible for compliance with laws that apply to its business and its advertising (for example, healthcare, education, finance and real-estate rules)."
    ),
    para(
      "5.3 The Client will approve or comment on content within [3] working days. If there is no response by then, the content is treated as approved and may be published. Delays in approvals or access move the delivery dates by the same amount."
    ),
    para("5.4 Each creative includes up to [2] rounds of revisions. Further revisions, or changes after approval, may be charged at ₹[ ] per creative."),
    para("5.5 The Client will not change live campaigns, budgets or account settings without telling the Agency, as this can affect results."),

    heading(2, "6. Intellectual property"),
    para("6.1 Once the related fees are paid in full, the Client owns the final deliverables made for it: published posts, ad creatives, copy and reports."),
    para(
      "6.2 The Agency keeps ownership of its own tools, templates, frameworks, processes, working files and know-how, including anything it created before this Agreement."
    ),
    para("6.3 Stock images, fonts, music and third-party tools are licensed, not owned. They are used under their own licence terms."),
    para("6.4 The Agency may show the Client's name, logo and non-confidential work in its portfolio and case studies, unless the Client objects in writing."),

    heading(2, "7. Account ownership and access"),
    para(
      "7.1 Ad accounts, social media pages, Google Business Profile, analytics, tag manager and website accounts belong to the Client and stay in the Client's name."
    ),
    para("7.2 The Client will give the Agency admin or partner access. The Agency will not change account ownership or remove the Client's own access."),
    para(
      "7.3 Where the Agency creates a new account for the Client, it will do so in the Client's name and hand over full ownership on request or at the end of this Agreement."
    ),
    para("7.4 Each Party will keep login details secure and will not share them with anyone outside its team."),

    heading(2, "8. Confidentiality and data protection"),
    para(
      "8.1 Each Party will keep the other's non-public business information confidential, including pricing, strategy, performance data, customer data and login details. It will use that information only for this Agreement."
    ),
    para("8.2 This does not apply to information that is public through no fault of the receiving Party, or that must be disclosed by law or a court order."),
    para(
      "8.3 Leads and customer data collected through the campaigns belong to the Client. The Agency will process that data only to deliver the Services, in line with applicable data protection law, including India's Digital Personal Data Protection Act, 2023."
    ),
    para("8.4 The Client is responsible for having a privacy policy and the consents needed for its forms, tracking pixels and remarketing."),
    para("8.5 This clause continues for [2] years after the Agreement ends."),

    heading(2, "9. No guarantee of results"),
    para(
      "9.1 The Agency will perform the Services with reasonable skill and care, following industry practice. Results such as leads, sales, rankings, reach or followers depend on factors outside the Agency's control, including the market, competition, the Client's offer, pricing, website and sales follow-up, and platform algorithms."
    ),
    para("9.2 Any targets or forecasts in a proposal are estimates, not guarantees."),

    heading(2, "10. Liability and indemnity"),
    para("10.1 The Agency's total liability under this Agreement is limited to the fees the Client paid in the [3] months before the claim. Ad spend is not counted."),
    para("10.2 Neither Party is liable for indirect or consequential losses, such as loss of profit, revenue, goodwill or data."),
    para(
      "10.3 The Client will indemnify the Agency against claims, penalties and costs arising from content, claims, offers or materials supplied or approved by the Client, or from the Client's breach of law or of this Agreement."
    ),
    para("10.4 Nothing in this Agreement limits liability for fraud or wilful misconduct."),

    heading(2, "11. Termination and handover"),
    para("11.1 After the Minimum Term, either Party may end this Agreement by giving [30] days' written notice. Fees for the notice period are payable."),
    para("11.2 If the Client ends the Agreement during the Minimum Term, it will pay the fees for the rest of the Minimum Term."),
    para(
      "11.3 Either Party may end this Agreement immediately by written notice if the other Party materially breaches it and does not fix the breach within [15] days of being told. The Agency may also end it if any invoice is more than [15] days overdue."
    ),
    para(
      "11.4 On termination, the Client pays for all Services delivered up to the end date. Within [7] working days of full payment, the Agency will hand over final deliverables, a closing report and any accounts it created, and will remove its own access."
    ),

    heading(2, "12. Non-solicitation"),
    para(
      "12.1 During this Agreement and for [12] months after it ends, the Client will not hire or directly engage any Agency employee or freelancer who worked on its account, without the Agency's written consent."
    ),
    para("12.2 If it does, the Client will pay the Agency a placement fee equal to [3] months of that person's last monthly pay with the Agency."),

    heading(2, "13. Disputes and governing law"),
    para("13.1 This Agreement is governed by the laws of India."),
    para("13.2 The Parties will first try to settle any dispute through good-faith discussion within [30] days."),
    para(
      "13.3 If that fails, the dispute will be referred to a sole arbitrator appointed by mutual agreement, under the Arbitration and Conciliation Act, 1996. The seat and venue will be [Kolkata], and the language English."
    ),
    para("13.4 Subject to the above, the courts at [Kolkata, West Bengal] have exclusive jurisdiction."),

    heading(2, "14. General terms"),
    paraWithBold("14.1 Entire agreement.", " This Agreement, with Schedule A, replaces all earlier proposals and discussions on its subject. If they conflict, this Agreement prevails over the proposal."),
    paraWithBold("14.2 Changes.", " Any change must be in writing and agreed by both Parties. Email counts as writing."),
    paraWithBold("14.3 Independent contractor.", " The Agency acts as an independent contractor, not as the Client's employee, partner or agent."),
    paraWithBold("14.4 Subcontracting.", " The Agency may use its team members, freelancers or partners to deliver the Services and remains responsible for their work."),
    paraWithBold("14.5 Force majeure.", " Neither Party is liable for delay caused by events beyond its reasonable control, such as natural disasters, outages, strikes or government action."),
    paraWithBold("14.6 Notices.", " Formal notices go to the email addresses in the parties block."),
    paraWithBold("14.7 Assignment.", " Neither Party may transfer this Agreement without the other's written consent."),
    paraWithBold("14.8 Severability.", " If any clause is found invalid, the rest of the Agreement still applies."),
    paraWithBold("14.9 Counterparts.", " This Agreement may be signed in counterparts and electronically."),
  ];
}

// A paragraph's content array needs individual text-run objects, not a
// pre-wrapped paragraph node, when it's going to be spread into `para(...)`
// above (which wraps each argument as a text run) — helper kept tiny and
// local since it's only used for the bold-label sentences in clause 14.
function paraWithBold(boldLabel, rest) {
  return { type: "paragraph", content: [bold(boldLabel), text(rest)] };
}

// The PDF's own cover/instructions section, verbatim — kept as the
// document's opening content (see this file's header comment for why).
function howToUseSection() {
  return [
    heading(1, "SBM Service Agreement Template"),
    para("Oct 13, 2026 · @Samim"),
    heading(2, "How to use this template (delete before sending)"),
    para("The clauses stay the same for every client; only the bracketed fields and Schedule A change."),
    orderedList(
      listItem('Fill the parties block and every [bracketed] field. Search for "[" before sending.'),
      listItem("Copy the modules, fees and ad budget from the accepted proposal into Schedule A. Delete modules the client is not buying."),
      listItem(
        "For clients in India, print on e-stamp paper of the value required under the state's Stamp Act (West Bengal for SBM), or have the client execute it in their state as their lawyer advises. Electronic signing (e.g., Aadhaar eSign or a digital signature certificate) also works."
      ),
      listItem("For international clients, change Clause 13 (governing law and venue) and the currency in Schedule A as agreed."),
      listItem("Have a lawyer review this template once before first use. It is a starting format, not legal advice.")
    ),
  ];
}

// The whole document as one flat list of top-level nodes — kept as a
// single function so the clause/table content only has to be authored
// once, then sliced into real A4 pages below. Page breaks are placed at
// clause/section boundaries rather than trying to reproduce the source
// PDF's exact (line-wrap-driven) cut points — a user who adds/edits text
// controls their own page breaks from here on anyway (see "Add page" in
// the editor), so matching the PDF's incidental breaks isn't meaningful.
function buildFlatContent() {
  return [
    ...howToUseSection(),
    heading(1, "Digital Marketing Services Agreement"),
    para(bold("Agreement no. {{agreementNumber}} · Effective date: {{effectiveDate}}")),
    para("This Agreement is made between:"),
    partiesTable(),
    para(
      'Social Buzz Media (the "Agency") provides digital marketing services. The Client wants the Agency to provide the services described in Schedule A, on the terms below. The Agency and the Client are each a "Party" and together the "Parties".'
    ),
    ...clauses(),
    heading(2, "Signatures"),
    para("Signed by the authorised representatives of the Parties on the dates below."),
    signaturesTable(),
    heading(1, "Schedule A — Services, fees and term"),
    para("This Schedule sets out what {{clientLegalName}} is buying under Agreement no. {{agreementNumber}}, based on Proposal no. SBM/PROP/[YYYY]/[###]."),
    heading(2, "A1. Services"),
    servicesTable(),
    heading(2, "A2. Fees"),
    feesTable(),
    heading(2, "A3. Ad budget and term"),
    adBudgetTable(),
    heading(2, "A4. Access and contacts"),
    accessTable(),
  ];
}

// Splits a flat list of top-level nodes into chunks, starting a new chunk
// right before each node whose heading text matches one in `splitBefore`
// (the first node always starts chunk 1, regardless of its own text).
function splitIntoChunks(nodes, splitBefore) {
  const chunks = [[]];
  nodes.forEach((node) => {
    const headingText = node.type === "heading" ? (node.content || []).map((c) => c.text || "").join("") : null;
    if (headingText && splitBefore.includes(headingText) && chunks[chunks.length - 1].length > 0) {
      chunks.push([]);
    }
    chunks[chunks.length - 1].push(node);
  });
  return chunks;
}

const genPageId = (() => {
  let n = 1;
  return () => `page-${n++}`;
})();

// The 7-page breakdown that roughly matches the source PDF's own page
// count: cover/how-to-use + clause 1 together, then clauses grouped
// 2 pages at a time per their natural weight, signatures + Schedule A's
// first table, then the remaining three Schedule A tables.
const PAGE_SPLIT_HEADINGS = [
  "2. Term and renewal",
  "5. Client responsibilities, approvals and revisions",
  "8. Confidentiality and data protection",
  "12. Non-solicitation",
  "Signatures",
  "A2. Fees",
];

export function buildMasterAgreementPages() {
  const chunks = splitIntoChunks(buildFlatContent(), PAGE_SPLIT_HEADINGS);
  return {
    version: 1,
    pages: chunks.map((content) => ({ id: genPageId(), content: { type: "doc", content } })),
  };
}

// Normalizes whatever's stored for an agreement's documentData into the
// current {version, pages: [...]} shape — a defensive upgrade path for any
// row saved before this multi-page rework (when documentData was a single
// flat Tiptap doc), not a real migration script, since nothing about the
// stored JSON-in-TEXT column itself needs to change at the DB level.
export function normalizeAgreementDocumentData(raw) {
  if (raw && Array.isArray(raw.pages)) return raw;
  if (raw && raw.type === "doc") return { version: 1, pages: [{ id: genPageId(), content: raw }] };
  return { version: 1, pages: [{ id: genPageId(), content: { type: "doc", content: [] } }] };
}

// The master template, in the same shape GET /agreement-templates (and the
// Report Builder's analogous endpoint) serves — a stable `key` the client
// can request by, separate from any DB id since this one isn't a database
// row (see AgreementTemplate.js's header comment).
export const MASTER_AGREEMENT_TEMPLATE = {
  key: "sbm_service_agreement",
  name: "SBM Service Agreement",
  description: "The agency's standard digital marketing services agreement — parties, 14 clauses, signatures, and Schedule A.",
  documentData: buildMasterAgreementPages(),
};

export function getMasterAgreementTemplate() {
  // A fresh object each call (not a shared reference) so a caller is free
  // to mutate the returned documentData (e.g. while interpolating
  // placeholders) without corrupting the next caller's copy.
  return JSON.parse(JSON.stringify(MASTER_AGREEMENT_TEMPLATE));
}

// Walks a Tiptap JSON node tree and replaces {{token}} placeholders inside
// every text node's `text` string — same {{token}} convention and
// replace-only-known-keys behavior as reportTemplates.js's
// interpolateDocumentData (an unrecognized {{token}} is left untouched
// rather than replaced with "undefined").
export function interpolateAgreementDocument(doc, values) {
  const replace = (value) => value.replace(/\{\{(\w+)\}\}/g, (match, key) => (values[key] !== undefined ? values[key] : match));

  // A client field that's blank on file (e.g. no address saved) resolves
  // {{clientAddress}} to "" — turning a previously-valid text node into an
  // EMPTY one, which ProseMirror's schema rejects outright (and rejects the
  // *entire* document for, not just that node — this is what was causing
  // generated agreements to load blank). Children are walked/replaced
  // first, then any now-empty text node is dropped from its parent's
  // content array — a paragraph/cell left with zero children is valid
  // (para() already relies on exactly this for genuinely-blank cells), an
  // empty text node is not.
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "text" && typeof node.text === "string") {
      node.text = replace(node.text);
      return;
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(walk);
      node.content = node.content.filter((child) => !(child.type === "text" && child.text === ""));
    }
  };

  walk(doc);
  return doc;
}

// Runs interpolateAgreementDocument over every page's own content — the
// {{token}} replacement logic itself doesn't care about document shape
// (it just walks whatever .content array it's given), so this is a thin
// per-page loop, not a second implementation.
export function interpolateAgreementPages(documentData, values) {
  documentData.pages.forEach((page) => {
    interpolateAgreementDocument(page.content, values);
  });
  return documentData;
}

// Finds the table immediately following a given heading's text (e.g.
// "A1. Services") anywhere across the agreement's pages — the layout
// servicesTable()/feesTable()/adBudgetTable()/accessTable() above always
// produce exactly one heading node followed by exactly one table node
// (possibly on different pages from each other now that the template is
// split across several), so this is reliable as long as the agreement
// hasn't had that structure torn apart by hand (a reasonable assumption
// for AI-fill, meant to run right after creation, before heavy editing).
function findTableAfterHeading(documentData, headingText) {
  for (const page of documentData.pages) {
    const content = page.content.content || [];
    const headingIndex = content.findIndex((node) => node.type === "heading" && (node.content || []).some((c) => c.text === headingText));
    if (headingIndex === -1) continue;
    for (let i = headingIndex + 1; i < content.length; i++) {
      if (content[i].type === "table") return content[i];
      if (content[i].type === "heading") break;
    }
  }
  return null;
}

// Overwrites one cell's content with a single plain text run — used only
// for cells AI-fill actually has a value for; every other cell (including
// ones the proposal didn't mention) is left exactly as the template had
// it, so this never erases a field the user already filled in by hand.
function setCellText(table, rowIndex, colIndex, value) {
  // No value found for this field (Gemini either didn't address it or
  // explicitly omitted it per its own instructions not to guess) — leave
  // the cell untouched rather than clearing whatever the template/user
  // already had there. yesNo(false) still reaches here as the real string
  // "No", so an explicit "not included" IS written; only a genuinely
  // absent field is skipped.
  if (!value) return;
  const row = table?.content?.[rowIndex];
  const cell = row?.content?.[colIndex];
  if (!cell) return;
  cell.content = [para(value)];
}

function yesNo(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return null;
}

// Merges Gemini's extracted Schedule A fields (see geminiAgreement.js)
// into an existing agreement's documentData, in place, cell-by-cell — only
// touching cells a value was actually found for. Row/column positions here
// match servicesTable()/feesTable()/adBudgetTable()/accessTable() exactly
// (row 0 is always the header row in each).
export function applyScheduleAExtraction(documentData, extracted) {
  const services = findTableAfterHeading(documentData, "A1. Services");
  if (services) {
    setCellText(services, 1, 1, yesNo(extracted.socialMediaIncluded));
    setCellText(services, 1, 2, extracted.socialMediaDeliverables);
    setCellText(services, 2, 1, yesNo(extracted.localSeoIncluded));
    setCellText(services, 2, 2, extracted.localSeoDeliverables);
    setCellText(services, 3, 1, yesNo(extracted.paidAdsIncluded));
    setCellText(services, 3, 2, extracted.paidAdsDeliverables);
    setCellText(services, 4, 2, extracted.addOns);
  }

  const fees = findTableAfterHeading(documentData, "A2. Fees");
  if (fees) {
    setCellText(fees, 1, 2, extracted.monthlyRetainer);
    setCellText(fees, 3, 2, extracted.oneTimeSetupFee);
    setCellText(fees, 4, 2, extracted.addOnsFee);
    setCellText(fees, 5, 2, extracted.gstTerms);
  }

  const adBudget = findTableAfterHeading(documentData, "A3. Ad budget and term");
  if (adBudget) {
    const budgetLine = [extracted.monthlyAdBudget, extracted.adPlatforms ? `on ${extracted.adPlatforms}` : null].filter(Boolean).join(" ");
    setCellText(adBudget, 1, 1, budgetLine || null);
    setCellText(adBudget, 2, 1, extracted.startDate);
    setCellText(adBudget, 3, 1, extracted.minimumTermMonths ? `${extracted.minimumTermMonths} months` : null);
    setCellText(adBudget, 6, 1, extracted.currency);
  }

  const access = findTableAfterHeading(documentData, "A4. Access and contacts");
  if (access) {
    setCellText(access, 1, 1, extracted.accountsToShare);
    setCellText(access, 2, 1, extracted.clientApprover);
    setCellText(access, 3, 1, extracted.agencyAccountManager);
  }

  return documentData;
}
