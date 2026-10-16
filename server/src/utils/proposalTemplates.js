// The one built-in master proposal template — a hand-authored Tiptap
// (ProseMirror) JSON document reproducing the agency's supplied "SBM
// Proposal Template" PDF: the how-to-use/package-selection page, the
// cover/detail table, agency boilerplate, discovery, goals, strategy, the
// four service modules (A-D), timeline, reporting, investment, payment
// terms, requirements checklist, next steps, and signature table. Mirrors
// agreementTemplates.js's role and structure exactly — see that file's own
// header comment for the shape/conventions this one reuses verbatim.
//
// The PDF's own "How to use this template (delete before sending)" section
// IS reproduced here, in full, as the document's opening content — same
// "generator for the template as actually written, not an edited-down
// version" principle agreementTemplates.js already established.
//
// {{token}} placeholders are only used for fields that map to real data —
// client fields, agency settings, or the generated proposal number/dates.
// Every other [bracketed] field from the source PDF is left as plain
// editable text, exactly as the template's own instructions describe.

const text = (content, marks) => ({ type: "text", text: content, ...(marks ? { marks } : {}) });
const bold = (content) => text(content, [{ type: "bold" }]);
const hardBreak = () => ({ type: "hardBreak" });
// Same empty-string-filtering as agreementTemplates.js's para() — a blank
// cell needs a paragraph with NO content, not a paragraph containing an
// empty text node (ProseMirror's schema rejects the latter).
const para = (...children) => ({
  type: "paragraph",
  content: children.filter((c) => c !== "").map((c) => (typeof c === "string" ? text(c) : c)),
});
// A paragraph with hardBreak-separated lines — used for table cells that
// list several short items (the timeline's "Activities" column).
const linesPara = (...lines) => ({
  type: "paragraph",
  content: lines.flatMap((line, i) => (i === 0 ? [text(line)] : [hardBreak(), text(line)])),
});
const heading = (level, content) => ({ type: "heading", attrs: { level }, content: [typeof content === "string" ? text(content) : content] });
const listItem = (...children) => ({ type: "listItem", content: [para(...children)] });
const orderedList = (...items) => ({ type: "orderedList", attrs: { start: 1 }, content: items });
const bulletList = (...items) => ({ type: "bulletList", content: items });
const cell = (...paragraphs) => ({ type: "tableCell", content: paragraphs.length ? paragraphs : [para("")] });
const headerCell = (...paragraphs) => ({ type: "tableHeader", content: paragraphs.length ? paragraphs : [para("")] });
const row = (...cells) => ({ type: "tableRow", content: cells });
const table = (...rows) => ({ type: "table", content: rows });

// A paragraph's content array needs individual text-run objects, not a
// pre-wrapped paragraph node, when spread into para(...) — same helper
// agreementTemplates.js uses for its clause 14 bold labels.
function paraWithBold(boldLabel, rest) {
  return { type: "paragraph", content: [bold(boldLabel), text(rest)] };
}

// The PDF's own cover/instructions page, verbatim.
function howToUseSection() {
  return [
    heading(1, "SBM Proposal Template"),
    para("Oct 13, 2026 · @Samim"),
    heading(2, "How to use this template (delete before sending)"),
    para("One format covers every deal: keep only the service modules the client is buying, delete the rest, and fill every [bracketed] field."),
    orderedList(
      listItem('For each client, work on a copy (or export to Word / Google Docs) named "Proposal – [Client Name] – [Month YYYY]".'),
      listItem("Pick the package from the table below. Keep only those modules in Scope of Services and Investment."),
      listItem('Replace every [bracketed placeholder]. Search the doc for "[" before sending to catch any you missed.'),
      listItem("Delete this section, export as PDF, and send it together with the Service Agreement.")
    ),
    table(
      row(headerCell(para(bold("Client need"))), headerCell(para(bold("Keep modules"))), headerCell(para(bold("Package name")))),
      row(cell(para("Full digital growth")), cell(para("A + B + C")), cell(para("Digital Growth Package"))),
      row(cell(para("Leads or sales, fast")), cell(para("C only")), cell(para("Performance Ads"))),
      row(cell(para("Local walk-ins and calls")), cell(para("A + B")), cell(para("Local Visibility"))),
      row(cell(para("Brand presence on social")), cell(para("A only")), cell(para("Social Presence"))),
      row(cell(para("Any of the above + extras")), cell(para("Add rows from D")), cell(para('Same name + "Plus"')))
    ),
    para(
      "If local SEO beyond Google Business Profile, or any website work, is delivered through our website/SEO partner, name the partner in Module B or D so the client knows who does what."
    ),
  ];
}

