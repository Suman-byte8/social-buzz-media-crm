// Pure data: the Report Builder's built-in starter templates. Each one is a
// real, populated page/element tree the editor opens directly into — not a
// preview image. Built from a handful of shared page-shape helpers (cover,
// KPI+screenshot page, two/four-up gallery, summary table, thank-you)
// parametrized per template (accent color, titles, KPI labels) rather than
// eight entirely bespoke hand-positioned layouts, which would be a lot of
// near-duplicate positioning code for marginal visual difference between,
// say, an SEO audit and a technical audit.
//
// This is the single source of truth for built-in templates — the client
// never carries its own copy; it always fetches the list from
// GET /report-templates (see reportRoutes.js), the same way it fetches
// clients/team members rather than hardcoding them.

const PAGE_W = 210; // A4 portrait, mm — matches the invoice/salary-slip canvases
const PAGE_H = 297;

let nextElementId = 1;
const eid = () => `el-${nextElementId++}`;

function textEl({ x, y, width, height, html, fontSize = 12, color = "#1A1A1A", align = "left", bold = false }) {
  return {
    id: eid(),
    type: "text",
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex: 1,
    html,
    fontSize,
    fontFamily: "Inter",
    color,
    align,
    bold,
    italic: false,
    underline: false,
    lineHeight: 1.4,
    letterSpacing: 0,
  };
}

// clipPoints is only meaningful for shapeType "diagonal" (see
// ShapeElementContent.js) — a polygon over the shape's own box as
// [xPercent, yPercent] pairs, left undefined for every other shape type so
// it falls through to that component's own default angled cut.
function shapeEl({ x, y, width, height, shapeType = "rect", fill = "#1A1A1A", stroke = null, strokeWidth = 0, zIndex = 0, clipPoints }) {
  return { id: eid(), type: "shape", x, y, width, height, rotation: 0, zIndex, shapeType, fill, stroke, strokeWidth, ...(clipPoints ? { clipPoints } : {}) };
}

function kpiEl({ x, y, width, height, label, value, trend = "", accentColor = "#E8262A" }) {
  return { id: eid(), type: "kpi", x, y, width, height, rotation: 0, zIndex: 1, label, value, trend, accentColor };
}

function imagePlaceholderEl({ x, y, width, height, caption = "" }) {
  return imageEl({ x, y, width, height, caption, assetId: null, src: null });
}

// Same shape as imagePlaceholderEl but for an image that's already been
// uploaded (assetId/src set) — used by buildPagesFromAiPlan below. The box
// size here is a reasonable landscape-screenshot default, not the image's
// real dimensions (this app has no server-side image-dimension reader and
// deliberately doesn't add one just for this — see geminiVision.js's
// caller). That's fine: ImageElementContent.js always renders with
// object-fit:contain, so a box whose aspect ratio doesn't exactly match the
// real image just letterboxes instead of ever stretching/distorting it, and
// the user can resize precisely in the editor afterward regardless.
function imageEl({ x, y, width, height, assetId, src, caption = "" }) {
  return {
    id: eid(),
    type: "image",
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex: 1,
    assetId,
    src,
    fit: "contain",
    borderRadius: 2,
    caption,
  };
}

function tableEl({ x, y, width, height, rows }) {
  return { id: eid(), type: "table", x, y, width, height, rotation: 0, zIndex: 1, rows, headerRow: true };
}

// Bundled as a static client asset (client/public/images/sbm_logo.png)
// rather than a Drive-uploaded one — assetId stays null (nothing to clean up
// on delete/replace) and src is a plain same-origin path ImageElementContent
// renders directly, unchanged by getAssetUrl. 300x90 source → 50x15mm here
// keeps its real aspect ratio so object-fit:contain never letterboxes it.
function logoEl({ x, y, width = 50, height = 15 }) {
  return imageEl({ x, y, width, height, assetId: null, src: "/images/sbm_logo.png" });
}

