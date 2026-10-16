import AgreementEditor from "@/components/agreements/editor/AgreementEditor";

// This server component only handles static generation for `output: 'export'`
// (production builds only — see next.config.mjs). It MUST NOT call the API
// at build time (CI has no backend -> ECONNREFUSED). The actual agreement
// data is fetched in the browser by AgreementEditor/useAgreementEditor after
// hydration, same established pattern as reports/[id] and clients/[id].
export async function generateStaticParams() {
  return Array.from({ length: 100 }, (_, i) => ({ id: String(i + 1) }));
}

export const dynamicParams = false;

export default async function AgreementEditorPage({ params }) {
  const { id } = await params;
  return <AgreementEditor agreementId={String(id)} />;
}
