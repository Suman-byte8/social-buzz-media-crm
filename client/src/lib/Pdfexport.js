import jsPDF from "jspdf";
// html2canvas-pro is a maintained fork of html2canvas that adds support for
// modern CSS color functions (lab(), oklch(), color-mix(), etc.) which the
// original html2canvas cannot parse and will throw on.
import html2canvas from "html2canvas-pro";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Renders a DOM node to a PDF sized to true A4 dimensions, always fit onto
 * a single page.
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
 * dropdown, the decorative blur shape — none of that belongs in the PDF).
 * The removed client-picker <select> sits earlier in the page than the line
 * items table; deleting it first and *then* pairing up original/cloned
 * fields by list position (the previous approach) shifted every field after
 * it by one slot, so each line item silently rendered the *previous*
 * field's value. Pairing fields while both trees are still structurally
 * identical avoids that class of bug entirely, not just today's instance.
 */
async function generateInvoicePdfBlob(node) {
  if (!node) throw new Error("Invoice element not found");

  const canvas = await html2canvas(node, {
    scale: 3,
    useCORS: true,
    backgroundColor: "#ffffff",
    onclone: (clonedDoc) => {
      const clonedRoot = node.id
        ? clonedDoc.getElementById(node.id)
        : clonedDoc.body;
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

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const imgWidthMm = A4_WIDTH_MM;
  const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

  let finalWidthMm = imgWidthMm;
  let finalHeightMm = imgHeightMm;

  // This is a single-page invoice template — always fit it onto one A4
  // page. If the rendered content is slightly taller than one page, scale
  // the whole image down proportionally (and center it) rather than
  // spilling a few lines onto a near-empty second page.
  if (finalHeightMm > A4_HEIGHT_MM) {
    const scale = A4_HEIGHT_MM / finalHeightMm;
    finalHeightMm = A4_HEIGHT_MM;
    finalWidthMm = imgWidthMm * scale;
  }

  const xOffset = (A4_WIDTH_MM - finalWidthMm) / 2;
  const yOffset = 0;

  const imgData = canvas.toDataURL("image/jpeg", 0.98);
  pdf.addImage(
    imgData,
    "JPEG",
    xOffset,
    yOffset,
    finalWidthMm,
    finalHeightMm,
    undefined,
    "FAST",
  );

  return pdf.output("blob");
}

export async function exportInvoiceToPdf(node, filename) {
  const blob = await generateInvoicePdfBlob(node);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function getInvoicePdfBlob(node) {
  return generateInvoicePdfBlob(node);
}