function coverSection() {
  return [
    heading(1, "Proposal for {{clientLegalName}}"),
    para(bold("[Package Name] — [Services, e.g., Social Media Marketing + Local SEO + Paid Ads]")),
    table(
      row(headerCell(para(bold("Detail"))), headerCell(para(""))),
      row(cell(para("Prepared for")), cell(para("{{clientContactPerson}}, [Designation], {{clientLegalName}}, [City]"))),
      row(cell(para("Prepared by")), cell(para("Samim Akhter, Social Buzz Media"))),
      row(cell(para("Contact")), cell(para("[Phone] · {{agencyEmail}} · socialbuzzmedia.in"))),
      row(cell(para("Proposal no.")), cell(para("{{proposalNumber}}"))),
      row(cell(para("Date of issue")), cell(para("{{dateOfIssue}}"))),
      row(cell(para("Valid until")), cell(para("{{validUntil}}")))
    ),
  ];
}

function aboutSection() {
  return [
    heading(2, "About Social Buzz Media"),
    para(
      "Social Buzz Media is a performance-led digital marketing agency that turns online attention into enquiries, footfall and sales for businesses in India and abroad (Australia, Canada, UK, US)."
    ),
    para(
      "We run paid media (Google, Meta, LinkedIn and programmatic), social media management, local SEO and Google Business Profile, and full-stack conversion tracking (GA4, GTM, Meta Pixel and Conversions API). The agency is led by Samim Akhter, a performance marketer with 6+ years of experience who has managed global accounts, including The Economist, across DV360 and the Google stack."
    ),
    table(
      row(headerCell(para(bold("Result"))), headerCell(para(bold("Context")))),
      row(cell(para("10x ROAS")), cell(para("Healthcare client, paid campaigns"))),
      row(cell(para("35%")), cell(para("Lead-to-appointment conversion rate"))),
      row(cell(para("[Result]")), cell(para("[A recent result from the client's industry or city]")))
    ),
  ];
}

function understandingSection() {
  return [
    heading(2, "Understanding your business"),
    para(
      '[One sentence on what the client does and the main growth problem — e.g., "Your walk-in customers love you, but new customers in [City] can\'t find you on Google Maps or Instagram."]'
    ),
    table(
      row(headerCell(para(bold("Area"))), headerCell(para(bold("What we found")))),
      row(cell(para("Business and offer")), cell(para("[Products / services, price range, USP]"))),
      row(cell(para("Target customers")), cell(para("[Who they are, age, location radius or cities — Tier 1/2/3]"))),
      row(cell(para("Current marketing")), cell(para("[Channels in use, monthly spend, past agency experience]"))),
      row(cell(para("Online presence")), cell(para("[Website, Google rating and review count, followers, posting frequency]"))),
      row(cell(para("Competitors")), cell(para("[2–3 competitors and what they do well online]"))),
      row(cell(para("Key challenges")), cell(para("[e.g., few enquiries, low Maps visibility, irregular posting, no tracking]")))
    ),
  ];
}

