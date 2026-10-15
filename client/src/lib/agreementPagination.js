// Splits a Tiptap editor's rendered content into real A4-page-sized DOM
// containers for PDF export — the editor itself stays a normal continuous-
// scroll document while editing (no live pagination complexity); this is
// only invoked at export time.
//
// Why this exists: the chosen PDF pipeline (client/src/lib/Pdfexport.js,
// html2canvas-pro + jsPDF) captures one already-rendered DOM node per PDF
// page. A flowing rich-text document has no natural page boundaries of its
// own, so this walks the editor's actual rendered block elements (real
// HTML — headings, paragraphs, tables — since that's what Tiptap renders
// to) and distributes them across off-screen A4 containers by measured
// height, injecting a repeated header/footer into each one. Tables are
// kept atomic (moved to the next page if they don't fit) rather than
// split row-by-row — a reasonable simplification, not a general print
// engine.
//
// Same 210mm/297mm "sheet" convention every other document type in this
// app uses (see EditorCanvas.js, Invoicedocument.js, etc.).

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 20;
const HEADER_HEIGHT_MM = 14;
const FOOTER_HEIGHT_MM = 10;

function mmToPx(mm, pxPerMm) {
  return mm * pxPerMm;
}

function buildPageShell(pxPerMm) {
  const page = document.createElement("article");
  page.className = "sheet agreement-export-page";
  page.style.position = "absolute";
  page.style.left = "-99999px";
  page.style.top = "0";
  page.style.width = `${PAGE_WIDTH_MM}mm`;
  page.style.height = `${PAGE_HEIGHT_MM}mm`;
  page.style.background = "#FFFFFF";
  page.style.boxSizing = "border-box";
  page.style.fontFamily = "Inter, sans-serif";
  page.style.color = "#1A1A1A";
  page.style.overflow = "hidden";

  const content = document.createElement("div");
  content.className = "agreement-export-content";
  content.style.position = "absolute";
  content.style.top = `${HEADER_HEIGHT_MM}mm`;
  content.style.left = `${MARGIN_MM}mm`;
  content.style.width = `${PAGE_WIDTH_MM - MARGIN_MM * 2}mm`;
  content.style.height = `${PAGE_HEIGHT_MM - HEADER_HEIGHT_MM - FOOTER_HEIGHT_MM}mm`;
  content.style.fontSize = "13px";
  content.style.lineHeight = "1.6";
  content.style.overflow = "hidden";
  page.appendChild(content);

  return { page, content };
}

function buildHeader(agreementNumber) {
  const header = document.createElement("div");
  header.style.position = "absolute";
  header.style.top = "0";
  header.style.left = `${MARGIN_MM}mm`;
  header.style.width = `${PAGE_WIDTH_MM - MARGIN_MM * 2}mm`;
  header.style.height = `${HEADER_HEIGHT_MM}mm`;
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.borderBottom = "1px solid #E7E4DE";
  header.style.fontSize = "8.5px";
  header.style.color = "#6E6A65";
  header.innerHTML = `<span>Social Buzz Media</span><span>${agreementNumber || ""}</span>`;
  return header;
}

function buildFooter(pageNumber, totalPages) {
  const footer = document.createElement("div");
  footer.style.position = "absolute";
  footer.style.bottom = "0";
  footer.style.left = `${MARGIN_MM}mm`;
  footer.style.width = `${PAGE_WIDTH_MM - MARGIN_MM * 2}mm`;
  footer.style.height = `${FOOTER_HEIGHT_MM}mm`;
  footer.style.display = "flex";
  footer.style.alignItems = "center";
  footer.style.justifyContent = "center";
  footer.style.borderTop = "1px solid #E7E4DE";
  footer.style.fontSize = "8.5px";
  footer.style.color = "#6E6A65";
  footer.textContent = `Page ${pageNumber} of ${totalPages}`;
  return footer;
}