function coverPage({ accentColor, reportTitle, reportSubtitle }) {
  return {
    id: `page-${eid()}`,
    name: "Cover",
    kind: "cover",
    background: { type: "color", value: "#FFFFFF" },
    elements: [
      shapeEl({ x: 0, y: 0, width: PAGE_W, height: 6, fill: accentColor }),
      shapeEl({ x: 0, y: PAGE_H - 40, width: PAGE_W, height: 40, fill: accentColor }),
      logoEl({ x: 20, y: 24 }),
      textEl({ x: 20, y: 100, width: PAGE_W - 40, height: 30, html: reportTitle, fontSize: 30, bold: true }),
      textEl({ x: 20, y: 132, width: PAGE_W - 40, height: 14, html: reportSubtitle, fontSize: 13, color: "#6E6A65" }),
      textEl({ x: 20, y: 160, width: PAGE_W - 40, height: 10, html: "Prepared for {{clientName}}", fontSize: 12, bold: true }),
      textEl({ x: 20, y: 172, width: PAGE_W - 40, height: 8, html: "Reporting period: {{reportPeriod}}", fontSize: 10, color: "#6E6A65" }),
      textEl({ x: 20, y: PAGE_H - 28, width: 120, height: 8, html: "Prepared by {{preparedBy}}", fontSize: 9, color: "#FFFFFF" }),
      textEl({ x: 20, y: PAGE_H - 18, width: 120, height: 8, html: "{{reportDate}}", fontSize: 9, color: "#FFFFFF" }),
    ],
  };
}

// A second, more editorial cover — hero photo with the title overlapping its
// bottom edge, a stacked pair of framed photos down the left, and a diagonal
// accent block on the right carrying the subtitle/client/period, closing
// with the agency logo bottom-right. Same (accentColor, reportTitle,
// reportSubtitle) signature as coverPage() so it's a drop-in alternative
// wherever a template's cover is built, not a special-cased flow. Every
// element here is a plain, independently draggable text/image/shape element
// — nothing is a flattened graphic.
function premiumCoverPage({ accentColor, reportTitle, reportSubtitle }) {
  return {
    id: `page-${eid()}`,
    name: "Cover",
    kind: "cover",
    background: { type: "color", value: "#FAF7F0" },
    elements: [
      imagePlaceholderEl({ x: 0, y: 0, width: PAGE_W, height: 118, caption: "Add a hero photo" }),
      textEl({ x: 16, y: 78, width: PAGE_W - 32, height: 34, html: reportTitle, fontSize: 32, bold: true, color: "#FFFFFF", fontFamily: "Montserrat, sans-serif" }),
      textEl({ x: 16, y: 112, width: PAGE_W - 32, height: 8, html: "Prepared for {{clientName}}", fontSize: 10, bold: true, color: "#FFFFFF", letterSpacing: 1 }),
      imagePlaceholderEl({ x: 16, y: 130, width: 58, height: 68, caption: "Photo 1" }),
      imagePlaceholderEl({ x: 16, y: 202, width: 58, height: 68, caption: "Photo 2" }),
      shapeEl({ x: 80, y: 124, width: PAGE_W - 80 - 16, height: 156, shapeType: "diagonal", fill: accentColor }),
      textEl({ x: 92, y: 148, width: PAGE_W - 92 - 16, height: 40, html: reportSubtitle, fontSize: 20, bold: true, color: "#FFFFFF" }),
      textEl({ x: 92, y: 195, width: PAGE_W - 92 - 16, height: 8, html: "Reporting period: {{reportPeriod}}", fontSize: 9, color: "#FFFFFF" }),
      textEl({ x: 92, y: 207, width: PAGE_W - 92 - 16, height: 8, html: "{{reportDate}}", fontSize: 8, color: "#F2EFEA" }),
      textEl({ x: 16, y: 282, width: 130, height: 8, html: "Prepared by {{preparedBy}}", fontSize: 8, color: "#6E6A65" }),
      logoEl({ x: 150, y: 284, width: 44, height: 13.2 }),
    ],
  };
}

