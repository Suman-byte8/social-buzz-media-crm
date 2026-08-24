"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import TeamMemberProfileShell from "@/components/teams/TeamMemberProfileShell";
import { fetchTeamMemberById } from "@/services/teamService";

// Fetches the team member in the browser after the page loads (static export safe).
export default function TeamMemberDetailView({ memberId }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMember = useCallback(async () => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchTeamMemberById(memberId);
      setMember(response?.data || response || null);
    } catch (err) {
      console.error("Error fetching team member:", err);
      setError(err?.message || "Failed to load team member");
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  if (loading && !member) {
    return (
      <main className="flex-1 p-container-margin flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">
            progress_activity
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Loading team member...
          </p>
        </div>
      </main>
    );
  }

  if (error || !member) {
    return (
      <main className="flex-1 p-container-margin flex items-center justify-center min-h-[60vh]">
        <div className="text-center flex flex-col items-center gap-3 max-w-sm">
          <span className="material-symbols-outlined text-4xl text-secondary">
            error_outline
          </span>
          <p className="font-title-md text-title-md text-on-surface">
            Team member not found
          </p>
          <p className="font-body-sm text-body-sm text-secondary">
            {error || `No team member found with id "${memberId}".`}
          </p>
          <Link
            href="/team"
            className="px-4 py-2 rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Back to Team
          </Link>
        </div>
      </main>
    );
  }

  return <TeamMemberProfileShell member={member} onRefresh={loadMember} />;
}
