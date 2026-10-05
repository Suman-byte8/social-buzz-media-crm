// Pure geometry for the invoice's Freeform report pages — kept separate
// from useCustomReportPages.js's state management so the placement math can
// be reasoned about (and unit-tested) independently, same split as
// imageGridLayout.js vs useReportImages.js for the Auto mode.
//
// All measurements are in mm and mirror CustomReportPage.js's actual layout
// (a 210x297mm sheet, same chrome as ReportImagePage.js) — keep the two in
// sync if that page's header/footer chrome changes size.
export const PAGE_CONTENT_WIDTH_MM = 182; // 210 - 14mm padding * 2
export const PAGE_CONTENT_HEIGHT_MM = 245; // 297 - 14mm padding*2 - header - footer

export const DEFAULT_TILE_WIDTH_MM = 70;
export const MIN_TILE_WIDTH_MM = 20;
const CASCADE_STEP_MM = 10;
const MAX_ROTATION_DEG = 6;

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const randomBetween = (min, max) => min + Math.random() * (max - min);

// Where a newly pasted/uploaded image lands: a gentle diagonal cascade from
// the top-left (so a batch of new screenshots fans out like a dropped stack
// of photos rather than stacking in one exact spot), with a small random
// tilt for a scrapbook feel. Wraps back toward the top-left once the
// cascade would run off the page.
export function placeNewTile(existingTileCount, aspectRatio) {
  const width = DEFAULT_TILE_WIDTH_MM;
  const height = width / aspectRatio;

  const step = existingTileCount % 6; // wrap the cascade every 6 images
  const x = clamp(10 + step * CASCADE_STEP_MM, 0, Math.max(0, PAGE_CONTENT_WIDTH_MM - width));
  const y = clamp(10 + step * CASCADE_STEP_MM, 0, Math.max(0, PAGE_CONTENT_HEIGHT_MM - height));

  return {
    x,
    y,
    width,
    height,
    rotation: randomBetween(-MAX_ROTATION_DEG, MAX_ROTATION_DEG),
  };
}

// "Shuffle" — scatters every tile on the page to a random position (size
// unchanged) with a fresh random tilt. Purely a creative starting point the
// user can then fine-tune by dragging; overlap is allowed on purpose (a
// loose scattered pile reads as intentional, a rigid non-overlapping
// packing algorithm would fight the "freeform" point of this mode).
export function shuffleTiles(tiles) {
  return tiles.map((tile) => ({
    ...tile,
    x: randomBetween(0, Math.max(0, PAGE_CONTENT_WIDTH_MM - tile.width)),
    y: randomBetween(0, Math.max(0, PAGE_CONTENT_HEIGHT_MM - tile.height)),
    rotation: randomBetween(-MAX_ROTATION_DEG * 2, MAX_ROTATION_DEG * 2),
  }));
}

// "Tidy" — the escape hatch back to order: an even grid, uniform tilt
// removed, sized to fit whatever count of tiles currently exists. Doesn't
// touch each tile's aspect ratio (only width/height uniformly), same
// "scaled, never stretched" rule the Auto grid follows.
export function tidyTiles(tiles) {
  if (tiles.length === 0) return tiles;

  const columns = Math.min(tiles.length, Math.ceil(Math.sqrt(tiles.length * (PAGE_CONTENT_WIDTH_MM / PAGE_CONTENT_HEIGHT_MM))));
  const rows = Math.ceil(tiles.length / columns);
  const gap = 6;
  const cellWidth = (PAGE_CONTENT_WIDTH_MM - gap * (columns - 1)) / columns;
  const cellHeight = (PAGE_CONTENT_HEIGHT_MM - gap * (rows - 1)) / rows;

  return tiles.map((tile, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const aspect = tile.naturalWidth / tile.naturalHeight;

    // Fit the tile inside its cell without stretching it off-aspect.
    let width = cellWidth;
    let height = width / aspect;
    if (height > cellHeight) {
      height = cellHeight;
      width = height * aspect;
    }

    return {
      ...tile,
      width,
      height,
      rotation: 0,
      x: col * (cellWidth + gap) + (cellWidth - width) / 2,
      y: row * (cellHeight + gap) + (cellHeight - height) / 2,
    };
  });
}
