"use client";
import React, { useRef, useState } from "react";
import { getAssetUrl } from "@/services/apiClient";

// Matches the `scale: 3` passed to html2canvas in Pdfexport.js — the real
// pixel density the exported PDF asks of this image. Below this, the source
// screenshot genuinely doesn't have enough pixels for a crisp print, so this
// is a direct, grounded threshold rather than an arbitrary guess.
const EXPORT_SCALE = 3;

// Presets apply plain CSS to the already-uploaded image — never touching the
// stored file — so the original stays untouched regardless of which style is
// picked or how many times it's changed.
function frameStyleProps(frameStyle, borderRadius) {
  switch (frameStyle) {
    case "shadow":
      return { boxShadow: "0 10px 28px rgba(26,26,26,.22)", borderRadius: `${borderRadius || 0}px` };
    case "thinBorder":
      return { border: "1px solid #C9C5BF", borderRadius: `${borderRadius || 0}px` };
    case "softRounded":
      return { borderRadius: `${Math.max(borderRadius || 0, 12)}px`, overflow: "hidden" };
    case "padded":
      return { border: "1px solid #E7E4DE", borderRadius: `${borderRadius || 0}px`, padding: "6px", backgroundColor: "#FFFFFF", boxSizing: "border-box" };
    default:
      return { borderRadius: `${borderRadius || 0}px` };
  }
}

// Empty state is an upload dropzone (click to pick a file); once an image
// is attached (src set after the parent uploads it to Drive — see
// EditorCanvas's handleImagePick) it renders at the element's fit mode.
// Aspect ratio is preserved by CanvasElement's resize handle (locked for
// type "image"), never by cropping/stretching here.
export default function ImageElementContent({ element, onPickImage, isUploading }) {
  const fileInputRef = useRef(null);
  const [localError, setLocalError] = useState("");
  const [isLowRes, setIsLowRes] = useState(false);
  const src = element.src ? getAssetUrl(element.src) : null;

  const handleFile = (file) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      setLocalError("PNG, JPG, or WebP only");
      return;
    }
    setLocalError("");
    onPickImage(file);
  };

  if (!src) {
    return (
      <div
        data-no-drag="true"
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onDragOver={(e) => e.preventDefault()}
        className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-[#C9C5BF] bg-[#FAFAF8] px-2 text-center text-[10px] text-[#6E6A65] hover:border-[#E8262A] hover:text-[#E8262A]"
      >
        {isUploading ? (
          <span className="material-symbols-outlined animate-spin text-[22px]">progress_activity</span>
        ) : (
          <>
            <span className="material-symbols-outlined text-[22px]">add_photo_alternate</span>
            <span>{element.caption || "Click or drop an image"}</span>
          </>
        )}
        {localError && <span className="text-red-600">{localError}</span>}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full" style={{ overflow: "hidden", ...frameStyleProps(element.frameStyle, element.borderRadius) }}>
      <img
        src={src}
        alt={element.caption || ""}
        className="h-full w-full"
        style={{ objectFit: element.fit === "cover" ? "cover" : "contain" }}
        draggable={false}
        onLoad={(e) => {
          const img = e.currentTarget;
          const renderedWidth = img.getBoundingClientRect().width;
          setIsLowRes(renderedWidth > 0 && img.naturalWidth > 0 && img.naturalWidth < renderedWidth * EXPORT_SCALE);
        }}
      />
      {isLowRes && (
        <span
          data-html2canvas-ignore="true"
          title="This image's resolution is lower than ideal for print — it may look soft in the exported PDF."
          className="no-print absolute left-1 top-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-[8px] font-medium text-white"
        >
          Low resolution
        </span>
      )}
      {element.caption && (
        <p className="absolute bottom-0 left-0 right-0 bg-black/55 px-1 py-0.5 text-center text-[8px] text-white">{element.caption}</p>
      )}
    </div>
  );
}
