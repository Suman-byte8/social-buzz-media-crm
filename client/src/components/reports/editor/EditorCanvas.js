"use client";
import React, { useRef } from "react";
import CanvasElement from "./CanvasElement";
import TextElementContent from "./elements/TextElementContent";
import ImageElementContent from "./elements/ImageElementContent";
import ShapeElementContent from "./elements/ShapeElementContent";
import TableElementContent from "./elements/TableElementContent";
import KpiElementContent from "./elements/KpiElementContent";

export const PAGE_SIZES = {
  "a4-portrait": { width: 210, height: 297 },
  "a4-landscape": { width: 297, height: 210 },
};

function ElementContent({ element, isSelected, onUpdate, onPickImage, isUploading }) {
  switch (element.type) {
    case "text":
      return <TextElementContent element={element} onChangeHtml={(html) => onUpdate({ html })} />;
    case "image":
      return <ImageElementContent element={element} onPickImage={onPickImage} isUploading={isUploading} />;
    case "shape":
      return <ShapeElementContent element={element} />;
    case "table":
      return <TableElementContent element={element} isSelected={isSelected} onChangeRows={(rows) => onUpdate({ rows })} />;
    case "kpi":
      return <KpiElementContent element={element} />;
    default:
      return null;
  }
}

// Every page is always mounted (not just the "current" one) — same
// architecture as the invoice's Freeform report pages
// (CustomReportPage.js): the whole document scrolls as one column, a page
// becomes "active" by clicking it, and PDF export just walks the real
// rendered <article> nodes already on screen (via registerRef/pageRefsRef)
// through the exact same html2canvas pipeline Invoice/SalarySlip already
// use — no second off-screen render pass needed.
//
// Zoom is applied to a wrapper OUTSIDE the captured <article>, so export
// (which reads the article's own, un-transformed layout box) is unaffected
// by whatever zoom level the user happens to have on screen.
function PageSheet({
  page,
  pageWidthMm,
  pageHeightMm,
  isActivePage,
  selectedElementId,
  onActivatePage,
  onSelectElement,
  onUpdateElement,
  onCommitHistory,
  onRemoveElement,
  onPickImage,
  uploadingElementId,
  zoom,
  registerRef,
}) {
  const articleRef = useRef(null);
  const background = page.background || { type: "color", value: "#FFFFFF" };

  return (
    <div className="mx-auto" style={{ width: `${pageWidthMm * zoom}mm`, height: `${pageHeightMm * zoom}mm` }}>
      <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `${pageWidthMm}mm` }}>
        <article
          ref={(el) => {
            articleRef.current = el;
            registerRef(el);
          }}
          onClick={() => {
            onActivatePage();
            onSelectElement(null);
          }}
          className="sheet relative overflow-hidden bg-white shadow-[0_18px_50px_rgba(26,26,26,.16)]"
          style={{
            width: `${pageWidthMm}mm`,
            height: `${pageHeightMm}mm`,
            backgroundColor: background.type === "color" ? background.value : "#FFFFFF",
            backgroundImage: background.type === "image" && background.value ? `url(${background.value})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {isActivePage && (
            <div
              data-html2canvas-ignore="true"
              className="no-print pointer-events-none absolute inset-0 z-[9999] ring-2 ring-inset ring-[#E8262A]"
            />
          )}
          {page.elements.map((element) => (
            <CanvasElement
              key={element.id}
              element={element}
              pageWidthMm={pageWidthMm}
              pageHeightMm={pageHeightMm}
              pageContentRef={articleRef}
              isSelected={selectedElementId === element.id}
              onSelect={() => {
                onActivatePage();
                onSelectElement(element.id);
              }}
              onUpdate={(patch, opts) => onUpdateElement(page.id, element.id, patch, opts)}
              onCommitHistory={onCommitHistory}
              onRemove={() => onRemoveElement(page.id, element.id)}
            >
              <ElementContent
                element={element}
                isSelected={selectedElementId === element.id}
                onUpdate={(patch) => onUpdateElement(page.id, element.id, patch)}
                onPickImage={(file) => onPickImage(page.id, element.id, file)}
                isUploading={uploadingElementId === element.id}
              />
            </CanvasElement>
          ))}
        </article>
      </div>
    </div>
  );
}

export default function EditorCanvas({
  pages,
  pageSize,
  selectedPageId,
  selectedElementId,
  onSelectPage,
  onSelectElement,
  onUpdateElement,
  onCommitHistory,
  onRemoveElement,
  onPickImage,
  uploadingElementId,
  zoom,
  pageRefsRef,
}) {
  const { width, height } = PAGE_SIZES[pageSize] || PAGE_SIZES["a4-portrait"];

  return (
    <div className="flex flex-col items-center gap-10 py-10">
      {pages.map((page, index) => (
        <PageSheet
          key={page.id}
          page={page}
          pageWidthMm={width}
          pageHeightMm={height}
          isActivePage={page.id === selectedPageId}
          selectedElementId={selectedPageId === page.id ? selectedElementId : null}
          onActivatePage={() => onSelectPage(page.id)}
          onSelectElement={onSelectElement}
          onUpdateElement={onUpdateElement}
          onCommitHistory={onCommitHistory}
          onRemoveElement={onRemoveElement}
          onPickImage={onPickImage}
          uploadingElementId={uploadingElementId}
          zoom={zoom}
          registerRef={(el) => {
            pageRefsRef.current[index] = el;
          }}
        />
      ))}
    </div>
  );
}
