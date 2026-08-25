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
 * Two html2canvas quirks are worked around here, both handled inside
 * `onclone` (which runs against the offscreen clone html2canvas builds
 * right before rasterizing it):
 *
 * 1. `data-html2canvas-ignore` is NOT a feature html2canvas reads
 *    automatically in every version/fork — so elements meant to be
 *    PDF-only-hidden (edit controls, the client picker dropdown, the
 *    decorative blur shape) were still showing up in exports. We remove
 *    them from the clone ourselves instead of relying on the library to
 *    honor the attribute.
 * 2. `cloneNode()` (which html2canvas uses to snapshot the page) does not
 *    copy form field values that were set via a JS property — which is
 *    how React sets the value of a controlled input. Only values set as a
 *    literal HTML `value` attribute survive cloning. Without re-syncing
 *    values here, input/textarea contents can render blank in the
 *    captured canvas even though they look correct on screen.
 */
async function generateInvoicePdfBlob(node) {
  if (!node) throw new Error("Invoice element not found");

  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    onclone: (clonedDoc) => {
      const clonedRoot = node.id
        ? clonedDoc.getElementById(node.id)
        : clonedDoc.body;
      if (!clonedRoot) return;

      clonedRoot
        .querySelectorAll("[data-html2canvas-ignore]")
        .forEach((el) => el.remove());

      const originalFields = node.querySelectorAll("input, textarea, select");
      const clonedFields = clonedRoot.querySelectorAll(
        "input, textarea, select",
      );
      originalFields.forEach((original, i) => {
        const cloned = clonedFields[i];
        if (!cloned) return;
        if (cloned.tagName === "TEXTAREA") {
          cloned.textContent = original.value;
          cloned.value = original.value;
        } else {
          cloned.setAttribute("value", original.value);
          cloned.value = original.value;
        }
      });
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
