import ReportEditor from "@/components/reports/editor/ReportEditor";

// This server component only handles static generation for `output: 'export'`
// (production builds only — see next.config.mjs). It MUST NOT call the API
// at build time (CI has no backend -> ECONNREFUSED). The actual report data
// is fetched in the browser by ReportEditor/useReportEditor after hydration,
// mirroring the working clients/[id] and team/[slug] pages. Report ids keep
// growing indefinitely (unlike clients/team members, which grow slowly), so
// this same numeric-range pre-generation is even more of an approximation
// here — but it's the established pattern for every other numeric-id
// dynamic route in this app, not something to diverge from for one route.
export async function generateStaticParams() {
  return Array.from({ length: 100 }, (_, i) => ({ id: String(i + 1) }));
}

export const dynamicParams = false;

export default async function ReportEditorPage({ params }) {
  const { id } = await params;
  return <ReportEditor reportId={String(id)} />;
}
