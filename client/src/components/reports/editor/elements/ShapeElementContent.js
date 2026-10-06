"use client";
import React from "react";

export default function ShapeElementContent({ element }) {
  const { shapeType, fill, stroke, strokeWidth } = element;

  if (shapeType === "line") {
    return <div className="mt-[calc(50%-1px)] h-[2px] w-full" style={{ backgroundColor: fill }} />;
  }

  return (
    <div
      className="h-full w-full"
      style={{
        backgroundColor: fill,
        border: stroke ? `${strokeWidth || 1}px solid ${stroke}` : "none",
        borderRadius: shapeType === "circle" ? "50%" : 2,
      }}
    />
  );
}
