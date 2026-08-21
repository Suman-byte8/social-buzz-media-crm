import { fetchClients } from "@/services/clientService";
import { fetchTeamMembers } from "@/services/teamService";
import { fetchTasks } from "@/services/taskService";
import TasksPageShell from "@/components/tasks/TasksPageShell";

async function fetchInitialData() {
  try {
    const [taskRes, clientRes, memberRes] = await Promise.all([
      fetchTasks({ limit: 50 }),
      fetchClients({ limit: 100 }),
      fetchTeamMembers(),
    ]);

    return {
      tasks: taskRes.data || [],
      clients: clientRes.data || clientRes || [],
      teamMembers: memberRes || [],
    };
  } catch (error) {
    console.error("Error fetching initial data:", error);
    return {
      tasks: [],
      clients: [],
      teamMembers: [],
    };
  }
}

export default async function TasksPage() {
  const { tasks, clients, teamMembers } = await fetchInitialData();

  return (
    <TasksPageShell
      tasks={tasks}
      clients={clients}
      teamMembers={teamMembers}
      stats={{
        totalTasks: tasks.length,
        todo: tasks.filter((t) => t.status === "todo").length,
        in_progress: tasks.filter((t) => t.status === "in_progress").length,
        review: tasks.filter((t) => t.status === "review").length,
        completed: tasks.filter((t) => t.status === "completed").length,
      }}
    />
  );
}
