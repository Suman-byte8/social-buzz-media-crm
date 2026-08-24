import TeamMemberDetailView from "@/components/teams/TeamMemberDetailView";

// This server component only handles static generation for `output: 'export'`.
// It MUST NOT call the API at build time (CI has no backend -> ECONNREFUSED).
// Real member data is fetched in the browser by TeamMemberDetailView after
// hydration, mirroring the working clients/[id] page.
//
// Team member rows link to `/team/${member.id}` (numeric database id), so we
// pre-generate a numeric slug range to satisfy the static export requirement.
export async function generateStaticParams() {
  return Array.from({ length: 100 }, (_, i) => ({ slug: String(i + 1) }));
}

// Only paths returned by generateStaticParams will be served.
// Unspecified routes return 404 instead of attempting dynamic rendering
// (which is incompatible with `output: 'export'`).
export const dynamicParams = false;

export default async function TeamPage({ params }) {
  const { slug } = await params;
  return <TeamMemberDetailView memberId={String(slug)} />;
}