function goalsSection() {
  return [
    heading(2, "Goals and KPIs"),
    para("We will track [3] agreed goals and review them with you every month. Delete the rows for modules not in this proposal."),
    table(
      row(headerCell(para(bold("Goal"))), headerCell(para(bold("KPI"))), headerCell(para(bold("Baseline today"))), headerCell(para(bold("Target by month 3"))), headerCell(para(bold("Module")))),
      row(cell(para("More enquiries")), cell(para("Leads per month, cost per lead (₹)")), cell(para("[ ]")), cell(para("[ ]")), cell(para("C — Paid Ads"))),
      row(cell(para("More online sales")), cell(para("Revenue from ads, ROAS")), cell(para("[ ]")), cell(para("[ ]")), cell(para("C — Paid Ads"))),
      row(cell(para("Local visibility")), cell(para("Google profile views, calls, direction requests")), cell(para("[ ]")), cell(para("[ ]")), cell(para("B — Local SEO"))),
      row(cell(para("Better reputation")), cell(para("Google rating, new reviews per month")), cell(para("[ ]")), cell(para("[ ]")), cell(para("B — Local SEO"))),
      row(cell(para("Brand engagement")), cell(para("Reach, engagement rate, follower growth")), cell(para("[ ]")), cell(para("[ ]")), cell(para("A — Social Media")))
    ),
    para("Targets are estimates based on the agreed ad budget and industry benchmarks, not guaranteed outcomes."),
  ];
}

function strategySection() {
  return [
    heading(2, "Recommended strategy"),
    para(
      '[One sentence on the approach — e.g., "We will make you easy to find locally, keep your brand active on social, and use paid ads to turn that attention into enquiries."]'
    ),
    table(
      row(headerCell(para(bold("Stage"))), headerCell(para(bold("What we do"))), headerCell(para(bold("Where"))), headerCell(para(bold("Module")))),
      row(cell(para("Be found")), cell(para("Optimise your Google Business Profile, build local listings, grow reviews")), cell(para("Google Search and Maps")), cell(para("B"))),
      row(cell(para("Build trust")), cell(para("Publish consistent content, offers and customer stories")), cell(para("Instagram, Facebook, [LinkedIn]")), cell(para("A"))),
      row(cell(para("Drive action")), cell(para("Run targeted ads and retarget people who showed interest")), cell(para("Google Ads, Meta Ads")), cell(para("C"))),
      row(cell(para("Measure and improve")), cell(para("Track every lead and sale, optimise weekly")), cell(para("GA4, GTM, Meta Pixel / CAPI")), cell(para("C")))
    ),
    para("For a single-service proposal, delete this table and write 3–4 bullets on the approach for that one service."),
  ];
}

function moduleA() {
  return [
    heading(2, "Module A — Social Media Marketing"),
    para("Platforms: [Instagram, Facebook, LinkedIn]"),
    table(
      row(headerCell(para(bold("Deliverable"))), headerCell(para(bold("Per month")))),
      row(cell(para("Content calendar, shared for approval")), cell(para("1, by the [25th] of the previous month"))),
      row(cell(para("Static posts and carousels")), cell(para("[8]"))),
      row(cell(para("Reels (edited from client-supplied footage)")), cell(para("[2]"))),
      row(cell(para("Stories")), cell(para("[8]"))),
      row(cell(para("Captions, hashtags and scheduling")), cell(para("Included"))),
      row(cell(para("Comment and DM monitoring")), cell(para("[Mon–Sat, business hours]"))),
      row(cell(para("Insights report")), cell(para("Included in monthly report")))
    ),
    para("Not included: video or photo shoots, influencer fees, and paid promotion (covered in Module C)."),
  ];
}

function moduleB() {
  return [
    heading(2, "Module B — Local SEO and Google Business Profile"),
    table(
      row(headerCell(para(bold("Deliverable"))), headerCell(para(bold("Frequency")))),
      row(cell(para("Google Business Profile audit and full optimisation (categories, services, photos, hours, attributes)")), cell(para("One-time, month 1"))),
      row(cell(para("Google Business Profile posts and offers")), cell(para("[4] per month"))),
      row(cell(para("Review-generation plan and replies to reviews")), cell(para("Ongoing"))),
      row(cell(para("Local listings and citations (e.g., Justdial, Sulekha, Bing Places, Apple Maps)")), cell(para("[10] per month"))),
      row(cell(para("On-page local SEO (location pages, NAP consistency, local schema)")), cell(para("[As agreed]"))),
      row(cell(para("Keyword ranking and Maps visibility tracking")), cell(para("Monthly")))
    ),
    para("Not included: website development, blog writing beyond [ ] articles, and paid directory listings."),
  ];
}

