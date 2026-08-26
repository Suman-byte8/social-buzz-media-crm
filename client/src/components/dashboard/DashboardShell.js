"use client";

import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClients } from "@/redux/slices/clientsSlice";
import { fetchTasks, updateTask, setTaskStatusLocal } from "@/redux/slices/tasksSlice";
import { fetchTeamMembers } from "@/redux/slices/teamSlice";
import { fetchAgreements } from "@/redux/slices/documentsSlice";
import { fetchContentCalendarEntries } from "@/redux/slices/contentCalendarSlice";
import MetricsGrid from "./MetricsGrid";
import TeamWorkload from "./TeamWorkload";
import TasksDueToday from "./TasksDueToday";
import ClientHealthScore from "./ClientHealthScore";

const isSameDay = (a, b) => a.toDateString() === b.toDateString();

export default function DashboardShell() {
  const dispatch = useDispatch();

  const clients = useSelector((state) => state.clients.clients);
  const clientsLoading = useSelector((state) => state.clients.loading);
  const tasks = useSelector((state) => state.tasks.tasks);
  const tasksLoading = useSelector((state) => state.tasks.loading);
  const teamMembers = useSelector((state) => state.team.teamMembers);
  const teamLoading = useSelector((state) => state.team.loading);
  const agreements = useSelector((state) => state.documents.agreements);
  const agreementsLoading = useSelector((state) => state.documents.loadingAgreements);
  const contentEntries = useSelector((state) => state.contentCalendar.entries);
  const contentLoading = useSelector((state) => state.contentCalendar.loading);

  // The dashboard shows a single combined "loading" flag across five
  // independent slices. OR-ing them together reproduces the previous
  // Promise.all behavior: the dashboard is considered loading as long as
  // any one of the five fetches is still in flight, and stops the instant
  // the last one settles.
  const loading = clientsLoading || tasksLoading || teamLoading || agreementsLoading || contentLoading;

  useEffect(() => {
    dispatch(fetchClients({ limit: 500 }));
    dispatch(fetchTasks({ limit: 500 }));
    dispatch(fetchTeamMembers());
    dispatch(fetchAgreements());
    dispatch(fetchContentCalendarEntries({}));
  }, [dispatch]);

  const handleToggleTaskComplete = async (task) => {
    const nextStatus = task.status === "completed" ? "todo" : "completed";
    dispatch(setTaskStatusLocal({ id: task.id, status: nextStatus }));
    try {
      await dispatch(updateTask({ id: task.id, taskData: { status: nextStatus } })).unwrap();
    } catch (error) {
      console.error("Error updating task:", error);
      dispatch(setTaskStatusLocal({ id: task.id, status: task.status }));
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
