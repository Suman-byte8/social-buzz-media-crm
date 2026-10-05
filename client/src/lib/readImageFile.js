// Reads a File's natural pixel dimensions via a real <img> load rather than
// createImageBitmap, so the same object URL created here is exactly what
// ends up rendered on screen — no double decode. Shared by both the
// invoice's auto-packed report pages (useReportImages.js) and its freeform
// report pages (useCustomReportPages.js) — same source file, same need to
// know an image's aspect ratio before laying it out.
let nextId = 1;

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ id: nextId++, src, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
    img.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error(`Could not read image: ${file.name || "pasted image"}`));
    };
    img.src = src;
  });
}
