"use client";
import React from "react";

// clipPoints is an array of [xPercent, yPercent] pairs (0-100) describing a
// polygon over the element's own box — kept as plain data on the element
// (rather than a fixed shape) so a diagonal accent block can be reshaped by
// dragging its corner points, same spirit as resizing any other element.
// Defaults to a gentle top-left-to-bottom-right diagonal cut if unset.
const DEFAULT_DIAGONAL_POINTS = [
  [18, 0],
  [100, 0],
  [100, 100],
  [0, 100],
];

export default function ShapeElementContent({ element }) {
  const { shapeType, fill, stroke, strokeWidth } = element;

  if (shapeType === "line") {
    return <div className="mt-[calc(50%-1px)] h-[2px] w-full" style={{ backgroundColor: fill }} />;
  }

  if (shapeType === "diagonal") {
    const points = Array.isArray(element.clipPoints) && element.clipPoints.length >= 3 ? element.clipPoints : DEFAULT_DIAGONAL_POINTS;
    const clipPath = `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;
    return (
      <div
        className="h-full w-full"
        style={{
          backgroundColor: fill,
          border: stroke ? `${strokeWidth || 1}px solid ${stroke}` : "none",
          clipPath,
          WebkitClipPath: clipPath,
        }}
      />
    );
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