function kpiGalleryPage({ accentColor, title, kpis }) {
  const kpiWidth = (PAGE_W - 28 - 18) / 4;
  return {
    id: `page-${eid()}`,
    name: title,
    kind: "inner",
    background: { type: "color", value: "#FFFFFF" },
    elements: [
      shapeEl({ x: 0, y: 0, width: PAGE_W, height: 4, fill: accentColor }),
      textEl({ x: 14, y: 14, width: PAGE_W - 28, height: 12, html: title, fontSize: 18, bold: true }),
      ...kpis.map((k, i) =>
        kpiEl({ x: 14 + i * (kpiWidth + 6), y: 34, width: kpiWidth, height: 28, label: k.label, value: k.value, trend: k.trend, accentColor })
      ),
      imagePlaceholderEl({ x: 14, y: 72, width: PAGE_W - 28, height: 150, caption: "Paste or upload a screenshot here" }),
      textEl({ x: 14, y: 232, width: PAGE_W - 28, height: 40, html: "Add your analysis and notes here.", fontSize: 11, color: "#6E6A65" }),
    ],
  };
}

function twoColumnGalleryPage({ accentColor, title }) {
  const colWidth = (PAGE_W - 28 - 8) / 2;
  return {
    id: `page-${eid()}`,
    name: title,
    kind: "gallery",
    background: { type: "color", value: "#FFFFFF" },
    elements: [
      shapeEl({ x: 0, y: 0, width: PAGE_W, height: 4, fill: accentColor }),
      textEl({ x: 14, y: 14, width: PAGE_W - 28, height: 12, html: title, fontSize: 18, bold: true }),
      imagePlaceholderEl({ x: 14, y: 34, width: colWidth, height: 120, caption: "Screenshot 1" }),
      imagePlaceholderEl({ x: 14 + colWidth + 8, y: 34, width: colWidth, height: 120, caption: "Screenshot 2" }),
      imagePlaceholderEl({ x: 14, y: 160, width: colWidth, height: 120, caption: "Screenshot 3" }),
      imagePlaceholderEl({ x: 14 + colWidth + 8, y: 160, width: colWidth, height: 120, caption: "Screenshot 4" }),
    ],
  };
}

function summaryTablePage({ accentColor, title, columns }) {
  return {
    id: `page-${eid()}`,
    name: title,
    kind: "summary",
    background: { type: "color", value: "#FFFFFF" },
    elements: [
      shapeEl({ x: 0, y: 0, width: PAGE_W, height: 4, fill: accentColor }),
      textEl({ x: 14, y: 14, width: PAGE_W - 28, height: 12, html: title, fontSize: 18, bold: true }),
      tableEl({ x: 14, y: 34, width: PAGE_W - 28, height: 140, rows: [columns, ["", "", ""], ["", "", ""], ["", "", ""], ["", "", ""]] }),
      textEl({ x: 14, y: 190, width: PAGE_W - 28, height: 40, html: "Key takeaways and recommendations go here.", fontSize: 11, color: "#6E6A65" }),
    ],
  };
}

function thankYouPage({ accentColor }) {
  return {
    id: `page-${eid()}`,
    name: "Thank You",
    kind: "thankyou",
    background: { type: "color", value: accentColor },
    elements: [
      textEl({ x: 20, y: 120, width: PAGE_W - 40, height: 20, html: "Thank you", fontSize: 28, bold: true, color: "#FFFFFF" }),
      textEl({ x: 20, y: 150, width: PAGE_W - 40, height: 20, html: "We appreciate the opportunity to work with {{clientName}}.", fontSize: 12, color: "#FFFFFF" }),
      textEl({ x: 20, y: PAGE_H - 50, width: PAGE_W - 40, height: 10, html: "hellosocialbuzzmedia@gmail.com", fontSize: 10, color: "#FFFFFF" }),
      textEl({ x: 20, y: PAGE_H - 38, width: PAGE_W - 40, height: 10, html: "socialbuzzmedia.in", fontSize: 10, color: "#FFFFFF" }),
    ],
  };
}

