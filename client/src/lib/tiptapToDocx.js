// Walks a Tiptap (ProseMirror) JSON document and maps its small, well-known
// node set — the only node types the master template and the editor's
// toolbar actually produce (see agreementTemplates.js / EditorToolbar.js) —
// to the `docx` package's own document model, producing a genuinely
// editable .docx client-side. No server dependency: `docx` is pure JS.
import { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, Packer, WidthType, BorderStyle, AlignmentType, PageBreak } from "docx";

const HEADING_LEVELS = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3 };

const CELL_BORDER = { style: BorderStyle.SINGLE, size: 2, color: "D8D4CC" };
const TABLE_BORDERS = { top: CELL_BORDER, bottom: CELL_BORDER, left: CELL_BORDER, right: CELL_BORDER, insideHorizontal: CELL_BORDER, insideVertical: CELL_BORDER };

function textRunsFromInline(content) {
  return (content || [])
    .filter((node) => node.type === "text")
    .map((node) => {
      const marks = (node.marks || []).map((m) => m.type);
      return new TextRun({
        text: node.text || "",
        bold: marks.includes("bold"),
        italics: marks.includes("italic"),
        underline: marks.includes("underline") ? {} : undefined,
        strike: marks.includes("strike"),
      });
    });
}

function paragraphFromNode(node) {
  if (node.type === "heading") {
    const level = HEADING_LEVELS[node.attrs?.level] || HeadingLevel.HEADING_2;
    return new Paragraph({ heading: level, spacing: { before: 200, after: 120 }, children: textRunsFromInline(node.content) });
  }
  // paragraph (and anything else text-bearing) — plain body text.
  const align = node.attrs?.textAlign;
  return new Paragraph({
    spacing: { after: 120 },
    alignment: align === "center" ? AlignmentType.CENTER : align === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT,
    children: textRunsFromInline(node.content),
  });
}

function cellFromNode(node) {
  const isHeader = node.type === "tableHeader";
  const paragraphs = (node.content || []).map((child) => {
    const p = paragraphFromNode(child.type === "paragraph" || child.type === "heading" ? child : { type: "paragraph", content: child.content });
    return p;
  });
  return new TableCell({
    children: paragraphs.length ? paragraphs : [new Paragraph({ children: [] })],
    shading: isHeader ? { fill: "F5F3EF" } : undefined,
  });
}

function tableFromNode(node) {
  const rows = (node.content || []).map(
    (rowNode) =>
      new TableRow({
        children: (rowNode.content || []).map(cellFromNode),
      })
  );
  return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, borders: TABLE_BORDERS });
}

function blockFromNode(node) {
  if (node.type === "heading") return paragraphFromNode(node);
  if (node.type === "paragraph") return paragraphFromNode(node);
  if (node.type === "table") return tableFromNode(node);
  if (node.type === "bulletList" || node.type === "orderedList") {
    // Tiptap's list nodes are listItem > paragraph; flattened to plain
    // paragraphs with a leading bullet/number glyph — `docx`'s native
    // numbering API needs a document-level config this converter doesn't
    // set up, and a flattened list is still fully readable/editable.
    return (node.content || []).flatMap((item, i) => {
      const prefix = node.type === "bulletList" ? "• " : `${i + 1}. `;
      return (item.content || []).map((p) => {
        // Prepend the prefix to the raw first text node (before building
        // TextRun objects, which don't expose their text back out once
        // constructed) so it carries the same bold/italic marks as the
        // rest of that run rather than being its own unstyled prefix.
        const inline = (p.content || []).map((n, idx) => (idx === 0 && n.type === "text" ? { ...n, text: prefix + (n.text || "") } : n));
        return new Paragraph({ spacing: { after: 80 }, children: textRunsFromInline(inline.length ? inline : [{ type: "text", text: prefix }]) });
      });
    });
  }
  return null;
}

function blocksFromDoc(doc) {
  return (doc?.content || []).flatMap((node) => {
    const result = blockFromNode(node);
    if (!result) return [];
    return Array.isArray(result) ? result : [result];
  });
}

export async function tiptapJsonToDocxBlob(doc, { title } = {}) {
  const document = new Document({
    title: title || "Agreement",
    sections: [{ properties: {}, children: blocksFromDoc(doc) }],
  });
  return Packer.toBlob(document);
}

// Same conversion, but for the editor's real page array (see
// AgreementPage.js) — each page's content becomes its own run of blocks,
// separated by a real Word page break so the exported .docx keeps the same
// page boundaries the user actually set up in the editor, not Word's own
// automatic reflow.
export async function tiptapPagesToDocxBlob(pages, { title } = {}) {
  const children = (pages || []).flatMap((page, index) => {
    const blocks = blocksFromDoc(page.content);
    if (index === 0) return blocks;
    return [new Paragraph({ children: [new PageBreak()] }), ...blocks];
  });

  const document = new Document({
    title: title || "Agreement",
    sections: [{ properties: {}, children }],
  });
  return Packer.toBlob(document);
}