function moduleC() {
  return [
    heading(2, "Module C — Paid Ads Management"),
    para("Platforms: [Google Ads — Search, Performance Max, Display, YouTube] [Meta Ads — Facebook, Instagram] [LinkedIn Ads]"),
    table(
      row(headerCell(para(bold("Deliverable"))), headerCell(para(bold("Frequency")))),
      row(cell(para("Account audit and campaign structure")), cell(para("Month 1"))),
      row(cell(para("Audience, keyword and competitor research")), cell(para("Month 1, refreshed quarterly"))),
      row(cell(para("Ad copy and creatives")), cell(para("[4–6] per month"))),
      row(cell(para("Conversion tracking setup (GA4, GTM, Meta Pixel / CAPI)")), cell(para("One-time, month 1"))),
      row(cell(para("Bid, budget and audience optimisation")), cell(para("Weekly"))),
      row(cell(para("A/B testing of ads and landing pages")), cell(para("Ongoing"))),
      row(cell(para("Performance updates")), cell(para("Weekly snapshot + monthly report")))
    ),
    para("Recommended ad budget: ₹[ ] per month, paid by the client directly to Google / Meta. Not included: ad spend and landing page development (available in Module D)."),
  ];
}

function moduleD() {
  return [
    heading(2, "Module D — Optional add-ons"),
    table(
      row(headerCell(para(bold("Add-on"))), headerCell(para(bold("Price")))),
      row(cell(para("Banners, menu cards, print and OOH design")), cell(para("₹[ ] per design"))),
      row(cell(para("Landing page design and build")), cell(para("₹[ ] one-time"))),
      row(cell(para("Photo or video shoot")), cell(para("₹[ ] per shoot"))),
      row(cell(para("LinkedIn profile or personal branding")), cell(para("₹5,000–₹12,000 one-time"))),
      row(cell(para("Website and SEO (through our partner)")), cell(para("[Quote on request]")))
    ),
  ];
}

function timelineSection() {
  return [
    heading(2, "Timeline and onboarding"),
    para(bold("First 90 days: set up, learn, then scale what works")),
    table(
      row(headerCell(para(bold("Phase"))), headerCell(para(bold("Focus"))), headerCell(para(bold("Activities")))),
      row(
        cell(para("Month 1 (day 0–30)")),
        cell(para("Set up and launch")),
        cell(linesPara("Kick-off call, access shared", "Audit profile, ads, social", "Tracking: GA4, GTM, CAPI", "Content calendar approved", "First campaigns live"))
      ),
      row(
        cell(para("Month 2 (day 30–60)")),
        cell(para("Learn and optimise")),
        cell(linesPara("Weekly bid, audience tuning", "A/B test ads and creatives", "Steady posting and reviews", "First report and review call"))
      ),
      row(
        cell(para("Month 3 (day 60–90)")),
        cell(para("Scale what works")),
        cell(linesPara("Budget to best performers", "Expand audiences, keywords", "Quarterly review vs targets", "Plan for the next quarter"))
      )
    ),
    para("Kick-off needs: signed agreement, first payment, and access to ad accounts and profiles."),
    para("Work starts within [7] days of signing and first campaigns go live by day [14]. Edit the phase items to match the modules in this proposal."),
  ];
}

function reportingSection() {
  return [
    heading(2, "Reporting and communication"),
    para("You get one point of contact, a monthly report by the [5th], and a monthly review call."),
    table(
      row(headerCell(para(bold("What"))), headerCell(para(bold("When"))), headerCell(para(bold("Format")))),
      row(cell(para("Ads performance snapshot")), cell(para("Weekly, every [Monday]")), cell(para("WhatsApp or email"))),
      row(cell(para("Monthly performance report")), cell(para("By the [5th] of the following month")), cell(para("PDF or live dashboard"))),
      row(cell(para("Review and planning call")), cell(para("Monthly, 30 minutes")), cell(para("Google Meet or phone"))),
      row(cell(para("Content for approval")), cell(para("[3] working days before posting")), cell(para("Shared calendar"))),
      row(cell(para("Point of contact")), cell(para("[Account manager name, phone, email]")), cell(para("—")))
    ),
    para("We reply to queries within [1] working day, Monday to Saturday, 10 am–7 pm IST."),
  ];
}

