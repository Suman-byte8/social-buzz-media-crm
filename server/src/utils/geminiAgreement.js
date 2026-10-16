// Reads an accepted proposal (PDF or screenshot image) and extracts the
// Schedule A details the agreement template's own instructions say to
// copy in by hand ("Copy the modules, fees and ad budget from the accepted
// proposal into Schedule A") — reusing the same free-tier Gemini call +
// model-discovery/fallback machinery geminiVision.js already built for the
// Report Builder's screenshot analysis, rather than a second integration.
import { callGemini } from "./geminiVision.js";

const SCHEDULE_A_SCHEMA = {
  type: "object",
  properties: {
    socialMediaIncluded: { type: "boolean" },
    socialMediaDeliverables: { type: "string" },
    localSeoIncluded: { type: "boolean" },
    localSeoDeliverables: { type: "string" },
    paidAdsIncluded: { type: "boolean" },
    paidAdsDeliverables: { type: "string" },
    addOns: { type: "string" },
    monthlyRetainer: { type: "string" },
    oneTimeSetupFee: { type: "string" },
    addOnsFee: { type: "string" },
    gstTerms: { type: "string" },
    monthlyAdBudget: { type: "string" },
    adPlatforms: { type: "string" },
    startDate: { type: "string" },
    minimumTermMonths: { type: "string" },
    currency: { type: "string" },
    accountsToShare: { type: "string" },
    clientApprover: { type: "string" },
    agencyAccountManager: { type: "string" },
  },
  // Deliberately no `required` fields — a real proposal usually only
  // covers some of these; everything else stays whatever the template
  // already had (see applyScheduleAExtraction's "only overwrite what was
  // actually found" rule).
};

const EXTRACTION_PROMPT = `You are helping a digital marketing agency copy details from an accepted client proposal into a service agreement's "Schedule A" section.

Read the attached proposal document/screenshot and extract ONLY what is clearly and explicitly stated in it:
- Which service modules are included: social media marketing, local SEO / Google Business Profile, and paid ads management — and what the actual deliverables are for each (e.g. "8 posts, 2 reels, 8 stories on Instagram and Facebook").
- Any add-on items and quantities.
- Fees: the monthly retainer amount, one-time setup fee, add-on pricing, and whether GST is included or extra.
- Ad budget: the monthly ad budget amount, which platforms (Google/Meta/LinkedIn/etc.), proposed start date, minimum term in months, and currency.
- Access/contacts: which accounts need to be shared, the client's approver name/contact, and the agency's account manager name/contact, if mentioned.

Rules:
- Never invent or estimate a number, date, or name that isn't actually in the document — leave that field out entirely if it isn't clearly stated.
- Keep deliverables/fee text short and in the same plain style a contract would use (e.g. "₹25,000" not "approximately twenty-five thousand rupees").
- socialMediaIncluded/localSeoIncluded/paidAdsIncluded should be true only if the proposal clearly includes that module; otherwise omit the field rather than guessing false.

Respond with JSON matching the given schema only.`;

function buildFilePart(buffer, mimeType) {
  return { inlineData: { mimeType, data: buffer.toString("base64") } };
}

// Returns the raw extracted fields (or throws, same error-surfacing
// convention as analyzeScreenshotsForReport) — the caller decides how to
// merge them into a specific agreement's document.
export async function extractScheduleADetails(buffer, mimeType) {
  const parts = [{ text: EXTRACTION_PROMPT }, buildFilePart(buffer, mimeType)];
  return callGemini(parts, SCHEDULE_A_SCHEMA);
}
