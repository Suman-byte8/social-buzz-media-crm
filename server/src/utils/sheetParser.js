import * as XLSX from "xlsx";
import { google } from "googleapis";

// Google Sheets API client
let sheetsClient = null;

const getSheetsClient = () => {
  if (sheetsClient) return sheetsClient;

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    sheetsClient = google.sheets({ version: "v4", auth: oauth2Client });
    return sheetsClient;
  } catch (err) {
    console.error("Failed to initialize Google Sheets client:", err);
    return null;
  }
};

/**
 * Extract spreadsheet ID from various Google Sheet URL formats.
 */
export const extractSpreadsheetId = (urlOrId) => {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return trimmed;
  return null;
};

const MONTH_MAP = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/**
 * Parse date string or number in any format into YYYY-MM-DD.
 */
export const normalizeDate = (rawDate, fallbackYear = null, fallbackMonth = null) => {
  if (!rawDate && rawDate !== 0) return null;

  const currentYear = fallbackYear || new Date().getFullYear();

  // 1. Handle Excel serial number
  if (typeof rawDate === "number" || (!isNaN(rawDate) && !String(rawDate).includes("-") && !String(rawDate).includes("/") && !String(rawDate).includes(".") && !String(rawDate).includes(" "))) {
    const num = Number(rawDate);
    if (num > 30000 && num < 70000) {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    }
    // If it's a day number (e.g. 1 to 31)
    if (num >= 1 && num <= 31) {
      const m = String(fallbackMonth || new Date().getMonth() + 1).padStart(2, "0");
      const d = String(num).padStart(2, "0");
      return `${currentYear}-${m}-${d}`;
    }
  }

  const str = String(rawDate).trim();
  if (!str) return null;

  // 2. If already ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 3. Match format like "2-Sep", "02-Sep", "2-Sep-2026", "2 Sep", "2nd September", "Sep 2", "September 2"
  const dayMonthTextMatch = str.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s\-\/\.]*([a-zA-Z]{3,9})(?:[\s\-\/\.]*(\d{2,4}))?$/i);
  if (dayMonthTextMatch) {
    const day = dayMonthTextMatch[1].padStart(2, "0");
    const mStr = dayMonthTextMatch[2].toLowerCase();
    const mNum = MONTH_MAP[mStr] || MONTH_MAP[mStr.slice(0, 3)];
    if (mNum) {
      const m = String(mNum).padStart(2, "0");
      let yr = currentYear;
      if (dayMonthTextMatch[3]) {
        const y = dayMonthTextMatch[3];
        yr = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
      }
      return `${yr}-${m}-${day}`;
    }
  }

  const monthDayTextMatch = str.match(/^([a-zA-Z]{3,9})[\s\-\/\.]*(\d{1,2})(?:st|nd|rd|th)?(?:[\s\-\/\,\.]*(\d{2,4}))?$/i);
  if (monthDayTextMatch) {
    const mStr = monthDayTextMatch[1].toLowerCase();
    const mNum = MONTH_MAP[mStr] || MONTH_MAP[mStr.slice(0, 3)];
    const day = monthDayTextMatch[2].padStart(2, "0");
    if (mNum) {
      const m = String(mNum).padStart(2, "0");
      let yr = currentYear;
      if (monthDayTextMatch[3]) {
        const y = monthDayTextMatch[3];
        yr = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
      }
      return `${yr}-${m}-${day}`;
    }
  }

  // 4. Handle DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1]);
    let month = parseInt(dmyMatch[2]);
    let yr = dmyMatch[3].length === 2 ? 2000 + parseInt(dmyMatch[3]) : parseInt(dmyMatch[3]);

    // If month > 12, swap
    if (month > 12 && day <= 12) {
      const tmp = day;
      day = month;
      month = tmp;
    }
    return `${yr}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // 5. Handle DD/MM or DD-MM (without year)
  const dmMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})$/);
  if (dmMatch) {
    let day = parseInt(dmMatch[1]);
    let month = parseInt(dmMatch[2]);
    if (month > 12 && day <= 12) {
      const tmp = day;
      day = month;
      month = tmp;
    }
    return `${currentYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // 6. Handle plain day number string like "2", "02", "15"
  if (/^\d{1,2}$/.test(str)) {
    const dayNum = parseInt(str);
    if (dayNum >= 1 && dayNum <= 31) {
      const m = String(fallbackMonth || new Date().getMonth() + 1).padStart(2, "0");
      const d = String(dayNum).padStart(2, "0");
      return `${currentYear}-${m}-${d}`;
    }
  }

  // 7. Fallback: JavaScript Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const yr = parsed.getFullYear();
    if (yr >= 2020 && yr <= 2040) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  return null;
};

