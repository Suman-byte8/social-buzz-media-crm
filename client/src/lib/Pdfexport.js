import jsPDF from "jspdf";
// html2canvas-pro is a maintained fork of html2canvas that adds support for
// modern CSS color functions (lab(), oklch(), color-mix(), etc.) which the
// original html2canvas cannot parse and will throw on.
import html2canvas from "html2canvas-pro";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Renders one DOM node ("sheet") to a canvas.
 *
 * Every field (input/textarea) is swapped for a plain <span>/<div> carrying
 * the same text and CSS classes before anything else touches the clone,
 * handled inside `onclone` (which runs against the offscreen clone
 * html2canvas builds right before rasterizing it). This works around two
 * separate html2canvas quirks at once:
 *
 * 1. `cloneNode()` (which html2canvas uses to snapshot the page) does not
 *    copy form field values that were set via a JS property — which is how
 *    React sets the value of a controlled input. Reading `.value` off the
 *    *live* `node` here (not the clone) sidesteps that entirely.
 * 2. html2canvas's own text renderer for <input>/<textarea> elements can
 *    clip content that a real browser renders with room to spare — observed
 *    on the header's right-aligned date fields, whose text only needs
 *    ~60% of the input's width yet still came out cut off. Ordinary text
 *    nodes don't go through that code path, so replacing the field with one
 *    avoids the bug rather than fighting it.
 *
 * This substitution has to happen *before* `[data-html2canvas-ignore]`
 * elements are removed from the clone (edit controls, the client picker
 * dropdown, the decorative blur shape, a report page's per-image remove
 * button — none of that belongs in the PDF). The removed client-picker
 * <select> sits earlier in the page than the line items table; deleting it
 * first and *then* pairing up original/cloned fields by list position (the
 * previous approach) shifted every field after it by one slot, so each line
 * item silently rendered the *previous* field's value. Pairing fields while
 * both trees are still structurally identical avoids that class of bug
 * entirely, not just today's instance.
 *
 * Report pages (ReportImagePage.js) have no input/textarea fields, so this
 * step is simply a no-op for them — the ignore-attribute stripping is what
 * they actually rely on this shared function for.
 */
async function captureSheetToCanvas(node) {
  if (!node) throw new Error("Sheet element not found");

  return html2canvas(node, {
    scale: 3,
    useCORS: true,
    backgroundColor: "#ffffff",
    onclone: (clonedDoc) => {
      const clonedRoot = node.id ? clonedDoc.getElementById(node.id) : clonedDoc.body;
      if (!clonedRoot) return;

      const originalFields = node.querySelectorAll("input, textarea");
      const clonedFields = clonedRoot.querySelectorAll("input, textarea");
      originalFields.forEach((original, i) => {
        const cloned = clonedFields[i];
        if (!cloned) return;
        const isMultiline = cloned.tagName === "TEXTAREA";
        const replacement = clonedDoc.createElement(isMultiline ? "div" : "span");
        replacement.className = cloned.className;
        replacement.style.display = isMultiline ? "block" : "inline-block";
        replacement.style.whiteSpace = isMultiline ? "pre-wrap" : "pre";
        replacement.textContent = original.value;
        cloned.replaceWith(replacement);
      });

      clonedRoot
        .querySelectorAll("[data-html2canvas-ignore]")
        .forEach((el) => el.remove());
    },
  });
}

// Places a captured canvas as the PDF's current page: fit to the page
// width, and only shrunk further if it comes out taller than a full page —
// never stretched to fill a shorter page. That means a lightly filled last
// report page (e.g. one leftover image) just leaves blank space at the
// bottom of that PDF page instead of being blown up, and the single-page
// invoice keeps its existing "shrink to fit one page rather than spill onto
// an almost-empty second page" behavior.
function placeCanvasAsPage(pdf, canvas, pageWidthMm, pageHeightMm) {
  let finalWidthMm = pageWidthMm;
  let finalHeightMm = (canvas.height * pageWidthMm) / canvas.width;

  if (finalHeightMm > pageHeightMm) {
    const scale = pageHeightMm / finalHeightMm;
    finalHeightMm = pageHeightMm;
    finalWidthMm = pageWidthMm * scale;
  }

  const xOffset = (pageWidthMm - finalWidthMm) / 2;
  const imgData = canvas.toDataURL("image/jpeg", 0.98);
  pdf.addImage(imgData, "JPEG", xOffset, 0, finalWidthMm, finalHeightMm, undefined, "FAST");
}

/**
 * Renders an arbitrary list of already-mounted DOM "sheet" nodes into one
 * combined multi-page PDF, in order. Entries may be null/undefined (e.g. a
 * ref not yet attached) — those are skipped rather than throwing. Used
 * directly by the Report Builder (any number of pages, portrait or
 * landscape) and indirectly by the invoice/salary-slip exports below
 * (always one primary node + optional extra pages, always A4 portrait).
 */
async function generatePdfFromNodes(nodes, { orientation = "portrait" } = {}) {
  const pageWidthMm = orientation === "landscape" ? A4_HEIGHT_MM : A4_WIDTH_MM;
  const pageHeightMm = orientation === "landscape" ? A4_WIDTH_MM : A4_HEIGHT_MM;
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation });

  const validNodes = (nodes || []).filter(Boolean);
  for (let i = 0; i < validNodes.length; i++) {
    const canvas = await captureSheetToCanvas(validNodes[i]);
    if (i > 0) pdf.addPage();
    placeCanvasAsPage(pdf, canvas, pageWidthMm, pageHeightMm);
  }

  return pdf.output("blob");
}

async function generateInvoicePdfBlob(invoiceNode, extraPageNodes = []) {
  return generatePdfFromNodes([invoiceNode, ...extraPageNodes]);
}

export async function exportInvoiceToPdf(invoiceNode, filename, extraPageNodes = []) {
  const blob = await generateInvoicePdfBlob(invoiceNode, extraPageNodes);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function getInvoicePdfBlob(invoiceNode, extraPageNodes = []) {
  return generateInvoicePdfBlob(invoiceNode, extraPageNodes);
}

// Generic versions of the two exports above, for callers (the Report
// Builder) that have their own flat list of N page nodes rather than one
// "primary" node plus extras, and that may need landscape orientation.
export async function getNodesPdfBlob(nodes, options) {
  return generatePdfFromNodes(nodes, options);
}

export async function exportNodesToPdf(nodes, filename, options) {
  const blob = await generatePdfFromNodes(nodes, options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
