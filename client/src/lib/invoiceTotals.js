// Pure GST/total calculation for the invoice builder, extracted so it can be
// unit-reasoned-about independently of the component's rendering/state.
export function computeInvoiceTotals({ rows, gstMode, gstRate, roundOff }) {
  const subtotal = rows.reduce((sum, r) => sum + (r.qty || 0) * (r.rate || 0), 0);
  const discount = 0;
  const taxable = Math.max(subtotal - discount, 0);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (gstMode === "intra") {
    cgst = sgst = (taxable * gstRate) / 200;
  } else if (gstMode === "inter") {
    igst = (taxable * gstRate) / 100;
  }

  const grossTotal = taxable + cgst + sgst + igst;
  const grand = roundOff ? Math.round(grossTotal) : grossTotal;
  const roundAmt = grand - grossTotal;

  return { subtotal, discount, taxable, cgst, sgst, igst, gstMode, roundAmt, grand };
}