function investmentSection() {
  return [
    heading(2, "Investment"),
    para("Your total investment is ₹[ ] per month plus a one-time setup fee of ₹[ ], billed in advance. Ad budget is separate and paid by you directly to the ad platforms."),
    table(
      row(headerCell(para(bold("Item"))), headerCell(para(bold("Billing"))), headerCell(para(bold("Fee (₹)")))),
      row(cell(para("Module A — Social Media Marketing")), cell(para("Monthly")), cell(para("[ ]"))),
      row(cell(para("Module B — Local SEO and Google Business Profile")), cell(para("Monthly")), cell(para("[ ]"))),
      row(cell(para("Module C — Paid Ads Management")), cell(para("Monthly")), cell(para("[ ]"))),
      row(cell(para("Ad management fee for ad budget above ₹10,000")), cell(para("Monthly")), cell(para("10% of total monthly ad budget"))),
      row(cell(para("Setup (tracking, profile optimisation, account setup)")), cell(para("One-time")), cell(para("[ ]"))),
      row(cell(para("Add-ons from Module D")), cell(para("As used")), cell(para("[ ]"))),
      row(cell(para(bold("Total monthly fee"))), cell(para("")), cell(para(bold("[ ]")))),
      row(cell(para("GST @ 18%")), cell(para("")), cell(para("[Included / ₹ ]")))
    ),
    paraWithBold(
      "Standard plan — ₹10,000 per month, GST included: ",
      "8 social media posts, Google Business Profile management, and ad creation and management for ad budgets up to ₹10,000 per month. For ad budgets above ₹10,000, 10% of the total monthly ad budget is charged on top. Design work such as banners, menu cards and OOH is charged separately."
    ),
  ];
}

function paymentTermsSection() {
  return [
    heading(2, "Payment terms"),
    bulletList(
      listItem("Monthly fee payable in advance by the [5th] of each month."),
      listItem("Setup fee payable in full when the agreement is signed."),
      listItem("Minimum engagement of [3] months."),
      listItem("Payment by bank transfer or UPI to Social Buzz Media. Quoted in INR (or [USD / AUD / GBP / CAD] for international clients)."),
      listItem("Prices valid until [validity date].")
    ),
  ];
}

function requirementsSection() {
  return [
    heading(2, "What we need from you"),
    para("We can start within [7] days of signing once we have the items below."),
    bulletList(
      listItem("☐ Signed Service Agreement and first payment"),
      listItem("☐ Admin or partner access: Meta Business Manager, Google Ads, Google Business Profile, GA4, Google Tag Manager, website login"),
      listItem("☐ Your payment method added to the ad accounts"),
      listItem("☐ Brand assets: logo, colours, fonts, existing photos and videos"),
      listItem("☐ Products or services, prices, current offers and what makes you different"),
      listItem("☐ One decision-maker who approves content within [3] working days")
    ),
  ];
}

function nextStepsSection() {
  return [
    heading(2, "Next steps and acceptance"),
    orderedList(
      listItem("Review this proposal and send any questions by [date]."),
      listItem("Sign the Social Buzz Media Service Agreement and pay the setup fee and first month's fee."),
      listItem("Share the access and assets listed above; we hold the kick-off call within [3] working days.")
    ),
    para("This proposal is governed by the Social Buzz Media Service Agreement. Signing below confirms the scope and fees above."),
    acceptanceTable(),
  ];
}

