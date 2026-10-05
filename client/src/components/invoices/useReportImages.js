"use client";

import { useCallback, useState } from "react";
import { readImageFile } from "../../lib/readImageFile";

// Manages the pasted/uploaded screenshots for the invoice's Performance
// Report pages. Purely client-side and ephemeral (object URLs, never
// uploaded anywhere on their own) — they only end up persisted as pixels
// once baked into the exported PDF, same as every other field on the
// invoice sheet itself.
export function useReportImages() {
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");

  const addFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type?.startsWith("image/"));
    if (files.length === 0) return;
    setError("");
    try {
      const added = await Promise.all(files.map(readImageFile));
      setImages((prev) => [...prev, ...added]);
    } catch (err) {
      setError(err.message || "Failed to add image(s)");
    }
  }, []);

  const removeImage = useCallback((id) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.src);
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  return { images, addFiles, removeImage, error };
}
