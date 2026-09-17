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
// width, and only shrunk further if it comes out taller than a full A4
// page — never stretched to fill a shorter page. That means a lightly
// filled last report page (e.g. one leftover image) just leaves blank
// space at the bottom of that PDF page instead of being blown up, and the
// single-page invoice keeps its existing "shrink to fit one page rather
// than spill onto an almost-empty second page" behavior.
function placeCanvasAsPage(pdf, canvas) {
  const imgWidthMm = A4_WIDTH_MM;
  let finalWidthMm = imgWidthMm;
  let finalHeightMm = (canvas.height * imgWidthMm) / canvas.width;

  if (finalHeightMm > A4_HEIGHT_MM) {
    const scale = A4_HEIGHT_MM / finalHeightMm;
    finalHeightMm = A4_HEIGHT_MM;
    finalWidthMm = imgWidthMm * scale;
  }

  const xOffset = (A4_WIDTH_MM - finalWidthMm) / 2;
  const imgData = canvas.toDataURL("image/jpeg", 0.98);
  pdf.addImage(imgData, "JPEG", xOffset, 0, finalWidthMm, finalHeightMm, undefined, "FAST");
}

/**
 * Renders the invoice sheet, plus any additional full sheets (e.g. the
 * report's pasted-screenshot pages), into one combined multi-page A4 PDF —
 * invoice first, then each extra page in order. `extraPageNodes` may
 * contain null/undefined entries (e.g. a ref not yet attached) — those are
 * skipped rather than throwing.
 */
async function generateInvoicePdfBlob(invoiceNode, extraPageNodes = []) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const invoiceCanvas = await captureSheetToCanvas(invoiceNode);
  placeCanvasAsPage(pdf, invoiceCanvas);

  for (const node of extraPageNodes) {
    if (!node) continue;
    const canvas = await captureSheetToCanvas(node);
    pdf.addPage();
    placeCanvasAsPage(pdf, canvas);
  }

  return pdf.output("blob");
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