// Matches the PDF literally — unlike the Agreement's signature block, the
// source leaves "[Founder]" bracketed even in the Social Buzz Media column,
// so this is reproduced verbatim rather than "corrected" to match the
// agreement template's own (different) convention.
function acceptanceTable() {
  return table(
    row(headerCell(para("")), headerCell(para(bold("Social Buzz Media"))), headerCell(para(bold("Client")))),
    row(cell(para("Name")), cell(para("Samim Akhter")), cell(para("[ ]"))),
    row(cell(para("Designation")), cell(para("[Founder]")), cell(para("[ ]"))),
    row(cell(para("Signature")), cell(para("")), cell(para(""))),
    row(cell(para("Date")), cell(para("")), cell(para("")))
  );
}

// The whole document as one flat list of top-level nodes, sliced into real
// A4 pages below — same approach agreementTemplates.js uses, same reasoning
// (page breaks at section boundaries, not the source PDF's incidental
// line-wrap-driven ones).
function buildFlatContent() {
  return [
    ...howToUseSection(),
    ...coverSection(),
    ...aboutSection(),
    ...understandingSection(),
    ...goalsSection(),
    ...strategySection(),
    heading(2, "Scope of services"),
    para("Your package includes the modules below. [Delete every module the client is not buying.]"),
    ...moduleA(),
    ...moduleB(),
    ...moduleC(),
    ...moduleD(),
    ...timelineSection(),
    ...reportingSection(),
    ...investmentSection(),
    ...paymentTermsSection(),
    ...requirementsSection(),
    ...nextStepsSection(),
  ];
}

// Splits a flat list of top-level nodes into chunks, starting a new chunk
// right before each node whose heading text matches one in `splitBefore` —
// identical helper to agreementTemplates.js's own (duplicated rather than
// imported, same per-domain-file convention the rest of this feature
// follows — see proposalTemplates.js's header comment).
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

// Roughly matches the source PDF's own 7-page count: cover/how-to-use
// together, about + discovery, goals + strategy, scope-intro + modules A/B,
// modules C/D, timeline, investment, then payment terms through signatures.
const PAGE_SPLIT_HEADINGS = [
  "About Social Buzz Media",
  "Goals and KPIs",
  "Scope of services",
  "Module C — Paid Ads Management",
  "Timeline and onboarding",
  "Investment",
  "Payment terms",
];

export function buildMasterProposalPages() {
  const chunks = splitIntoChunks(buildFlatContent(), PAGE_SPLIT_HEADINGS);
  return {
    version: 1,
    pages: chunks.map((content) => ({ id: genPageId(), content: { type: "doc", content } })),
  };
}

// Normalizes whatever's stored for a proposal's documentData into the
// current {version, pages: [...]} shape — same defensive upgrade path
// agreementTemplates.js's normalizeAgreementDocumentData uses.
export function normalizeProposalDocumentData(raw) {
  if (raw && Array.isArray(raw.pages)) return raw;
  if (raw && raw.type === "doc") return { version: 1, pages: [{ id: genPageId(), content: raw }] };
  return { version: 1, pages: [{ id: genPageId(), content: { type: "doc", content: [] } }] };
}

export const MASTER_PROPOSAL_TEMPLATE = {
  key: "sbm_proposal",
  name: "SBM Proposal",
  description: "The agency's standard proposal — package selection, discovery, goals, strategy, service modules, timeline, investment, and acceptance.",
  documentData: buildMasterProposalPages(),
};

export function getMasterProposalTemplate() {
  // A fresh object each call, not a shared reference — same reasoning as
  // getMasterAgreementTemplate().
  return JSON.parse(JSON.stringify(MASTER_PROPOSAL_TEMPLATE));
}

// Walks a Tiptap JSON node tree and replaces {{token}} placeholders —
// identical logic (and identical fix for the empty-text-node-rejected-by-
// ProseMirror bug) as agreementTemplates.js's interpolateAgreementDocument.
// A blank client field resolving a token to "" must not leave an empty text
// node behind, or the whole document fails schema validation on load.
export function interpolateProposalDocument(doc, values) {
  const replace = (value) => value.replace(/\{\{(\w+)\}\}/g, (match, key) => (values[key] !== undefined ? values[key] : match));

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

export function interpolateProposalPages(documentData, values) {
  documentData.pages.forEach((page) => {
    interpolateProposalDocument(page.content, values);
  });
  return documentData;
}
