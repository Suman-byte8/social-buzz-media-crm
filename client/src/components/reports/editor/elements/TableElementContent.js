"use client";
import React from "react";

// Cells are only contentEditable while the table itself is selected — a
// single click to select shouldn't also start editing an unselected table's
// cell text, so edit access is gated on selection (consistent with how
// TextElementContent requires a double-click first).
export default function TableElementContent({ element, isSelected, onChangeRows }) {
  const rows = element.rows || [[]];

  const updateCell = (rowIndex, colIndex, value) => {
    const newRows = rows.map((row, r) => (r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row));
    onChangeRows(newRows);
  };

  return (
    <table className="h-full w-full border-collapse text-[9px]" style={{ tableLayout: "fixed" }}>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r} className={r === 0 && element.headerRow ? "bg-[#1A1A1A] text-white" : "border-b border-[#DEDBD6]"}>
            {row.map((cell, c) => (
              <td
                key={c}
                data-no-drag={isSelected ? "true" : undefined}
                contentEditable={isSelected}
                suppressContentEditableWarning
                className="overflow-hidden px-1.5 py-1 align-top outline-none"
                onBlur={(e) => updateCell(r, c, e.currentTarget.textContent)}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
