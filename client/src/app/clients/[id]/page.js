import ClientDetailView from "@/components/clients/ClientDetailView";

// This server component only handles static generation for `output: 'export'`.
// It MUST NOT call the API at build time (CI has no backend -> ECONNREFUSED).
// Real client data is fetched in the browser by ClientDetailView after hydration.
export async function generateStaticParams() {
  return Array.from({ length: 100 }, (_, i) => ({ id: String(i + 1) }));
}

export default async function ClientDetailPage({ params }) {
  const { id } = await params;
  return <ClientDetailView clientId={String(id)} />;
}