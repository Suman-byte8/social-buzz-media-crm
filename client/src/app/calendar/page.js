import ContentCalendarShell from "@/components/content-calendar/ContentCalendarShell";
import { fetchClients } from "@/services/clientService";

async function fetchAllClients() {
  try {
    const response = await fetchClients({ limit: 100 });
    return response.data || [];
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

export default async function ContentCalendarPage() {
  const clients = await fetchAllClients();

  return (
    <ContentCalendarShell clients={clients} />
  );
}
