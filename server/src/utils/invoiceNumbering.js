import { Op } from "sequelize";

// "SBM/INV/{year}/{###}" — same COUNT(*)+1-scoped-to-year-inside-a-
// transaction approach as agreementBuilderRoutes.js's generateAgreementNumber
// / proposalBuilderRoutes.js's generateProposalNumber. Not a formal
// guarantee against every conceivable race, but matches this codebase's own
// established, accepted tradeoff for this agency's actual concurrency.
export async function generateInvoiceNumber(Invoice, transaction) {
  const year = new Date().getFullYear();
  const count = await Invoice.count({
    where: { createdAt: { [Op.gte]: new Date(`${year}-01-01`), [Op.lt]: new Date(`${year + 1}-01-01`) } },
    transaction,
  });
  const sequence = String(count + 1).padStart(3, "0");
  return `SBM/INV/${year}/${sequence}`;
}
