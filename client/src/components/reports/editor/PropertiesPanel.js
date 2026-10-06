"use client";
import React from "react";

const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="block font-label-sm text-label-sm text-on-surface-variant">{label}</label>
    {children}
  </div>
);

const inputClass =
  "w-full rounded-md border border-outline-variant px-2 py-1.5 text-body-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary";

function NumberField({ label, value, onChange, step = 1, suffix }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-1">
        <input
          type="number"
          step={step}
          value={Math.round(value * 100) / 100}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={inputClass}
        />
        {suffix && <span className="shrink-0 text-label-sm text-on-surface-variant">{suffix}</span>}
      </div>
    </Field>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-8 w-8 shrink-0 cursor-pointer rounded border border-outline-variant" />
        <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      </div>
    </Field>
  );
}

function PositionSizeSection({ element, onUpdate }) {
  return (
    <div className="space-y-3 border-b border-outline-variant pb-4">
      <p className="font-label-md text-label-md text-on-surface">Position &amp; Size</p>
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="X" value={element.x} suffix="mm" onChange={(v) => onUpdate({ x: v })} />
        <NumberField label="Y" value={element.y} suffix="mm" onChange={(v) => onUpdate({ y: v })} />
        <NumberField label="Width" value={element.width} suffix="mm" onChange={(v) => onUpdate({ width: v })} />
        <NumberField label="Height" value={element.height} suffix="mm" onChange={(v) => onUpdate({ height: v })} />
      </div>
      <NumberField label="Rotation" value={element.rotation || 0} suffix="°" onChange={(v) => onUpdate({ rotation: v })} />
    </div>
  );
}

