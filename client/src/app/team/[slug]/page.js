import { notFound } from "next/navigation";
import TeamMemberProfileShell from "@/components/teams/TeamMemberProfileShell";
import { fetchTeamMemberById } from "@/services/teamService";

async function getTeamMember(id) {
  try {
    const member = await fetchTeamMemberById(id);
    return member || null;
  } catch (error) {
    console.error("Error fetching team member:", error);
    return null;
  }
}

export default async function TeamMemberProfilePage({ params }) {
  const { slug } = await params;
  const member = await getTeamMember(slug);

  if (!member) {
    notFound();
  }

  return <TeamMemberProfileShell member={member} />;
}
