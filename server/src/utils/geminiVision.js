// Calls Google's Gemini API (free tier — https://aistudio.google.com/apikey)
// to look at a batch of pasted/uploaded screenshots and propose a report
// structure: a title/subtitle for the whole report, and a grouping of the
// images into pages with an AI-written heading, short analysis, and any
// legible KPI numbers per page. This is a *draft* a human is expected to
// review/edit in the normal editor afterward, not authoritative analysis —
// Gemini can misread a chart or guess wrong about which tool a screenshot
// is from.
//
// Plain REST calls via fetch rather than the @google/generative-ai SDK —
// one dependency fewer for a single endpoint, consistent with this app's
// "don't add a library for what fetch already does" pattern elsewhere
// (fetchRemoteImage.js).
const DEFAULT_MODEL = "gemini-2.0-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// A single request inlining too many base64 images risks the API's request-
// size limit, and asking the model to correctly group/caption everything in
// one shot measurably degrades with more images to juggle. Larger uploads
// are split into batches analyzed independently (see analyzeScreenshotsForReport)
// instead of raising this per-call size — ~10 images per call stays well
// within both the size and quality sweet spot observed in practice.
const BATCH_SIZE = 10;
// A hard ceiling on top of the batching, so a request can't balloon into
// dozens of sequential Gemini calls (and dozens of Drive uploads) from one
// click — comfortably covers a real report while keeping total generation
// time bounded. Raise if a genuine need for more shows up.
export const MAX_IMAGES_TOTAL = 60;

const PAGE_PLAN_SCHEMA = {
  type: "object",
  properties: {
    reportTitle: { type: "string" },
    reportSubtitle: { type: "string" },
    pages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pageTitle: { type: "string" },
          summary: { type: "string" },
          imageIndexes: { type: "array", items: { type: "integer" } },
          kpis: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                value: { type: "string" },
              },
              required: ["label", "value"],
            },
          },
        },
        required: ["pageTitle", "summary", "imageIndexes"],
      },
    },
  },
  required: ["reportTitle", "pages"],
};

const TITLE_SCHEMA = {
  type: "object",
  properties: {
    reportTitle: { type: "string" },
    reportSubtitle: { type: "string" },
  },
  required: ["reportTitle"],
};

const BATCH_PROMPT = `You are helping a digital marketing agency turn a batch of screenshots (Google Analytics, Search Console, PageSpeed Insights, social media dashboards, ad platforms, etc.) into a client-facing report outline.

You will be given one or more images, each labeled with its index (0, 1, 2, ...), all from the same overall report (this may be only part of a larger batch, analyzed separately). For these images:
1. Suggest a short, professional report title and one-line subtitle appropriate for what these screenshots show.
2. Group the images into pages — put visually/topically related screenshots together (e.g. two screenshots from the same tool), 1 to 4 images per page. Every image index must appear in exactly one page.
3. For each page, write a short professional heading (pageTitle) and a 1-2 sentence plain-English summary (summary) of what that page's screenshot(s) show and any notable takeaway.
4. If any screenshot has clearly legible numeric metrics (e.g. "Sessions: 12,400", "Engagement rate: 4.2%"), extract up to 4 of them per page as kpis (label + value, as plain strings exactly as shown). If nothing is clearly legible, return an empty kpis array — never invent numbers.

Respond with JSON matching the given schema only.`;

const buildImagePart = (image) => ({
  inlineData: { mimeType: image.mimeType, data: image.buffer.toString("base64") },
});

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Get a free key at https://aistudio.google.com/apikey and add it to the server's .env file."
    );
  }
  return apiKey;
}