/**
 * Standardize platform string into array of platform keys.
 * Handles abbreviations like "FB & IG", "IG", "FB", "LI", "YT", etc.
 */
export const normalizePlatforms = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  const str = String(val).toLowerCase();
  const matched = [];

  if (str.includes("fb") || str.includes("facebook")) matched.push("facebook");
  if (str.includes("ig") || str.includes("insta") || str.includes("instagram")) matched.push("instagram");
  if (str.includes("li") || str.includes("linkedin")) matched.push("linkedin");
  if (str.includes("yt") || str.includes("youtube")) matched.push("youtube");
  if (str.includes("tw") || str.includes("twitter") || str === "x" || str.includes(" x ")) matched.push("twitter");
  if (str.includes("tt") || str.includes("tiktok")) matched.push("tiktok");
  if (str.includes("threads")) matched.push("threads");
  if (str.includes("pin") || str.includes("pinterest")) matched.push("pinterest");

  return [...new Set(matched)];
};

/**
 * Standardize status value.
 */
export const normalizeStatus = (val) => {
  if (!val) return "pending";
  const str = String(val).trim().toLowerCase();
  if (str.includes("post") || str.includes("publish") || str.includes("done") || str.includes("live")) {
    return "posted";
  }
  if (str.includes("wip") || str.includes("sched") || str.includes("queue") || str.includes("ready") || str.includes("progress")) {
    return "scheduled";
  }
  return "pending";
};

/**
 * Identify column mappings from header row, fully covering the user's columns:
 * Week, Date, Week Day, Holidays, Post Title, Status, Platform, Format, Content Pillars, Image, Banner Content, Caption/# hashtags/Copywriting
 */
export const identifyColumns = (headers) => {
  const map = {
    weekIdx: -1,
    dateIdx: -1,
    weekDayIdx: -1,
    holidayIdx: -1,
    postTitleIdx: -1,
    statusIdx: -1,
    platformsIdx: -1,
    formatIdx: -1,
    pillarIdx: -1,
    creativesIdx: -1,
    bannerIdx: -1,
    captionIdx: -1,
    contentIdx: -1,
    hashtagsIdx: -1,
  };

  headers.forEach((h, idx) => {
    if (!h) return;
    const header = String(h).trim().toLowerCase().replace(/[\s_-]+/g, " ");

    if (map.dateIdx === -1 && (header === "date" || header.includes("post date") || header.includes("schedule") || header === "day/date")) {
      map.dateIdx = idx;
    } else if (map.weekDayIdx === -1 && (header.includes("week day") || header === "day" || header.includes("weekday"))) {
      map.weekDayIdx = idx;
    } else if (map.weekIdx === -1 && header.includes("week") && !header.includes("day")) {
      map.weekIdx = idx;
    } else if (map.holidayIdx === -1 && (header.includes("holiday") || header.includes("occasion") || header.includes("event") || header.includes("festival"))) {
      map.holidayIdx = idx;
    } else if (map.postTitleIdx === -1 && (header.includes("post title") || header === "title" || header.includes("topic") || header.includes("hook") || header.includes("theme") || header.includes("idea"))) {
      map.postTitleIdx = idx;
    } else if (map.formatIdx === -1 && (header === "format" || header.includes("post format") || header.includes("type"))) {
      map.formatIdx = idx;
    } else if (map.pillarIdx === -1 && (header.includes("pillar") || header.includes("content pillar") || header.includes("category"))) {
      map.pillarIdx = idx;
    } else if (map.bannerIdx === -1 && (header.includes("banner") || header.includes("graphic text") || header.includes("text on image"))) {
      map.bannerIdx = idx;
    } else if (map.creativesIdx === -1 && (header === "image" || header.includes("image link") || header.includes("pinterest") || header.includes("creative") || header.includes("drive") || header.includes("asset") || header.includes("media") || header.includes("visual"))) {
      map.creativesIdx = idx;
    } else if (map.captionIdx === -1 && (header.includes("caption") || header.includes("copywriting") || header.includes("copy") || header.includes("post copy") || header.includes("text"))) {
      map.captionIdx = idx;
    } else if (map.hashtagsIdx === -1 && (header.includes("hashtag") || header.includes("tag") || header === "#")) {
      map.hashtagsIdx = idx;
    } else if (map.platformsIdx === -1 && (header.includes("platform") || header.includes("channel") || header.includes("network") || header.includes("social"))) {
      map.platformsIdx = idx;
    } else if (map.statusIdx === -1 && (header.includes("status") || header.includes("approval") || header.includes("state") || header.includes("stage"))) {
      map.statusIdx = idx;
    } else if (map.contentIdx === -1 && (header.includes("suggestion") || header.includes("note") || header.includes("brief") || header.includes("content"))) {
      map.contentIdx = idx;
    }
  });

  return map;
};