// Minimal styling so the plain HTML Tiptap renders (h1/h2/p/table/etc.)
// looks like a real document instead of unstyled browser defaults — kept
// here rather than relying on global CSS so export output doesn't depend
// on whatever stylesheet happens to be loaded wherever this runs. Sizes
// mirror globals.css's ".agreement-document .ProseMirror" rules exactly,
// so the exported PDF matches what the editor shows, not a second scale.
function applyBlockStyles(root) {
  root.querySelectorAll("h1").forEach((el) => {
    el.style.fontSize = "26px";
    el.style.fontWeight = "700";
    el.style.margin = "0 0 14px";
  });
  root.querySelectorAll("h2").forEach((el) => {
    el.style.fontSize = "16px";
    el.style.fontWeight = "700";
    el.style.margin = "20px 0 8px";
  });
  root.querySelectorAll("h3").forEach((el) => {
    el.style.fontSize = "14px";
    el.style.fontWeight = "700";
    el.style.margin = "14px 0 6px";
  });
  root.querySelectorAll("p").forEach((el) => {
    el.style.margin = "0 0 10px";
  });
  root.querySelectorAll("ul, ol").forEach((el) => {
    el.style.margin = "0 0 10px";
    el.style.paddingLeft = "22px";
    // Same Tailwind-preflight-strips-list-markers issue globals.css works
    // around for the live editor — this measuring/export DOM needs the
    // same fix so numbered clauses actually show their numbers in the PDF.
    el.style.listStyle = "revert";
  });
  root.querySelectorAll("li").forEach((el) => {
    el.style.margin = "0 0 4px";
    el.style.display = "list-item";
  });
  root.querySelectorAll("table").forEach((el) => {
    el.style.width = "100%";
    el.style.borderCollapse = "collapse";
    el.style.margin = "8px 0 16px";
  });
  root.querySelectorAll("th, td").forEach((el) => {
    el.style.border = "1px solid #D8D4CC";
    el.style.padding = "6px 8px";
    el.style.fontSize = "12px";
    el.style.verticalAlign = "top";
    el.style.textAlign = "left";
  });
  root.querySelectorAll("th").forEach((el) => {
    el.style.background = "#F5F3EF";
    el.style.fontWeight = "700";
  });
}

// `contentHtml` is the Tiptap editor's own rendered innerHTML (real DOM —
// headings/paragraphs/tables, with bold/italic/underline marks already
// resolved to <strong>/<em>/<u>) — not re-derived from the JSON doc
// separately, so whatever the user actually sees is exactly what exports.
export function paginateAgreementContent(contentHtml, { agreementNumber } = {}) {
  // A hidden, full-width measuring container — same page content width as
  // the real export pages, so wrapping/line-breaks measured here match
  // what each real page will actually show.
  const measure = document.createElement("div");
  measure.style.position = "absolute";
  measure.style.left = "-99999px";
  measure.style.top = "0";
  measure.style.width = `${PAGE_WIDTH_MM - MARGIN_MM * 2}mm`;
  measure.style.fontFamily = "Inter, sans-serif";
  measure.style.fontSize = "13px";
  measure.style.lineHeight = "1.6";
  measure.innerHTML = contentHtml;
  applyBlockStyles(measure);
  document.body.appendChild(measure);

  const pxPerMm = measure.getBoundingClientRect().width / (PAGE_WIDTH_MM - MARGIN_MM * 2);
  const maxContentHeightPx = mmToPx(PAGE_HEIGHT_MM - HEADER_HEIGHT_MM - FOOTER_HEIGHT_MM, pxPerMm);

  const blocks = Array.from(measure.children);
  const pagesOfBlocks = [];
  let currentPage = [];
  let currentHeight = 0;

  blocks.forEach((block) => {
    const blockHeight = block.getBoundingClientRect().height;
    if (currentPage.length > 0 && currentHeight + blockHeight > maxContentHeightPx) {
      pagesOfBlocks.push(currentPage);
      currentPage = [];
      currentHeight = 0;
    }
    currentPage.push(block);
    currentHeight += blockHeight;
  });
  if (currentPage.length > 0) pagesOfBlocks.push(currentPage);
  if (pagesOfBlocks.length === 0) pagesOfBlocks.push([]);

  document.body.removeChild(measure);

  const totalPages = pagesOfBlocks.length;
  const pageNodes = pagesOfBlocks.map((blocksForPage, index) => {
    const { page, content } = buildPageShell(pxPerMm);
    page.appendChild(buildHeader(agreementNumber));
    blocksForPage.forEach((block) => content.appendChild(block));
    page.appendChild(buildFooter(index + 1, totalPages));
    document.body.appendChild(page);
    return page;
  });

  return {
    pageNodes,
    // Export needs these actually attached to the document for html2canvas
    // to capture them (off-screen via `left: -99999px`, not display:none,
    // which would break layout/height). Caller must clean up afterward.
    cleanup: () => pageNodes.forEach((node) => node.remove()),
  };
}