// Low-level call shared by the per-batch grouping call and the lightweight
// title-synthesis call below — request construction, timeout, and response/
// JSON-parsing error handling in one place.
async function callGemini(parts, schema) {
  const apiKey = getApiKey();
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.4 },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  let response;
  try {
    response = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    throw new Error(`Could not reach Gemini: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Gemini API error (${response.status}): ${errText.slice(0, 300) || response.statusText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no usable content (the request may have been blocked by safety filters).");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Gemini's response wasn't valid JSON.");
  }
}

// Analyzes one batch (≤ BATCH_SIZE images) and returns a sanitized plan
// whose imageIndexes are local to *this batch* (0-based within it) — the
// caller is responsible for offsetting them back into the full image list.
async function analyzeBatch(images) {
  const prompt = `${BATCH_PROMPT}\n\nThere are ${images.length} images in this batch, indexed 0 to ${images.length - 1}.`;
  const plan = await callGemini([{ text: prompt }, ...images.map(buildImagePart)], PAGE_PLAN_SCHEMA);
  return sanitizePlan(plan, images.length);
}

// Best-effort only: ties together the per-batch titles into one overall
// title/subtitle once there's more than one batch, since "whatever the
// first batch happened to suggest" reads oddly once there are several
// unrelated-looking page headings from later batches too. A text-only
// call (no images), so it's fast and doesn't re-spend image-analysis
// quota. Falling back to the first batch's title is a perfectly fine
// result, so any failure here is swallowed rather than failing the whole
// generation over a title.
async function synthesizeOverallTitle(pageTitles, fallback) {
  try {
    const prompt = `A client performance report has the following page headings, in order:\n${pageTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nSuggest one short, professional overall report title and a one-line subtitle that ties all of these together. Respond with JSON matching the given schema only.`;
    const result = await callGemini([{ text: prompt }], TITLE_SCHEMA);
    return {
      reportTitle: typeof result.reportTitle === "string" && result.reportTitle.trim() ? result.reportTitle.trim() : fallback.reportTitle,
      reportSubtitle: typeof result.reportSubtitle === "string" ? result.reportSubtitle.trim() : fallback.reportSubtitle,
    };
  } catch (err) {
    console.warn("Could not synthesize an overall report title, using the first batch's suggestion instead:", err.message);
    return fallback;
  }
}

// Splits `images` into BATCH_SIZE-sized chunks, analyzes each independently
// (sequentially — not in parallel, to stay comfortably under the free
// tier's requests-per-minute limit rather than bursting several calls at
// once), and merges the results into one plan with globally-correct image
// indexes. A single-batch upload (the common case) skips the extra title-
// synthesis call entirely and behaves exactly as before.
export async function analyzeScreenshotsForReport(images) {
  if (!images || images.length === 0) {
    throw new Error("No images provided to analyze.");
  }
  if (images.length > MAX_IMAGES_TOTAL) {
    throw new Error(`Too many screenshots — up to ${MAX_IMAGES_TOTAL} are supported per report.`);
  }
  getApiKey(); // fail fast with the actionable message before doing any batching work

  const batches = [];
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    batches.push(images.slice(i, i + BATCH_SIZE));
  }

  const mergedPages = [];
  const batchTitles = [];
  let globalOffset = 0;

  for (const batch of batches) {
    const result = await analyzeBatch(batch);
    batchTitles.push({ reportTitle: result.reportTitle, reportSubtitle: result.reportSubtitle });
    result.pages.forEach((page) => {
      mergedPages.push({ ...page, imageIndexes: page.imageIndexes.map((i) => i + globalOffset) });
    });
    globalOffset += batch.length;
  }

  const { reportTitle, reportSubtitle } =
    batches.length > 1
      ? await synthesizeOverallTitle(mergedPages.map((p) => p.pageTitle), batchTitles[0])
      : batchTitles[0];

  return { reportTitle, reportSubtitle, pages: mergedPages };
}

// Defends against a plan that's well-formed JSON but logically incomplete
// (e.g. an image index never assigned to a page, or out of range) — every
// image must end up somewhere so the user never silently loses an upload.
const MAX_IMAGES_PER_PAGE = 4;

function sanitizePlan(plan, imageCount) {
  const pages = Array.isArray(plan.pages) ? plan.pages : [];
  const seen = new Set();

  const cleanedPages = pages
    .map((page) => {
      const imageIndexes = (Array.isArray(page.imageIndexes) ? page.imageIndexes : [])
        .filter((i) => Number.isInteger(i) && i >= 0 && i < imageCount && !seen.has(i));
      imageIndexes.forEach((i) => seen.add(i));
      return {
        pageTitle: typeof page.pageTitle === "string" && page.pageTitle.trim() ? page.pageTitle.trim() : "Screenshots",
        summary: typeof page.summary === "string" ? page.summary.trim() : "",
        imageIndexes,
        kpis: Array.isArray(page.kpis)
          ? page.kpis
              .filter((k) => k && typeof k.label === "string" && typeof k.value === "string")
              .slice(0, 4)
          : [],
      };
    })
    .filter((page) => page.imageIndexes.length > 0)
    // The layout function only knows how to arrange up to 4 images per page
    // — split anything larger into multiple same-titled pages rather than
    // trusting the model to respect that limit on its own.
    .flatMap((page) => {
      if (page.imageIndexes.length <= MAX_IMAGES_PER_PAGE) return [page];
      const chunks = [];
      for (let i = 0; i < page.imageIndexes.length; i += MAX_IMAGES_PER_PAGE) {
        chunks.push({ ...page, imageIndexes: page.imageIndexes.slice(i, i + MAX_IMAGES_PER_PAGE), kpis: i === 0 ? page.kpis : [] });
      }
      return chunks;
    });

  // Any image Gemini didn't place anywhere lands on its own catch-all page
  // rather than being dropped.
  const unplaced = Array.from({ length: imageCount }, (_, i) => i).filter((i) => !seen.has(i));
  if (unplaced.length > 0) {
    cleanedPages.push({ pageTitle: "Additional Screenshots", summary: "", imageIndexes: unplaced, kpis: [] });
  }

  return {
    reportTitle: typeof plan.reportTitle === "string" && plan.reportTitle.trim() ? plan.reportTitle.trim() : "Performance Report",
    reportSubtitle: typeof plan.reportSubtitle === "string" ? plan.reportSubtitle.trim() : "",
    pages: cleanedPages.length > 0 ? cleanedPages : [{ pageTitle: "Screenshots", summary: "", imageIndexes: Array.from({ length: imageCount }, (_, i) => i), kpis: [] }],
  };
}
