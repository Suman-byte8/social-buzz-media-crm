// Pure salary calculation for the Salary Slip builder, extracted so it can
// be unit-reasoned-about independently of the component's rendering/state —
// same split as invoiceTotals.js.
export function computeSalaryTotals({
  basicSalary,
  hra,
  otherAllowances,
  employeePf,
  professionalTax,
  tds,
  otherDeductions,
}) {
  const gross = (basicSalary || 0) + (hra || 0) + (otherAllowances || 0);
  const totalDeductions = (employeePf || 0) + (professionalTax || 0) + (tds || 0) + (otherDeductions || 0);
  const net = gross - totalDeductions;

  return { gross, totalDeductions, net };
}
