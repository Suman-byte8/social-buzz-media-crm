// Maps a file's mimetype to a Material Symbols icon name + color class, for
// compact file chips/lists that show any uploaded file type (not just
// PDFs) — e.g. the Leads page's document cards.
export function fileIconFor(fileType) {
  if (!fileType) return { icon: "draft", color: "text-gray-400" };
  if (fileType.startsWith("image/")) return { icon: "image", color: "text-purple-500" };
  if (fileType.startsWith("video/")) return { icon: "movie", color: "text-blue-500" };
  if (fileType.startsWith("audio/")) return { icon: "audio_file", color: "text-pink-500" };
  if (fileType === "application/pdf") return { icon: "picture_as_pdf", color: "text-red-500" };
  if (fileType.includes("word") || fileType.includes("document")) return { icon: "description", color: "text-blue-600" };
  if (fileType.includes("sheet") || fileType.includes("excel") || fileType === "text/csv") {
    return { icon: "table_chart", color: "text-emerald-600" };
  }
  if (fileType.includes("presentation") || fileType.includes("powerpoint")) {
    return { icon: "slideshow", color: "text-orange-500" };
  }
  if (fileType.includes("zip") || fileType.includes("compressed") || fileType.includes("archive")) {
    return { icon: "folder_zip", color: "text-amber-600" };
  }
  return { icon: "draft", color: "text-gray-400" };
}
