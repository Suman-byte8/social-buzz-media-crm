"use client";

import React, { useState, useEffect, useMemo } from "react";
import { fetchClients } from "@/services/clientService";
import { fetchTasks, updateTask } from "@/services/taskService";
import { fetchTeamMembers } from "@/services/teamService";
import { fetchAgreements } from "@/services/documentService";
import { fetchContentCalendarEntries } from "@/services/contentCalendarService";
import MetricsGrid from "./MetricsGrid";
import TeamWorkload from "./TeamWorkload";
import TasksDueToday from "./TasksDueToday";
import ClientHealthScore from "./ClientHealthScore";

const isSameDay = (a, b) => a.toDateString() === b.toDateString();

export default function DashboardShell() {
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [contentEntries, setContentEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [clientsRes, tasksRes, teamRes, agreementsRes, contentRes] = await Promise.all([
        fetchClients({ limit: 500 }).catch(() => ({ data: [] })),
        fetchTasks({ limit: 500 }).catch(() => ({ data: [] })),
        fetchTeamMembers().catch(() => []),
        fetchAgreements().catch(() => ({ data: [] })),
        fetchContentCalendarEntries({}).catch(() => ({ data: [] })),
      ]);
      setClients(clientsRes.data || clientsRes || []);
      setTasks(tasksRes.data || tasksRes || []);
      setTeamMembers(teamRes || []);
      setAgreements(agreementsRes.data || agreementsRes || []);
      setContentEntries(contentRes.data || contentRes || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskComplete = async (task) => {
    const nextStatus = task.status === "completed" ? "todo" : "completed";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    try {
      await updateTask(task.id, { status: nextStatus });
    } catch (error) {
      console.error("Error updating task:", error);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
    }
  };

  const now = useMemo(() => new Date(), []);

  const metrics = useMemo(() => {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newClientsThisMonth = clients.filter((c) => c.createdAt && new Date(c.createdAt) >= startOfMonth).length;

    const openTasks = tasks.filter((t) => t.status !== "completed");
    const tasksDueToday = openTasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), now));

    const thisMonthEntries = contentEntries.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const postedThisMonth = thisMonthEntries.filter((e) => e.posted).length;
    const pendingThisMonth = thisMonthEntries.length - postedThisMonth;

    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);
    const upcomingRenewals = clients.filter((c) => {
      if (!c.renewal) return false;
      const r = new Date(c.renewal);
      return r >= now && r <= in30Days;
    });
    const nextRenewal = upcomingRenewals.sort((a, b) => new Date(a.renewal) - new Date(b.renewal))[0];

    const pendingAgreements = agreements.filter((a) => a.status === "pending_signature").length;

    return [
      {
        title: "Total Clients",
        value: String(clients.length),
        change: newClientsThisMonth > 0 ? `+${newClientsThisMonth} this month` : "No new clients this month",
        changeType: newClientsThisMonth > 0 ? "positive" : "neutral",
        icon: "domain",
      },
      {
        title: "Open Tasks",
        value: String(openTasks.length),
        change: tasksDueToday.length > 0 ? `${tasksDueToday.length} due today` : "None due today",
        changeType: tasksDueToday.length > 0 ? "negative" : "positive",
        icon: "checklist",
      },
      {
        title: "Posted This Month",
        value: String(postedThisMonth),
        change: `${pendingThisMonth} pending`,
        changeType: pendingThisMonth > 0 ? "negative" : "positive",
        icon: "event_available",
      },
      {
        title: "Upcoming Renewals",
        value: String(upcomingRenewals.length),
        change: nextRenewal ? `Next: ${nextRenewal.name}` : "None in next 30 days",
        changeType: upcomingRenewals.length > 0 ? "negative" : "positive",
        icon: "event_repeat",
      },
      {
        title: "Pending Agreements",
        value: String(pendingAgreements),
        change: pendingAgreements > 0 ? "Awaiting signature" : "All signed",
        changeType: pendingAgreements > 0 ? "negative" : "positive",
        icon: "history_edu",
      },
    ];
  }, [clients, tasks, contentEntries, agreements, now]);

  const workloadMembers = useMemo(() => {
    const openTasks = tasks.filter((t) => t.status !== "completed");
    const withCounts = teamMembers.map((member) => {
      const count = openTasks.filter((t) => (t.assignees || []).map(Number).includes(member.id)).length;
      return { ...member, taskCount: count };
    });
    const maxCount = Math.max(1, ...withCounts.map((m) => m.taskCount));
    return withCounts
      .sort((a, b) => b.taskCount - a.taskCount)
      .slice(0, 6)
      .map((m) => ({ ...m, widthPercent: Math.round((m.taskCount / maxCount) * 100) }));
  }, [teamMembers, tasks]);

  const { headingLabel, dueTasks, remainingCount } = useMemo(() => {
    const openTasks = tasks.filter((t) => t.status !== "completed");
    const dueTodayTasks = openTasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), now));

    if (dueTodayTasks.length > 0) {
      return {
        headingLabel: "Tasks Due Today",
        dueTasks: dueTodayTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 6),
        remainingCount: dueTodayTasks.length,
      };
    }

    const upcoming = openTasks
      .filter((t) => t.dueDate && new Date(t.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 6);

    return { headingLabel: "Upcoming Tasks", dueTasks: upcoming, remainingCount: openTasks.length };
  }, [tasks, now]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-stack-md lg:gap-stack-lg">
      <div className="lg:col-span-12">
        <MetricsGrid metrics={metrics} loading={loading} />
      </div>

      <div className="lg:col-span-7">
        <TeamWorkload members={workloadMembers} loading={loading} />
      </div>

      <div className="lg:col-span-5">
        <TasksDueToday
          heading={headingLabel}
          tasks={dueTasks}
          remainingCount={remainingCount}
          onToggleComplete={handleToggleTaskComplete}
          loading={loading}
        />
      </div>

      <div className="lg:col-span-12">
        <ClientHealthScore clients={clients} loading={loading} />
      </div>
    </div>
  );
}
