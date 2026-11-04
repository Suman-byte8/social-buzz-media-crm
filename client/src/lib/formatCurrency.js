// The one shared INR formatter for the Payment Management module. The rest
// of this codebase has the same Intl.NumberFormat snippet hand-duplicated
// in several places (Invoice Builder, Salary Slips) with no shared helper
// — new code here uses this instead of adding a fourth copy.
const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Money in this module is always stored/transmitted as integer paise —
// this is the one place it becomes a human-readable rupee string.
export function formatRupees(paise) {
  return formatter.format((paise || 0) / 100);
}

// Ad accounts can bill in any currency, so ad spend is formatted with the
// account's own currency code (still minor units in, like formatRupees).
export function formatMoney(minor, currency = "INR", { compact = false } = {}) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 2,
    }).format((minor || 0) / 100);
  } catch {
    return `${currency || ""} ${((minor || 0) / 100).toFixed(2)}`.trim();
  }
}

export function paiseToRupees(paise) {
  return (paise || 0) / 100;
}

export function rupeesToPaise(rupees) {
  return Math.round((parseFloat(rupees) || 0) * 100);
}
