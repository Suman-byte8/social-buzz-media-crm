import { notFound } from "next/navigation";
import TeamPageShell from "@/components/teams/TeamPageShell";
import { fetchTeamMembers } from "@/services/teamService";

async function getTeamMembers() {
  try {
    const members = await fetchTeamMembers();
    return members || [];
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
}

export default async function TeamPage() {
  const teamMembers = await getTeamMembers();

  const stats = {
    totalMembers: teamMembers.length,
    activeNow: teamMembers.filter(m => (m.status || '').toLowerCase() === 'active').length,
    available: teamMembers.filter(m => (m.status || '').toLowerCase() === 'active').length,
    completedThisWeek: teamMembers.length * 2,
  };

  return (
    <TeamPageShell
      teamMembers={teamMembers}
      stats={stats}
    />
  );
}
