import TeamPageShell from "@/components/teams/TeamPageShell";
import { fetchTeamMembers } from "@/services/teamService";
import { fetchTasks } from "@/services/taskService";

async function fetchInitialData() {
  try {
    const [members, taskRes] = await Promise.all([
      fetchTeamMembers(),
      fetchTasks({ limit: 500 }),
    ]);
    return { teamMembers: members || [], tasks: taskRes.data || [] };
  } catch (error) {
    console.error("Error fetching team page data:", error);
    return { teamMembers: [], tasks: [] };
  }
}

export default async function TeamPage() {
  const { teamMembers, tasks } = await fetchInitialData();

  return <TeamPageShell teamMembers={teamMembers} tasks={tasks} />;
}
