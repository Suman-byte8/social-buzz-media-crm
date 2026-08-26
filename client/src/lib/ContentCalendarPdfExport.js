import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

/**
 * Renders a DOM node to a PDF whose page size exactly matches the
 * captured content — unlike a fixed-size (e.g. A4) export, this never
 * splits or shrinks the calendar across multiple pages: the "page" is
 * simply as big as it needs to be so every row fits in a single view.
 */
async function generateContentCalendarPdfBlob(node) {
  if (!node) throw new Error("Content calendar element not found");

  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const pdf = new jsPDF({
    unit: "px",
    format: [canvas.width, canvas.height],
    orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.98);
  pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height, undefined, "FAST");

  return pdf.output("blob");
}

export async function exportContentCalendarToPdf(node, filename) {
  const blob = await generateContentCalendarPdfBlob(node);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