// One page of the "auto-generate from screenshots" flow (see
// geminiVision.js + reportRoutes.js's POST /reports/auto-generate): a
// heading, an optional KPI row, 1-4 real uploaded images laid out by count
// (full-width / side-by-side / 2x2 grid), and an AI-written summary.
function autoGeneratedPage({ accentColor, pageTitle, summary, kpis, images }) {
  const contentWidth = PAGE_W - 28;
  const elements = [shapeEl({ x: 0, y: 0, width: PAGE_W, height: 4, fill: accentColor }), textEl({ x: 14, y: 14, width: contentWidth, height: 12, html: pageTitle, fontSize: 18, bold: true })];

  let cursorY = 32;

  if (kpis.length > 0) {
    const gap = 6;
    const kpiWidth = (contentWidth - gap * (kpis.length - 1)) / kpis.length;
    kpis.forEach((k, i) => {
      elements.push(kpiEl({ x: 14 + i * (kpiWidth + gap), y: cursorY, width: kpiWidth, height: 26, label: k.label, value: k.value, accentColor }));
    });
    cursorY += 26 + 10;
  }

  const summaryHeight = summary ? 28 : 0;
  const imagesAreaHeight = Math.max(60, PAGE_H - cursorY - 14 - summaryHeight - 6);
  const gap = 6;
  const placed = images.slice(0, 4);

  if (placed.length === 1) {
    elements.push(imageEl({ x: 14, y: cursorY, width: contentWidth, height: imagesAreaHeight, assetId: placed[0].id, src: placed[0].src }));
  } else if (placed.length === 2) {
    const w = (contentWidth - gap) / 2;
    placed.forEach((img, i) => elements.push(imageEl({ x: 14 + i * (w + gap), y: cursorY, width: w, height: imagesAreaHeight, assetId: img.id, src: img.src })));
  } else if (placed.length > 0) {
    const w = (contentWidth - gap) / 2;
    const h = (imagesAreaHeight - gap) / 2;
    placed.forEach((img, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      elements.push(imageEl({ x: 14 + col * (w + gap), y: cursorY + row * (h + gap), width: w, height: h, assetId: img.id, src: img.src }));
    });
  }

  if (summary) {
    elements.push(textEl({ x: 14, y: PAGE_H - 14 - summaryHeight, width: contentWidth, height: summaryHeight, html: summary, fontSize: 10, color: "#6E6A65" }));
  }

  return { id: `page-${eid()}`, name: pageTitle, kind: "inner", background: { type: "color", value: "#FFFFFF" }, elements };
}

// Turns a sanitized Gemini plan (see geminiVision.js) plus the Document rows
// already uploaded for each screenshot into a full, ready-to-edit
// documentData — same cover/thank-you chrome as every built-in template, so
// an AI-generated report looks like it belongs next to a hand-picked one.
// `assets` must be in the same order the images were sent to Gemini, so
// plan.pages[].imageIndexes (0-based, into that same order) line up.
export function buildPagesFromAiPlan(plan, assets, { accentColor = "#E8262A", clientName = "" } = {}) {
  const innerPages = plan.pages.map((p) =>
    autoGeneratedPage({
      accentColor,
      pageTitle: p.pageTitle,
      summary: p.summary,
      kpis: p.kpis || [],
      images: p.imageIndexes.map((i) => assets[i]).filter(Boolean),
    })
  );

  return {
    version: 1,
    pageSize: "a4-portrait",
    pages: [
      coverPage({ accentColor, reportTitle: plan.reportTitle, reportSubtitle: plan.reportSubtitle || `Prepared for ${clientName}` }),
      ...innerPages,
      thankYouPage({ accentColor }),
    ],
  };
}

function buildTemplate({ key, name, description, category, accentColor, reportTitle, reportSubtitle, innerPages }) {
  return {
    key,
    name,
    description,
    category,
    documentData: {
      version: 1,
      pageSize: "a4-portrait",
      pages: [coverPage({ accentColor, reportTitle, reportSubtitle }), ...innerPages, thankYouPage({ accentColor })],
    },
  };
}

