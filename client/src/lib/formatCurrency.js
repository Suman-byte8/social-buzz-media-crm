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

export function paiseToRupees(paise) {
  return (paise || 0) / 100;
}

export function rupeesToPaise(rupees) {
  return Math.round((parseFloat(rupees) || 0) * 100);
}
