// Client-side page-shape generators for the editor's "+ Add Page" menu —
// these need to run instantly in the browser with no server round trip, so
// they're a small client-side counterpart to server/src/utils/
// reportTemplates.js's page helpers (which build a whole template's initial
// *document*, server-side, at report-creation time). The two can't share a
// module across the client/server boundary in this app, so this is a
// deliberately small, separate copy — just the six page *kinds* listed in
// the spec (Cover/Inner/Divider/Gallery/Summary/Thank You), not the full
// eight-template system.
export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;

let nextId = 1;
const genId = (prefix) => `${prefix}-${Date.now()}-${nextId++}`;

function textEl({ x, y, width, height, html, fontSize = 12, color = "#1A1A1A", align = "left", bold = false }) {
  return {
    id: genId("el"),
    type: "text",
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex: 1,
    html,
    fontSize,
    fontFamily: "Inter",
    color,
    align,
    bold,
    italic: false,
    underline: false,
    lineHeight: 1.4,
    letterSpacing: 0,
  };
}

function shapeEl({ x, y, width, height, shapeType = "rect", fill = "#1A1A1A" }) {
  return { id: genId("el"), type: "shape", x, y, width, height, rotation: 0, zIndex: 0, shapeType, fill, stroke: null, strokeWidth: 0 };
}

function imagePlaceholderEl({ x, y, width, height, caption = "" }) {
  return { id: genId("el"), type: "image", x, y, width, height, rotation: 0, zIndex: 1, assetId: null, src: null, fit: "contain", borderRadius: 2, caption };
}

function kpiEl({ x, y, width, height, label, value }) {
  return { id: genId("el"), type: "kpi", x, y, width, height, rotation: 0, zIndex: 1, label, value, trend: "", accentColor: "#E8262A" };
}

function tableEl({ x, y, width, height, rows }) {
  return { id: genId("el"), type: "table", x, y, width, height, rotation: 0, zIndex: 1, rows, headerRow: true };
}

const W = PAGE_WIDTH_MM;
const H = PAGE_HEIGHT_MM;