function TextProperties({ element, onUpdate }) {
  return (
    <div className="space-y-3">
      <p className="font-label-md text-label-md text-on-surface">Text</p>
      <div className="flex items-center gap-1">
        {[
          { key: "bold", icon: "format_bold" },
          { key: "italic", icon: "format_italic" },
          { key: "underline", icon: "format_underlined" },
        ].map((btn) => (
          <button
            key={btn.key}
            type="button"
            onClick={() => onUpdate({ [btn.key]: !element[btn.key] })}
            className={`flex h-8 w-8 items-center justify-center rounded border ${
              element[btn.key] ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{btn.icon}</span>
          </button>
        ))}
        {["left", "center", "right"].map((align) => (
          <button
            key={align}
            type="button"
            onClick={() => onUpdate({ align })}
            className={`flex h-8 w-8 items-center justify-center rounded border ${
              element.align === align ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">format_align_{align}</span>
          </button>
        ))}
      </div>
      <NumberField label="Font size" value={element.fontSize || 12} suffix="px" onChange={(v) => onUpdate({ fontSize: v })} />
      <NumberField label="Line height" value={element.lineHeight || 1.4} step={0.1} onChange={(v) => onUpdate({ lineHeight: v })} />
      <NumberField label="Letter spacing" value={element.letterSpacing || 0} step={0.1} suffix="px" onChange={(v) => onUpdate({ letterSpacing: v })} />
      <ColorField label="Color" value={element.color} onChange={(v) => onUpdate({ color: v })} />
    </div>
  );
}

function ImageProperties({ element, onUpdate }) {
  return (
    <div className="space-y-3">
      <p className="font-label-md text-label-md text-on-surface">Image</p>
      <Field label="Fit">
        <select value={element.fit || "contain"} onChange={(e) => onUpdate({ fit: e.target.value })} className={inputClass}>
          <option value="contain">Contain (preserve full image)</option>
          <option value="cover">Cover (fill the box, may crop)</option>
        </select>
      </Field>
      <Field label="Caption">
        <input type="text" value={element.caption || ""} onChange={(e) => onUpdate({ caption: e.target.value })} className={inputClass} placeholder="Optional caption" />
      </Field>
      <NumberField label="Corner radius" value={element.borderRadius || 0} suffix="px" onChange={(v) => onUpdate({ borderRadius: v })} />
      {element.src && (
        <button type="button" onClick={() => onUpdate({ src: null, assetId: null })} className="text-body-sm text-red-600 hover:underline">
          Remove image
        </button>
      )}
    </div>
  );
}

function ShapeProperties({ element, onUpdate }) {
  return (
    <div className="space-y-3">
      <p className="font-label-md text-label-md text-on-surface">Shape</p>
      <Field label="Shape">
        <select value={element.shapeType} onChange={(e) => onUpdate({ shapeType: e.target.value })} className={inputClass}>
          <option value="rect">Rectangle</option>
          <option value="circle">Circle</option>
          <option value="line">Line</option>
        </select>
      </Field>
      <ColorField label="Fill" value={element.fill} onChange={(v) => onUpdate({ fill: v })} />
      {element.shapeType !== "line" && (
        <>
          <ColorField label="Border color" value={element.stroke || "#000000"} onChange={(v) => onUpdate({ stroke: v })} />
          <NumberField label="Border width" value={element.strokeWidth || 0} suffix="px" onChange={(v) => onUpdate({ strokeWidth: v })} />
        </>
      )}
    </div>
  );
}

function TableProperties({ element, onUpdate }) {
  const rows = element.rows || [[]];
  const colCount = rows[0]?.length || 0;

  const addRow = () => onUpdate({ rows: [...rows, Array(colCount).fill("")] });
  const removeRow = () => rows.length > 1 && onUpdate({ rows: rows.slice(0, -1) });
  const addColumn = () => onUpdate({ rows: rows.map((r) => [...r, ""]) });
  const removeColumn = () => colCount > 1 && onUpdate({ rows: rows.map((r) => r.slice(0, -1)) });

  return (
    <div className="space-y-3">
      <p className="font-label-md text-label-md text-on-surface">Table</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={addRow} className="rounded border border-outline-variant py-1.5 text-body-sm hover:border-primary hover:text-primary">
          + Row
        </button>
        <button type="button" onClick={removeRow} className="rounded border border-outline-variant py-1.5 text-body-sm hover:border-red-400 hover:text-red-600">
          − Row
        </button>
        <button type="button" onClick={addColumn} className="rounded border border-outline-variant py-1.5 text-body-sm hover:border-primary hover:text-primary">
          + Column
        </button>
        <button type="button" onClick={removeColumn} className="rounded border border-outline-variant py-1.5 text-body-sm hover:border-red-400 hover:text-red-600">
          − Column
        </button>
      </div>
      <label className="flex items-center gap-2 text-body-sm text-on-surface">
        <input type="checkbox" checked={Boolean(element.headerRow)} onChange={(e) => onUpdate({ headerRow: e.target.checked })} />
        First row is a header
      </label>
    </div>
  );
}

function KpiProperties({ element, onUpdate }) {
  return (
    <div className="space-y-3">
      <p className="font-label-md text-label-md text-on-surface">KPI Card</p>
      <Field label="Label">
        <input type="text" value={element.label || ""} onChange={(e) => onUpdate({ label: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Value">
        <input type="text" value={element.value || ""} onChange={(e) => onUpdate({ value: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Trend (optional)">
        <input type="text" value={element.trend || ""} onChange={(e) => onUpdate({ trend: e.target.value })} className={inputClass} placeholder="e.g. +12% vs last month" />
      </Field>
      <ColorField label="Accent color" value={element.accentColor} onChange={(v) => onUpdate({ accentColor: v })} />
    </div>
  );
}

function PageProperties({ page, onUpdatePage }) {
  const background = page.background || { type: "color", value: "#FFFFFF" };
  return (
    <div className="space-y-3">
      <p className="font-label-md text-label-md text-on-surface">Page: {page.name}</p>
      <Field label="Background">
        <select
          value={background.type}
          onChange={(e) => onUpdatePage({ background: { type: e.target.value, value: e.target.value === "color" ? "#FFFFFF" : background.value } })}
          className={inputClass}
        >
          <option value="color">Solid color</option>
          <option value="image">Image</option>
        </select>
      </Field>
      {background.type === "color" ? (
        <ColorField label="Color" value={background.value} onChange={(v) => onUpdatePage({ background: { type: "color", value: v } })} />
      ) : (
        <p className="text-body-sm text-on-surface-variant">Upload a background image from the Assets panel, then paste its link here once uploaded.</p>
      )}
    </div>
  );
}

export default function PropertiesPanel({ selectedPage, selectedElement, onUpdateElement, onUpdatePage, onCommitHistory, onDuplicateElement, onRemoveElement }) {
  if (!selectedPage) {
    return <aside className="w-[260px] shrink-0 border-l border-outline-variant bg-surface p-4" />;
  }

  if (!selectedElement) {
    return (
      <aside className="w-[260px] shrink-0 overflow-y-auto border-l border-outline-variant bg-surface p-4">
        <PageProperties page={selectedPage} onUpdatePage={onUpdatePage} />
      </aside>
    );
  }

  const handleUpdate = (patch) => {
    onUpdateElement(patch);
    onCommitHistory();
  };

  return (
    <aside className="flex w-[260px] shrink-0 flex-col overflow-y-auto border-l border-outline-variant bg-surface">
      <div className="flex-1 space-y-4 p-4">
        <PositionSizeSection element={selectedElement} onUpdate={handleUpdate} />
        {selectedElement.type === "text" && <TextProperties element={selectedElement} onUpdate={handleUpdate} />}
        {selectedElement.type === "image" && <ImageProperties element={selectedElement} onUpdate={handleUpdate} />}
        {selectedElement.type === "shape" && <ShapeProperties element={selectedElement} onUpdate={handleUpdate} />}
        {selectedElement.type === "table" && <TableProperties element={selectedElement} onUpdate={handleUpdate} />}
        {selectedElement.type === "kpi" && <KpiProperties element={selectedElement} onUpdate={handleUpdate} />}
      </div>
      <div className="flex gap-2 border-t border-outline-variant p-4">
        <button type="button" onClick={onDuplicateElement} className="flex-1 rounded-md border border-outline-variant py-2 text-body-sm hover:border-primary hover:text-primary">
          Duplicate
        </button>
        <button type="button" onClick={onRemoveElement} className="flex-1 rounded-md border border-outline-variant py-2 text-body-sm text-red-600 hover:border-red-400">
          Delete
        </button>
      </div>
    </aside>
  );
}
