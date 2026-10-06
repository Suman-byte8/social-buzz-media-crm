"use client";
import React, { useRef, useState } from "react";
import { getAssetUrl } from "@/services/apiClient";

// Empty state is an upload dropzone (click to pick a file); once an image
// is attached (src set after the parent uploads it to Drive — see
// EditorCanvas's handleImagePick) it renders at the element's fit mode.
// Aspect ratio is preserved by CanvasElement's resize handle (locked for
// type "image"), never by cropping/stretching here.
export default function ImageElementContent({ element, onPickImage, isUploading }) {
  const fileInputRef = useRef(null);
  const [localError, setLocalError] = useState("");
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
    <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: `${element.borderRadius || 0}px` }}>
      <img
        src={src}
        alt={element.caption || ""}
        className="h-full w-full"
        style={{ objectFit: element.fit === "cover" ? "cover" : "contain" }}
        draggable={false}
      />
      {element.caption && (
        <p className="absolute bottom-0 left-0 right-0 bg-black/55 px-1 py-0.5 text-center text-[8px] text-white">{element.caption}</p>
      )}
    </div>
  );
}
