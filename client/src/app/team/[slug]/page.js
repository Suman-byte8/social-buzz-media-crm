// Minimal page for /team/[slug] - satisfies Next.js static export
// The actual team routes are handled via client/new and client/[id]/templates
export async function generateStaticParams() {
  return [{ slug: 'any' }]; // Placeholder for static generation
}

export default async function TeamPage({ params }) {
  // Real team page would be at client/team/[slug]
  return <p>Team page placeholder</p>;
}