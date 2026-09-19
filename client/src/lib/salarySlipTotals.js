// Pure salary calculation for the Salary Slip builder, extracted so it can
// be unit-reasoned-about independently of the component's rendering/state —
// same split as invoiceTotals.js. Earnings/deductions are dynamic row lists
// (like invoice line items) rather than a fixed set of fields, so Gross and
// Net are just the sum of whatever rows currently exist.
export function computeSalaryTotals({ earningRows = [], deductionRows = [] }) {
  const gross = earningRows.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalDeductions = deductionRows.reduce((sum, r) => sum + (r.amount || 0), 0);
  const net = gross - totalDeductions;

  return { gross, totalDeductions, net };
}
