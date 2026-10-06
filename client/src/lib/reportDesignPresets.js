// Shared preset data for the Report Builder's design controls (PropertiesPanel.js,
// EditorTopToolbar.js). Plain data, not components, so both the editor UI and
// any future "apply to all pages" helper can import the same source of truth
// instead of duplicating preset values inline.

// Matches the <link> tags added in layout.js — picking a font here only works
// because it's already loaded globally, same as Inter.
export const FONT_FAMILY_OPTIONS = [
  { label: "Inter (default)", value: "Inter, sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Lora", value: "Lora, serif" },
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "DM Serif Display", value: "'DM Serif Display', serif" },
];

// A pairing preset only touches heading-sized text (fontSize >= HEADING_MIN_SIZE)
// vs. everything else, rather than requiring elements to be tagged by role —
// the existing document schema has no "role" field, and font size is already
// a reliable enough signal for which text is a heading in these templates.
export const HEADING_MIN_SIZE = 18;

export const FONT_PAIRING_PRESETS = [
  { key: "minimalist", name: "Minimalist", heading: "Inter, sans-serif", body: "Inter, sans-serif" },
  { key: "elegant-editorial", name: "Elegant Editorial", heading: "'Playfair Display', serif", body: "Inter, sans-serif" },
  { key: "modern-corporate", name: "Modern Corporate", heading: "Montserrat, sans-serif", body: "Inter, sans-serif" },
];

// Rendered as real CSS border/outline on the page sheet (EditorCanvas.js) —
// deliberately not a shadow, since shadows drawn outside an element's own box
// get clipped at the page edge during PDF export (see Pdfexport.js).
export const PAGE_BORDER_PRESETS = [
  { key: "none", name: "None", style: null },
  { key: "thin", name: "Thin", style: { kind: "thin", color: "#1A1A1A", width: 1, inset: 0, cornerRadius: 0, cornerAccents: false } },
  { key: "double", name: "Double line", style: { kind: "double", color: "#1A1A1A", width: 4, inset: 0, cornerRadius: 0, cornerAccents: false } },
  { key: "inset", name: "Inset", style: { kind: "inset", color: "#1A1A1A", width: 1, inset: 6, cornerRadius: 0, cornerAccents: false } },
  { key: "corner-accents", name: "Corner accents", style: { kind: "inset", color: "#1A1A1A", width: 1, inset: 6, cornerRadius: 0, cornerAccents: true } },
];

// Applied to an image element (ImageElementContent.js) — kept to the range an
// analytics screenshot can carry without hurting readability, per the brief's
// own "avoid excessive shadows/thick frames" instruction.
export const FRAME_STYLE_PRESETS = [
  { key: "none", name: "Clean Minimal" },
  { key: "shadow", name: "Elegant Shadow" },
  { key: "thinBorder", name: "Thin Premium Frame" },
  { key: "softRounded", name: "Soft Rounded Frame" },
  { key: "padded", name: "Dashboard Showcase" },
];

// Rule-based headline treatments (PropertiesPanel.js) — opt-in style chips
// for a large title-sized text element, not an auto-applied/AI suggestion.
// fontSize here is a cap, not a fixed value: PropertiesPanel scales it down
// if the element's own box is too small to fit it without overflowing.
export const HEADLINE_SUGGESTIONS = [
  { key: "large-editorial", name: "Large Editorial", fontFamily: "'Playfair Display', serif", fontSize: 36, bold: true, letterSpacing: 0, align: "left" },
  { key: "bold-minimalist", name: "Bold Minimalist", fontFamily: "Montserrat, sans-serif", fontSize: 32, bold: true, letterSpacing: 0.5, align: "left" },
  { key: "elegant-serif", name: "Elegant Serif", fontFamily: "'DM Serif Display', serif", fontSize: 34, bold: false, letterSpacing: 0, align: "left" },
  { key: "split-line", name: "Split-line Statement", fontFamily: "Poppins, sans-serif", fontSize: 30, bold: true, letterSpacing: 1, align: "center" },
];