/**
 * Extract all links (including Pinterest, Instagram, Drive, and Direct Images) from a cell string.
 */
export const extractCreativesFromCell = (cellValue, entryKey) => {
  if (!cellValue) return [];
  const str = String(cellValue).trim();
  if (!str || str === "—" || str === "-") return [];

  // Match URLs
  const urlRegex = /(https?:\/\/[^\s,;"<>]+)/gi;
  const matches = str.match(urlRegex) || [];

  if (matches.length > 0) {
    return matches.map((url, i) => {
      const cleanUrl = url.trim();
      const isPinterest = cleanUrl.includes("pin.it") || cleanUrl.includes("pinterest.");
      const isInstagram = cleanUrl.includes("instagram.com");
      const isDirectImage = /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(cleanUrl) || cleanUrl.includes("pinimg.com");
      const isDrive = cleanUrl.includes("drive.google.com");

      let label = "Attachment";
      if (isPinterest) label = "Pinterest Pin";
      else if (isInstagram) label = "Instagram Post";
      else if (isDrive) label = "Google Drive Asset";
      else if (isDirectImage) label = "Image Creative";

      return {
        fileId: `sheet-creative-${entryKey}-${i}-${Date.now()}`,
        fileName: label,
        driveLink: cleanUrl,
        webViewLink: cleanUrl,
        thumbnailLink: isDirectImage ? cleanUrl : null,
        isPinterest,
        isInstagram,
        isExternalLink: true,
      };
    });
  }

  // If plain text asset name
  return [
    {
      fileId: `sheet-creative-${entryKey}-0-${Date.now()}`,
      fileName: str,
      driveLink: null,
      webViewLink: null,
      thumbnailLink: null,
    },
  ];
};

/**
 * Parse rows into structured entries.
 */
export const parseSheetGridToEntries = (grid, tabName = "", clientId) => {
  if (!grid || grid.length < 2) return [];

  // Find the header row (first row with >= 2 non-empty strings)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(grid.length, 5); i++) {
    const filledCount = (grid[i] || []).filter((c) => c !== null && c !== undefined && String(c).trim() !== "").length;
    if (filledCount >= 2) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = grid[headerRowIndex] || [];
  const colMap = identifyColumns(headers);
  const dataRows = grid.slice(headerRowIndex + 1);

  // Attempt to deduce month/year from tabName (e.g. "Jan 2026", "September", "Sep 2026", "2026-09")
  let tabYear = null;
  let tabMonth = null;
  const monthMatch = String(tabName).match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s*(\d{2,4})?/i);
  if (monthMatch) {
    const mStr = monthMatch[1].toLowerCase();
    tabMonth = MONTH_MAP[mStr] || MONTH_MAP[mStr.slice(0, 3)] || 1;
    if (monthMatch[2]) {
      const y = monthMatch[2];
      tabYear = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
    } else {
      tabYear = new Date().getFullYear();
    }
  }

  const entries = [];
  let rowSeq = 0;

  for (const row of dataRows) {
    if (!row || row.length === 0) continue;
    const isAllEmpty = row.every((cell) => cell === null || cell === undefined || String(cell).trim() === "");
    if (isAllEmpty) continue;

    rowSeq++;
    const rawDate = colMap.dateIdx !== -1 ? row[colMap.dateIdx] : null;
    const normalizedDate = normalizeDate(rawDate, tabYear, tabMonth);

    const postTitle = colMap.postTitleIdx !== -1 && row[colMap.postTitleIdx] ? String(row[colMap.postTitleIdx]).trim() : "";
    const rawCaption = colMap.captionIdx !== -1 && row[colMap.captionIdx] ? String(row[colMap.captionIdx]).trim() : "";
    const holiday = colMap.holidayIdx !== -1 && row[colMap.holidayIdx] ? String(row[colMap.holidayIdx]).trim() : "";
    const formatVal = colMap.formatIdx !== -1 && row[colMap.formatIdx] ? String(row[colMap.formatIdx]).trim() : "";
    const pillarVal = colMap.pillarIdx !== -1 && row[colMap.pillarIdx] ? String(row[colMap.pillarIdx]).trim() : "";
    const bannerVal = colMap.bannerIdx !== -1 && row[colMap.bannerIdx] ? String(row[colMap.bannerIdx]).trim() : "";
    const weekVal = colMap.weekIdx !== -1 && row[colMap.weekIdx] ? String(row[colMap.weekIdx]).trim() : "";
    const existingContent = colMap.contentIdx !== -1 && row[colMap.contentIdx] ? String(row[colMap.contentIdx]).trim() : "";
    let rawHashtags = colMap.hashtagsIdx !== -1 && row[colMap.hashtagsIdx] ? String(row[colMap.hashtagsIdx]).trim() : "";

    // If caption contains hashtags (e.g. #marketing #branding), extract them
    let cleanCaption = rawCaption;
    if (!rawHashtags && rawCaption.includes("#")) {
      const hashtagMatches = rawCaption.match(/#[a-zA-Z0-9_]+/g);
      if (hashtagMatches && hashtagMatches.length > 0) {
        rawHashtags = hashtagMatches.join(" ");
      }
    }

    // Build rich content notes combining Format, Content Pillar, Banner Content, and Week
    const contentParts = [];
    const metaTags = [];
    if (weekVal) metaTags.push(`Week: ${weekVal}`);
    if (formatVal) metaTags.push(`Format: ${formatVal}`);
    if (pillarVal) metaTags.push(`Pillar: ${pillarVal}`);

    if (metaTags.length > 0) {
      contentParts.push(`[${metaTags.join(" | ")}]`);
    }
    if (bannerVal) {
      contentParts.push(`Banner Content: ${bannerVal}`);
    }
    if (existingContent) {
      contentParts.push(existingContent);
    }
    const combinedContent = contentParts.join("\n");

    // Ignore completely empty rows
    if (!normalizedDate && !postTitle && !cleanCaption && !combinedContent && !holiday) continue;

    const platforms = colMap.platformsIdx !== -1 ? normalizePlatforms(row[colMap.platformsIdx]) : [];
    const status = colMap.statusIdx !== -1 ? normalizeStatus(row[colMap.statusIdx]) : "pending";

    // Extract creatives / Pinterest / image links
    const rawMedia = colMap.creativesIdx !== -1 ? row[colMap.creativesIdx] : null;
    const creatives = extractCreativesFromCell(rawMedia, `${clientId}-${rowSeq}`);

    // Determine final date
    const finalDate =
      normalizedDate ||
      (tabYear && tabMonth
        ? `${tabYear}-${String(tabMonth).padStart(2, "0")}-${String(Math.min(rowSeq, 28)).padStart(2, "0")}`
        : new Date().toISOString().slice(0, 10));

    entries.push({
      clientId: parseInt(clientId),
      date: finalDate,
      holiday: holiday || null,
      postTitle: postTitle || (holiday ? `${holiday}` : (cleanCaption ? cleanCaption.slice(0, 45) + "..." : "")),
      content: combinedContent || null,
      caption: cleanCaption || null,
      hashtags: rawHashtags || null,
      platforms: JSON.stringify(platforms.length > 0 ? platforms : ["instagram"]),
      status,
      creatives: JSON.stringify(creatives),
      tabName: tabName || null,
    });
  }

  return entries;
};

/**
 * Parse an uploaded .xlsx or .csv buffer into sheets and entries.
 * @param {Buffer} buffer - Excel workbook buffer
 * @param {number|string} clientId - Client ID
 * @param {number} maxTabs - Optional limit to the N most recent tabs (e.g. 4)
 */
export const parseWorkbookBuffer = (buffer, clientId, maxTabs = 4) => {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const tabs = [];
  let allEntries = [];

  // Limit to the most recent N sheets (e.g., the last 4 tabs in the workbook)
  const targetSheetNames =
    maxTabs && maxTabs > 0 && workbook.SheetNames.length > maxTabs
      ? workbook.SheetNames.slice(-maxTabs)
      : workbook.SheetNames;

  for (const sheetName of targetSheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const grid = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    if (grid.length === 0) continue;

    const tabEntries = parseSheetGridToEntries(grid, sheetName, clientId);
    tabs.push({
      name: sheetName,
      entryCount: tabEntries.length,
    });
    allEntries = allEntries.concat(tabEntries);
  }

  return {
    tabs,
    totalEntries: allEntries.length,
    entries: allEntries,
  };
};

/**
 * Fetch and parse a Google Sheet via Drive API XLSX export or public XLSX download.
 * Limits to the last `maxTabs` (default 4) for optimal speed and zero DB stress.
 */
export const fetchAndParseGoogleSheet = async (sheetUrlOrId, clientId, maxTabs = 4) => {
  const sheetId = extractSpreadsheetId(sheetUrlOrId);
  if (!sheetId) {
    throw new Error("Invalid Google Sheet URL or ID. Please check the link.");
  }

  let buffer = null;

  // 1. Try Google Drive API export (extracts full workbook with all tabs)
  const client = getSheetsClient();
  if (client) {
    try {
      const clientIdEnv = process.env.GOOGLE_DRIVE_CLIENT_ID;
      const clientSecretEnv = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
      const refreshTokenEnv = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

      const oauth2Client = new google.auth.OAuth2(
        clientIdEnv,
        clientSecretEnv,
        "https://developers.google.com/oauthplayground"
      );
      oauth2Client.setCredentials({ refresh_token: refreshTokenEnv });
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      const res = await drive.files.export(
        {
          fileId: sheetId,
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        { responseType: "arraybuffer" }
      );
      buffer = Buffer.from(res.data);
    } catch (driveErr) {
      console.warn("Drive API export failed, attempting public XLSX export:", driveErr.message);
    }
  }

  // 2. Fallback: Public XLSX multi-tab export URL
  if (!buffer) {
    try {
      const publicUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
      const response = await fetch(publicUrl);
      if (!response.ok) {
        throw new Error("Could not access Google Sheet. Ensure the sheet is shared as 'Anyone with the link can view'.");
      }
      buffer = Buffer.from(await response.arrayBuffer());
    } catch (fetchErr) {
      throw new Error(`Unable to fetch Google Sheet: ${fetchErr.message}`);
    }
  }

  // 3. Parse workbook buffer limited to the last 4 month tabs
  const result = parseWorkbookBuffer(buffer, clientId, maxTabs);

  return {
    title: "Google Sheet Content Calendar",
    sheetId,
    tabs: result.tabs,
    totalEntries: result.totalEntries,
    entries: result.entries,
  };
};
