import ClientDetailView from "@/components/clients/ClientDetailView";


// This server component only handles static generation for `output: 'export'`.
// It MUST NOT call the API at build time (CI has no backend -> ECONNREFUSED).
// Real client data is fetched in the browser by ClientDetailView after hydration.
export async function generateStaticParams() {
  return Array.from({ length: 100 }, (_, i) => ({ id: String(i + 1) }));
}

// Only paths returned by generateStaticParams will be served.
// Unspecified routes return 404 instead of attempting dynamic rendering
// (which is incompatible with `output: 'export'`).
export const dynamicParams = false;

export default async function ClientDetailPage({ params }) {
  const { id } = await params;
  return <ClientDetailView clientId={String(id)} />;
}