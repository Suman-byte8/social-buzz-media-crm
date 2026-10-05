"use client";

import { useCallback, useState } from "react";
import { readImageFile } from "../../lib/readImageFile";
import { placeNewTile, shuffleTiles, tidyTiles } from "../../lib/customReportLayout";

let nextPageId = 1;

const makeEmptyPage = () => ({ id: nextPageId++, tiles: [] });

// Manages the invoice's Freeform report pages — same purely client-side,
// ephemeral setup as useReportImages.js (object URLs, nothing uploaded on
// its own), but each image is a positioned/sized/rotated tile the user drags
// around a page instead of an automatically packed grid row. New images
// always land on the current "active" page; the user switches pages by
// clicking one (see CustomReportPage.js).
export function useCustomReportPages() {
  const [pages, setPages] = useState(() => [makeEmptyPage()]);
  const [activePageId, setActivePageId] = useState(() => pages[0]?.id);
  const [error, setError] = useState("");

  const imageCount = pages.reduce((sum, p) => sum + p.tiles.length, 0);

  const addPage = useCallback(() => {
    const page = makeEmptyPage();
    setPages((prev) => [...prev, page]);
    setActivePageId(page.id);
  }, []);

  // Keeps at least one page around rather than letting the editor collapse
  // to zero pages — clears it instead when it's the last one left.
  const removePage = useCallback((pageId) => {
    setPages((prev) => {
      const target = prev.find((p) => p.id === pageId);
      if (!target) return prev;
      target.tiles.forEach((t) => URL.revokeObjectURL(t.src));

      if (prev.length === 1) {
        return [{ ...target, tiles: [] }];
      }
      const next = prev.filter((p) => p.id !== pageId);
      setActivePageId((current) => (current === pageId ? next[next.length - 1].id : current));
      return next;
    });
  }, []);

  const addImages = useCallback(
    async (fileList) => {
      const files = Array.from(fileList || []).filter((f) => f.type?.startsWith("image/"));
      if (files.length === 0) return;
      setError("");
      try {
        const added = await Promise.all(files.map(readImageFile));
        setPages((prev) =>
          prev.map((page) => {
            if (page.id !== activePageId) return page;
            const newTiles = added.map((img, i) => {
              const aspect = img.naturalWidth / img.naturalHeight;
              const placement = placeNewTile(page.tiles.length + i, aspect);
              return { ...img, ...placement, z: page.tiles.length + i };
            });
            return { ...page, tiles: [...page.tiles, ...newTiles] };
          })
        );
      } catch (err) {
        setError(err.message || "Failed to add image(s)");
      }
    },
    [activePageId]
  );

  const updateTile = useCallback((pageId, tileId, patch) => {
    setPages((prev) =>
      prev.map((page) =>
        page.id !== pageId
          ? page
          : { ...page, tiles: page.tiles.map((t) => (t.id === tileId ? { ...t, ...patch } : t)) }
      )
    );
  }, []);

  const removeTile = useCallback((pageId, tileId) => {
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        const target = page.tiles.find((t) => t.id === tileId);
        if (target) URL.revokeObjectURL(target.src);
        return { ...page, tiles: page.tiles.filter((t) => t.id !== tileId) };
      })
    );
  }, []);

  const bringToFront = useCallback((pageId, tileId) => {
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        const maxZ = Math.max(0, ...page.tiles.map((t) => t.z || 0));
        return { ...page, tiles: page.tiles.map((t) => (t.id === tileId ? { ...t, z: maxZ + 1 } : t)) };
      })
    );
  }, []);

  const shufflePage = useCallback((pageId) => {
    setPages((prev) => prev.map((page) => (page.id === pageId ? { ...page, tiles: shuffleTiles(page.tiles) } : page)));
  }, []);

  const tidyPage = useCallback((pageId) => {
    setPages((prev) => prev.map((page) => (page.id === pageId ? { ...page, tiles: tidyTiles(page.tiles) } : page)));
  }, []);

  return {
    pages,
    activePageId,
    setActivePage: setActivePageId,
    addPage,
    removePage,
    addImages,
    updateTile,
    removeTile,
    bringToFront,
    shufflePage,
    tidyPage,
    imageCount,
    error,
  };
}