export const PAGE_LAYOUTS = {
  cover: {
    label: "Front Cover",
    icon: "auto_awesome",
    build: () => ({
      id: genId("page"),
      name: "Cover",
      kind: "cover",
      background: { type: "color", value: "#FFFFFF" },
      elements: [
        shapeEl({ x: 0, y: 0, width: W, height: 6, fill: "#E8262A" }),
        shapeEl({ x: 0, y: H - 40, width: W, height: 40, fill: "#E8262A" }),
        textEl({ x: 20, y: 100, width: W - 40, height: 30, html: "Report Title", fontSize: 30, bold: true }),
        textEl({ x: 20, y: 132, width: W - 40, height: 14, html: "Subtitle goes here", fontSize: 13, color: "#6E6A65" }),
        textEl({ x: 20, y: H - 28, width: 140, height: 8, html: "Prepared by Your Agency", fontSize: 9, color: "#FFFFFF" }),
      ],
    }),
  },
  inner: {
    label: "Inner Page",
    icon: "article",
    build: () => ({
      id: genId("page"),
      name: "Inner Page",
      kind: "inner",
      background: { type: "color", value: "#FFFFFF" },
      elements: [
        shapeEl({ x: 0, y: 0, width: W, height: 4, fill: "#E8262A" }),
        textEl({ x: 14, y: 14, width: W - 28, height: 12, html: "Page Heading", fontSize: 18, bold: true }),
        textEl({ x: 14, y: 34, width: W - 28, height: 200, html: "Start writing...", fontSize: 11, color: "#1A1A1A" }),
      ],
    }),
  },
  divider: {
    label: "Section Divider",
    icon: "horizontal_rule",
    build: () => ({
      id: genId("page"),
      name: "Section Divider",
      kind: "divider",
      background: { type: "color", value: "#1A1A1A" },
      elements: [textEl({ x: 20, y: H / 2 - 15, width: W - 40, height: 30, html: "Section Title", fontSize: 26, bold: true, color: "#FFFFFF", align: "center" })],
    }),
  },
  gallery: {
    label: "Screenshot Gallery",
    icon: "grid_view",
    build: () => {
      const colWidth = (W - 28 - 8) / 2;
      return {
        id: genId("page"),
        name: "Screenshot Gallery",
        kind: "gallery",
        background: { type: "color", value: "#FFFFFF" },
        elements: [
          shapeEl({ x: 0, y: 0, width: W, height: 4, fill: "#E8262A" }),
          textEl({ x: 14, y: 14, width: W - 28, height: 12, html: "Screenshots", fontSize: 18, bold: true }),
          imagePlaceholderEl({ x: 14, y: 34, width: colWidth, height: 120, caption: "Screenshot 1" }),
          imagePlaceholderEl({ x: 14 + colWidth + 8, y: 34, width: colWidth, height: 120, caption: "Screenshot 2" }),
          imagePlaceholderEl({ x: 14, y: 160, width: colWidth, height: 120, caption: "Screenshot 3" }),
          imagePlaceholderEl({ x: 14 + colWidth + 8, y: 160, width: colWidth, height: 120, caption: "Screenshot 4" }),
        ],
      };
    },
  },
  summary: {
    label: "Data Summary",
    icon: "table_chart",
    build: () => ({
      id: genId("page"),
      name: "Data Summary",
      kind: "summary",
      background: { type: "color", value: "#FFFFFF" },
      elements: [
        shapeEl({ x: 0, y: 0, width: W, height: 4, fill: "#E8262A" }),
        textEl({ x: 14, y: 14, width: W - 28, height: 12, html: "Summary", fontSize: 18, bold: true }),
        kpiEl({ x: 14, y: 34, width: 40, height: 28, label: "Metric 1", value: "—" }),
        kpiEl({ x: 58, y: 34, width: 40, height: 28, label: "Metric 2", value: "—" }),
        kpiEl({ x: 102, y: 34, width: 40, height: 28, label: "Metric 3", value: "—" }),
        kpiEl({ x: 146, y: 34, width: 40, height: 28, label: "Metric 4", value: "—" }),
        tableEl({ x: 14, y: 72, width: W - 28, height: 120, rows: [["Column A", "Column B", "Column C"], ["", "", ""], ["", "", ""], ["", "", ""]] }),
      ],
    }),
  },
  thankyou: {
    label: "Thank You",
    icon: "volunteer_activism",
    build: () => ({
      id: genId("page"),
      name: "Thank You",
      kind: "thankyou",
      background: { type: "color", value: "#1A1A1A" },
      elements: [
        textEl({ x: 20, y: 120, width: W - 40, height: 20, html: "Thank you", fontSize: 28, bold: true, color: "#FFFFFF" }),
        textEl({ x: 20, y: 150, width: W - 40, height: 20, html: "We appreciate the opportunity to work with you.", fontSize: 12, color: "#FFFFFF" }),
      ],
    }),
  },
  blank: {
    label: "Blank Page",
    icon: "note_add",
    build: () => ({ id: genId("page"), name: "Blank Page", kind: "blank", background: { type: "color", value: "#FFFFFF" }, elements: [] }),
  },
};

export function buildPage(kind) {
  const layout = PAGE_LAYOUTS[kind] || PAGE_LAYOUTS.blank;
  return layout.build();
}

// Fresh ids for every element in a page (used by "Duplicate page").
export function clonePageWithNewIds(page) {
  return {
    ...JSON.parse(JSON.stringify(page)),
    id: genId("page"),
    elements: page.elements.map((el) => ({ ...el, id: genId("el") })),
  };
}

export function createEmptyElement(type, { x = 20, y = 20 } = {}) {
  switch (type) {
    case "text":
      return textEl({ x, y, width: 80, height: 14, html: "Text", fontSize: 12 });
    case "shape-rect":
      return shapeEl({ x, y, width: 60, height: 40, shapeType: "rect", fill: "#E8262A" });
    case "shape-circle":
      return shapeEl({ x, y, width: 40, height: 40, shapeType: "circle", fill: "#E8262A" });
    case "shape-line":
      return shapeEl({ x, y, width: 80, height: 1, shapeType: "line", fill: "#1A1A1A" });
    case "image":
      return imagePlaceholderEl({ x, y, width: 80, height: 60, caption: "" });
    case "table":
      return tableEl({ x, y, width: 100, height: 50, rows: [["Header 1", "Header 2"], ["", ""], ["", ""]] });
    case "kpi":
      return kpiEl({ x, y, width: 40, height: 28, label: "Metric", value: "—" });
    default:
      return textEl({ x, y, width: 80, height: 14, html: "Text" });
  }
}