export const BUILT_IN_TEMPLATES = [
  {
    key: "premium_agency",
    name: "Premium Agency Report",
    description: "An editorial cover with a hero photo, framed image column, and an accent block — the dressiest starting point.",
    category: "premium",
    documentData: {
      version: 1,
      pageSize: "a4-portrait",
      pages: [
        premiumCoverPage({ accentColor: "#1B4332", reportTitle: "Performance Report", reportSubtitle: "A closer look at the results" }),
        ...[
          kpiGalleryPage({
            accentColor: "#1B4332",
            title: "Overview",
            kpis: [
              { label: "Metric 1", value: "—" },
              { label: "Metric 2", value: "—" },
              { label: "Metric 3", value: "—" },
              { label: "Metric 4", value: "—" },
            ],
          }),
          twoColumnGalleryPage({ accentColor: "#1B4332", title: "Screenshots" }),
        ],
        thankYouPage({ accentColor: "#1B4332" }),
      ],
    },
  },
  buildTemplate({
    key: "website_performance",
    name: "Website Performance Report",
    description: "Traffic, speed, and engagement metrics for a client's website.",
    category: "website",
    accentColor: "#2563EB",
    reportTitle: "Website Performance Report",
    reportSubtitle: "Traffic, speed & engagement overview",
    innerPages: [
      kpiGalleryPage({
        accentColor: "#2563EB",
        title: "Traffic Overview",
        kpis: [
          { label: "Sessions", value: "—" },
          { label: "Users", value: "—" },
          { label: "Bounce Rate", value: "—" },
          { label: "Avg. Duration", value: "—" },
        ],
      }),
      twoColumnGalleryPage({ accentColor: "#2563EB", title: "Analytics Screenshots" }),
      summaryTablePage({ accentColor: "#2563EB", title: "Top Pages", columns: ["Page", "Sessions", "Conversion Rate"] }),
    ],
  }),
  buildTemplate({
    key: "seo_audit",
    name: "SEO Audit Report",
    description: "Technical SEO health, keyword rankings, and recommendations.",
    category: "seo",
    accentColor: "#059669",
    reportTitle: "SEO Audit Report",
    reportSubtitle: "Technical health & keyword performance",
    innerPages: [
      kpiGalleryPage({
        accentColor: "#059669",
        title: "SEO Health Overview",
        kpis: [
          { label: "Site Health", value: "—" },
          { label: "Keywords Ranked", value: "—" },
          { label: "Backlinks", value: "—" },
          { label: "Core Web Vitals", value: "—" },
        ],
      }),
      twoColumnGalleryPage({ accentColor: "#059669", title: "Audit Screenshots" }),
      summaryTablePage({ accentColor: "#059669", title: "Keyword Rankings", columns: ["Keyword", "Position", "Search Volume"] }),
    ],
  }),
  buildTemplate({
    key: "social_media",
    name: "Social Media Performance Report",
    description: "Follower growth, engagement, and top posts across platforms.",
    category: "social",
    accentColor: "#DB2777",
    reportTitle: "Social Media Performance Report",
    reportSubtitle: "Growth & engagement across platforms",
    innerPages: [
      kpiGalleryPage({
        accentColor: "#DB2777",
        title: "Growth Overview",
        kpis: [
          { label: "Followers", value: "—" },
          { label: "Engagement Rate", value: "—" },
          { label: "Reach", value: "—" },
          { label: "Impressions", value: "—" },
        ],
      }),
      twoColumnGalleryPage({ accentColor: "#DB2777", title: "Platform Dashboards" }),
      summaryTablePage({ accentColor: "#DB2777", title: "Top Performing Posts", columns: ["Post", "Platform", "Engagement"] }),
    ],
  }),
  buildTemplate({
    key: "monthly_digital_marketing",
    name: "Monthly Digital Marketing Report",
    description: "A full-funnel monthly summary across channels.",
    category: "marketing",
    accentColor: "#E8262A",
    reportTitle: "Monthly Digital Marketing Report",
    reportSubtitle: "Cross-channel performance summary",
    innerPages: [
      kpiGalleryPage({
        accentColor: "#E8262A",
        title: "Monthly Overview",
        kpis: [
          { label: "Leads", value: "—" },
          { label: "Ad Spend", value: "—" },
          { label: "ROAS", value: "—" },
          { label: "Conversions", value: "—" },
        ],
      }),
      twoColumnGalleryPage({ accentColor: "#E8262A", title: "Channel Screenshots" }),
      summaryTablePage({ accentColor: "#E8262A", title: "Channel Breakdown", columns: ["Channel", "Spend", "Conversions"] }),
    ],
  }),
  buildTemplate({
    key: "website_dev_progress",
    name: "Website Development Progress Report",
    description: "Milestones, completed work, and next steps for a build project.",
    category: "development",
    accentColor: "#7C3AED",
    reportTitle: "Website Development Progress Report",
    reportSubtitle: "Milestones & delivery status",
    innerPages: [
      summaryTablePage({ accentColor: "#7C3AED", title: "Milestones", columns: ["Milestone", "Status", "Target Date"] }),
      twoColumnGalleryPage({ accentColor: "#7C3AED", title: "Progress Screenshots" }),
    ],
  }),
  buildTemplate({
    key: "technical_audit",
    name: "Technical Audit Report",
    description: "Site health, performance, and security findings.",
    category: "technical",
    accentColor: "#0891B2",
    reportTitle: "Technical Audit Report",
    reportSubtitle: "Performance, security & health findings",
    innerPages: [
      kpiGalleryPage({
        accentColor: "#0891B2",
        title: "Technical Health",
        kpis: [
          { label: "Performance Score", value: "—" },
          { label: "Accessibility", value: "—" },
          { label: "Best Practices", value: "—" },
          { label: "SEO Score", value: "—" },
        ],
      }),
      twoColumnGalleryPage({ accentColor: "#0891B2", title: "Audit Screenshots" }),
      summaryTablePage({ accentColor: "#0891B2", title: "Findings & Recommendations", columns: ["Issue", "Severity", "Recommendation"] }),
    ],
  }),
  buildTemplate({
    key: "client_project_progress",
    name: "Client Project Progress Report",
    description: "A general-purpose project status update for any client engagement.",
    category: "project",
    accentColor: "#D97706",
    reportTitle: "Project Progress Report",
    reportSubtitle: "Status update & next steps",
    innerPages: [
      summaryTablePage({ accentColor: "#D97706", title: "Tasks Completed", columns: ["Task", "Owner", "Status"] }),
      twoColumnGalleryPage({ accentColor: "#D97706", title: "Project Screenshots" }),
    ],
  }),
  {
    key: "blank",
    name: "Custom Blank Report",
    description: "Start from a single blank cover page and build it your way.",
    category: "custom",
    documentData: {
      version: 1,
      pageSize: "a4-portrait",
      pages: [coverPage({ accentColor: "#1A1A1A", reportTitle: "Untitled Report", reportSubtitle: "" })],
    },
  },
];

export function getBuiltInTemplateByKey(key) {
  return BUILT_IN_TEMPLATES.find((t) => t.key === key) || null;
}

// Deep-clones a template/report's documentData and assigns fresh ids to
// every page/element, so cloning a template (or duplicating a report)
// never shares object identity with the source — editing the copy must
// never be able to mutate the original.
export function cloneDocumentData(documentData) {
  const cloned = JSON.parse(JSON.stringify(documentData));
  cloned.pages = cloned.pages.map((page) => ({
    ...page,
    id: `page-${eid()}`,
    elements: page.elements.map((el) => ({ ...el, id: eid() })),
  }));
  return cloned;
}

// Replaces {{token}} placeholders in every text element's html across the
// document with real values — run right after cloning a template into a
// new report, so the cover/thank-you pages show the actual client name and
// date instead of literal placeholder text.
export function interpolateDocumentData(documentData, values) {
  const replace = (html) =>
    typeof html === "string" ? html.replace(/\{\{(\w+)\}\}/g, (match, key) => (values[key] !== undefined ? values[key] : match)) : html;

  documentData.pages.forEach((page) => {
    page.elements.forEach((el) => {
      if (el.type === "text") el.html = replace(el.html);
    });
  });
  return documentData;
}
