import ProposalEditor from "@/components/proposals/editor/ProposalEditor";

// This server component only handles static generation for `output: 'export'`
// (production builds only — see next.config.mjs). It MUST NOT call the API
// at build time (CI has no backend -> ECONNREFUSED). The actual proposal
// data is fetched in the browser by ProposalEditor/useProposalEditor after
// hydration, same established pattern as agreements/[id]/edit.
export async function generateStaticParams() {
  return Array.from({ length: 100 }, (_, i) => ({ id: String(i + 1) }));
}

export const dynamicParams = false;

export default async function ProposalEditorPage({ params }) {
  const { id } = await params;
  return <ProposalEditor proposalId={String(id)} />;
}
