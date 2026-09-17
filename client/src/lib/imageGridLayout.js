// Packs a list of images (arbitrary aspect ratios — landscape, portrait,
// square, huge, tiny) into "justified rows" across as many A4 report pages
// as needed, the same technique photo galleries (Flickr, Google Photos)
// use: every image in a row is scaled to one shared row height so the row
// exactly fills the page width, then the row height itself is solved for
// from that constraint. Because every image only ever gets *scaled*
// (never stretched independently or cropped), its aspect ratio is always
// preserved exactly.
//
// Sizes below are in mm and mirror ReportImagePage.js's actual layout
// (a 210x297mm sheet, p-[14mm] padding, plus its header/footer chrome) —
// keep the two in sync if that page's chrome changes size.
const PAGE_CONTENT_WIDTH_MM = 182; // 210 - 14*2
const PAGE_CONTENT_HEIGHT_MM = 245; // 297 - 14*2 padding - ~header - ~footer
const GAP_MM = 4;
// Tuned so a page of typical landscape screenshots (~4:3 to 16:9) lands
// around 7-8 images (roughly 4 rows of ~2 images) — not a hard cap, just
// what the row-solving heuristic below aims for. Pages with more
// square/portrait images naturally fit more per row and more images per
// page; a single huge image just gets its own row.
const TARGET_ROW_HEIGHT_MM = 60;
// A lone very-wide or very-tall image can otherwise solve to a degenerate
// row height (e.g. a 3:1 panorama alone would "want" to be much taller
// than target to fill the row width) — clamp so no single row ever
// dominates a page.
const MAX_ROW_HEIGHT_MM = TARGET_ROW_HEIGHT_MM * 1.8;

function solveRowHeight(rowImages, containerWidth, gap) {
  const sumAspect = rowImages.reduce((sum, img) => sum + img.aspect, 0);
  const totalGap = gap * (rowImages.length - 1);
  return (containerWidth - totalGap) / sumAspect;
}

/**
 * @param {Array<{id, src, naturalWidth, naturalHeight}>} images
 * @returns {Array<{ rows: Array<{ height: number, items: Array<{id, src, width, height}> }> }>}
 *   One entry per report page, in the same order images were given.
 */
export function layoutImagesIntoPages(images) {
  const queue = (images || [])
    .filter((img) => img.naturalWidth > 0 && img.naturalHeight > 0)
    .map((img) => ({ ...img, aspect: img.naturalWidth / img.naturalHeight }));

  const pages = [];
  let currentRows = [];
  let currentHeight = 0;
  let rowBuffer = [];

  const startNewPageIfNeeded = (rowHeight) => {
    if (currentRows.length > 0 && currentHeight + rowHeight > PAGE_CONTENT_HEIGHT_MM) {
      pages.push({ rows: currentRows });
      currentRows = [];
      currentHeight = 0;
    }
  };

  const finalizeRow = () => {
    if (rowBuffer.length === 0) return;
    let rowHeight = solveRowHeight(rowBuffer, PAGE_CONTENT_WIDTH_MM, GAP_MM);
    // A single image taller than a whole page's content (extreme portrait)
    // would otherwise never fit — clamp so it always lands on its own page
    // rather than looping forever or overflowing.
    rowHeight = Math.min(rowHeight, MAX_ROW_HEIGHT_MM, PAGE_CONTENT_HEIGHT_MM);

    startNewPageIfNeeded(rowHeight);

    const items = rowBuffer.map((img) => ({
      id: img.id,
      src: img.src,
      width: rowHeight * img.aspect,
      height: rowHeight,
    }));
    currentRows.push({ height: rowHeight, items });
    currentHeight += rowHeight + GAP_MM;
    rowBuffer = [];
  };

  for (const img of queue) {
    rowBuffer.push(img);
    const heightIfFlushed = solveRowHeight(rowBuffer, PAGE_CONTENT_WIDTH_MM, GAP_MM);
    // Once adding another image would shrink the row below the target
    // height, the row is "full" — lock it in now rather than keep packing
    // (mirrors how justified photo galleries decide row breaks).
    if (heightIfFlushed <= TARGET_ROW_HEIGHT_MM) {
      finalizeRow();
    }
  }
  finalizeRow(); // trailing partial row, if any

  if (currentRows.length > 0) pages.push({ rows: currentRows });

  return pages;
}
