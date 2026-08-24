"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { parseArrayField, updateTeamMember } from "@/services/teamService";
import { fetchClients, updateClient } from "@/services/clientService";
import {
  createTask,
  fetchTasksByAssignee,
  updateTask,
  deleteTask,
} from "@/services/taskService";
import EditMemberModal from "@/components/teams/EditMemberModal";

export default function TeamMemberProfileShell({ member, onRefresh }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignWorkModalOpen, setIsAssignWorkModalOpen] = useState(false);
  const [isAssignClientModalOpen, setIsAssignClientModalOpen] = useState(false);

  // All clients for selection
  const [allClients, setAllClients] = useState([]);
  const [assignedClientsList, setAssignedClientsList] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Member Tasks from DB
  const [memberTasks, setMemberTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Assign Work Form State
  const [workForm, setWorkForm] = useState({
    title: "",
    clientId: "",
    clientName: "",
    status: "in_progress",
    priority: "medium",
    dueDate: "",
    description: "",
  });
  const [assignWorkLoading, setAssignWorkLoading] = useState(false);

  // Edit Task State
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskLoading, setEditTaskLoading] = useState(false);

  // Delete Task State
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  // Assign Client Form State
  const [selectedClientId, setSelectedClientId] = useState("");
  const [assignClientLoading, setAssignClientLoading] = useState(false);

  const assignedWorksRaw = parseArrayField(member.assignedWorks);
  const clientHandlingNames = parseArrayField(member.clientHandling);

  // Parse Bank Details
  let bankObj = {
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    upiId: "",
  };
  if (member.bankDetails) {
    try {
      const parsed =
        typeof member.bankDetails === "string"
          ? JSON.parse(member.bankDetails)
          : member.bankDetails;
      if (typeof parsed === "object" && parsed !== null) {
        bankObj = { ...bankObj, ...parsed };
      }
    } catch {
      bankObj.bankName = member.bankDetails;
    }
  }

  // Fetch Member Tasks from API
  const loadMemberTasks = useCallback(async () => {
    if (!member?.id) return;
    setLoadingTasks(true);
    try {
      const response = await fetchTasksByAssignee(member.id);
      const tasks = response?.data || response || [];
      setMemberTasks(Array.isArray(tasks) ? tasks : []);
    } catch (err) {
      console.error("Error loading tasks for member:", err);
    } finally {
      setLoadingTasks(false);
    }
  }, [member?.id]);

  useEffect(() => {
    loadMemberTasks();
  }, [loadMemberTasks]);

  // Merge database tasks with raw assignedWorks strings for complete view
  const displayWorksList = React.useMemo(() => {
    const list = [...memberTasks];
    assignedWorksRaw.forEach((work) => {
      const workTitle = typeof work === "string" ? work : work.title || work.name;
      if (workTitle) {
        const exists = list.some(
          (t) => t.title?.toLowerCase() === workTitle.toLowerCase()
        );
        if (!exists) {
          list.push({
            id: null,
            title: workTitle,
            status: typeof work === "object" && work.status ? work.status : "in_progress",
            dueDate: typeof work === "object" && work.dueDate ? work.dueDate : null,
            clientName: typeof work === "object" && work.client ? work.client : null,
            priority: typeof work === "object" && work.priority ? work.priority : "medium",
            description: "",
            isLegacy: true,
          });
        }
      }
    });
    return list;
  }, [memberTasks, assignedWorksRaw]);

  // Load clients managed by this team member
  useEffect(() => {
    let isMounted = true;
    const loadClientsData = async () => {
      setLoadingClients(true);
      try {
        const response = await fetchClients({ limit: 100 });
        const clients = response?.data || response || [];
        if (!isMounted) return;

        setAllClients(clients);

        // Filter clients assigned to this member either by clientManagedBy OR clientHandling array
        const assigned = clients.filter((c) => {
          const isManagedBy = String(c.clientManagedBy) === String(member.id);
          const isNameInHandling = clientHandlingNames.some(
            (name) => name.toLowerCase() === c.name.toLowerCase()
          );
          return isManagedBy || isNameInHandling;
        });

        setAssignedClientsList(assigned);
      } catch (err) {
        console.error("Error loading clients:", err);
      } finally {
        if (isMounted) setLoadingClients(false);
      }
    };

    if (member?.id) {
      loadClientsData();
    }

    return () => {
      isMounted = false;
    };
  }, [member?.id, member?.clientHandling]);

  const initials = member.name
    ? member.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  const status = (member.status || "").toLowerCase();
  const getStatusBadge = () => {
    if (status === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-green-50 text-green-700 font-label-sm text-label-sm border border-green-100">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
        </span>
      );
    }
    if (status === "inactive") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-100 text-gray-700 font-label-sm text-label-sm border border-gray-200">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 text-orange-700 font-label-sm text-label-sm border border-orange-100">
        <span className="material-symbols-outlined text-[12px]">warning</span> No Status
      </span>
    );
  };

  const hireDate = member.hireDate
    ? new Date(member.hireDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const Tenure =
    member.hireDate && !isNaN(new Date(member.hireDate))
      ? Math.floor(
          (new Date().getTime() - new Date(member.hireDate).getTime()) /
            (1000 * 60 * 60 * 24 * 30)
        )
      : 0;

  const formatDueDate = (dateVal) => {
    if (!dateVal) return "N/A";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const renderStatusBadge = (statusStr) => {
    const s = (statusStr || "in_progress").toLowerCase().replace(/_/g, " ");
    if (s === "completed") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-label-sm text-label-sm border border-emerald-200 font-medium inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Completed
        </span>
      );
    }
    if (s === "in progress" || s === "in_progress") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-label-sm text-label-sm border border-blue-200 font-medium inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> In Progress
        </span>
      );
    }
    if (s === "todo" || s === "to do") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-label-sm text-label-sm border border-amber-200 font-medium inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> To Do
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-label-sm text-label-sm border border-gray-200 font-medium capitalize">
        {s}
      </span>
    );
  };

  // Handle Assign Work Submission
  const handleAssignWorkSubmit = async (e) => {
    e.preventDefault();
    if (!workForm.title.trim()) return;

    setAssignWorkLoading(true);
    try {
      // 1. Create task with assignee
      await createTask({
        title: workForm.title,
        description: workForm.description || null,
        status: workForm.status || "in_progress",
        priority: workForm.priority || "medium",
        clientId: workForm.clientId ? parseInt(workForm.clientId) : null,
        assignees: [member.id],
        dueDate: workForm.dueDate || null,
      });

      // 2. Sync to member assignedWorks
      const updatedWorks = [...assignedWorksRaw];
      if (!updatedWorks.includes(workForm.title)) {
        updatedWorks.push(workForm.title);
        await updateTeamMember(member.id, {
          assignedWorks: JSON.stringify(updatedWorks),
        });
      }

      setIsAssignWorkModalOpen(false);
      setWorkForm({
        title: "",
        clientId: "",
        clientName: "",
        status: "in_progress",
        priority: "medium",
        dueDate: "",
        description: "",
      });

      await loadMemberTasks();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error assigning work:", err);
      alert("Failed to assign work. Please try again.");
    } finally {
      setAssignWorkLoading(false);
    }
  };

  // Open Edit Task Modal
  const handleOpenEditTask = (taskItem) => {
    setEditingTask({
      id: taskItem.id || null,
      originalTitle: taskItem.title,
      title: taskItem.title || "",
      clientId: taskItem.clientId ? String(taskItem.clientId) : "",
      status: taskItem.status || "in_progress",
      priority: taskItem.priority || "medium",
      dueDate: taskItem.dueDate ? taskItem.dueDate.split("T")[0] : "",
      description: taskItem.description || "",
      isLegacy: !!taskItem.isLegacy,
    });
    setIsEditTaskModalOpen(true);
  };

  // Submit Edit Task
  const handleEditTaskSubmit = async (e) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;

    setEditTaskLoading(true);
    try {
      if (editingTask.id) {
        // Update task in DB
        await updateTask(editingTask.id, {
          title: editingTask.title,
          status: editingTask.status,
          priority: editingTask.priority,
          clientId: editingTask.clientId ? parseInt(editingTask.clientId) : null,
          dueDate: editingTask.dueDate || null,
          description: editingTask.description || null,
        });
      } else {
        // Legacy string item: update assignedWorks list on TeamMember
        const updated = assignedWorksRaw.map((item) => {
          const t = typeof item === "string" ? item : item.title || item.name;
          return t === editingTask.originalTitle ? editingTask.title : item;
        });
        await updateTeamMember(member.id, {
          assignedWorks: JSON.stringify(updated),
        });
      }

      setIsEditTaskModalOpen(false);
      setEditingTask(null);
      await loadMemberTasks();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task. Please try again.");
    } finally {
      setEditTaskLoading(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskItem) => {
    if (
      !window.confirm(`Are you sure you want to delete work "${taskItem.title}"?`)
    ) {
      return;
    }

    setDeletingTaskId(taskItem.id || taskItem.title);
    try {
      if (taskItem.id) {
        await deleteTask(taskItem.id);
      } else {
        // Legacy string item without DB Task ID: clean up assignedWorks list on TeamMember
        const updatedWorks = assignedWorksRaw.filter((item) => {
          const t = typeof item === "string" ? item : item.title || item.name;
          return t !== taskItem.title;
        });
        await updateTeamMember(member.id, {
          assignedWorks: JSON.stringify(updatedWorks),
        });
      }

      await loadMemberTasks();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error deleting task:", err);
      alert(err.message || "Failed to delete task. Please try again.");
    } finally {
      setDeletingTaskId(null);
    }
  };

  // Handle Assign Client Submission
  const handleAssignClientSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientId) return;

    setAssignClientLoading(true);
    try {
      const selectedClient = allClients.find(
        (c) => String(c.id) === String(selectedClientId)
      );

      // 1. Update Client's clientManagedBy field
      await updateClient(selectedClientId, {
        clientManagedBy: member.id,
      });

      // 2. Update member's clientHandling list
      let updatedClientNames = [...clientHandlingNames];
      if (
        selectedClient &&
        !updatedClientNames.some(
          (name) => name.toLowerCase() === selectedClient.name.toLowerCase()
        )
      ) {
        updatedClientNames.push(selectedClient.name);
        await updateTeamMember(member.id, {
          clientHandling: JSON.stringify(updatedClientNames),
        });
      }

      setIsAssignClientModalOpen(false);
      setSelectedClientId("");

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error assigning client:", err);
      alert("Failed to assign client. Please try again.");
    } finally {
      setAssignClientLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Profile Header Card (Hero) */}
        <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          {/* Banner */}
          <div className="h-32 w-full bg-gradient-to-r from-surface-variant to-surface-container-highest relative">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(#926f6b 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
          </div>

          <div className="px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              {/* Avatar & Title */}
              <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-12 relative z-10">
                <div className="w-32 h-32 rounded-xl border-4 border-surface bg-surface-container-high overflow-hidden shadow-sm shrink-0 flex items-center justify-center bg-gray-100">
                  {member.avatar ? (
                    <img
                      className="w-full h-full object-cover"
                      src={member.avatar}
                      alt={member.name}
                    />
                  ) : (
                    <span className="font-display-lg text-display-lg text-primary font-bold">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="pb-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-display-lg text-display-lg text-on-surface mb-1">
                      {member.name}
                    </h1>
                    {/* Employee ID Badge */}
                    <span className="px-2.5 py-1 rounded-xl bg-surface-container-high text-on-surface font-mono text-xs font-semibold border border-outline-variant shadow-xs">
                      ID: TM-{member.id}
                    </span>
                    {getStatusBadge()}
                  </div>
                  <p className="font-title-lg text-title-lg text-on-surface-variant mb-3">
                    {member.designation || member.department || "Team Member"}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-on-surface-variant font-body-sm text-body-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">
                        location_on
                      </span>
                      <span>{member.address || "Location not set"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">
                        schedule
                      </span>
                      <span>
                        {member.employmentType
                          ? member.employmentType.charAt(0).toUpperCase() +
                            member.employmentType.slice(1)
                          : "Full-Time"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">
                        work_history
                      </span>
                      <span>{Tenure} months tenure</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pb-2">
                <button
                  onClick={() => setIsAssignWorkModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-label-md text-label-md hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    add_task
                  </span>
                  Assign Work
                </button>
                <button
                  onClick={() => setIsAssignClientModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-label-md text-label-md hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    person_add
                  </span>
                  Assign Client
                </button>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    edit
                  </span>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Info Card */}
          <div className="bg-surface rounded-xl border border-outline-variant p-8 shadow-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-6">
              Contact Information
            </h2>
            <ul className="space-y-6">
              <li className="flex items-center gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px] text-primary">
                  mail
                </span>
                <a
                  className="font-body-md text-body-md hover:text-primary transition-colors hover:underline"
                  href={member.email ? `mailto:${member.email}` : "#"}
                >
                  {member.email || "No email on file"}
                </a>
              </li>
              <li className="flex items-center gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px] text-primary">
                  call
                </span>
                <span className="font-body-md text-body-md">
                  {member.number || member.phoneNumber || "No phone on file"}
                </span>
              </li>
              <li className="flex items-center gap-4 text-on-surface-variant">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-primary"
                >
                  <path d="M12.04 4.5C7.34 4.5 3.54 7.83 3.54 12.5c0 2.06 1 3.94 2.62 5.14-.13-.47-.21-.95-.21-1.44 0-.28.03-.57.07-.85.06-.43.14-.86.24-1.27-.91-.27-1.64-.71-2.21-1.32-.08.59-.13 1.2-.13 1.81 0 4.18 3.42 7.6 7.59 7.6h.05c.49 0 .99-.04 1.47-.11.04-.49.07-.98.07-1.47s-.02-.98-.07-1.47c.61.06 1.18.11 1.75.11.56 0 1.13-.06 1.69-.16.01-.32.02-.65.02-.98 0-3.91-.97-7.54-2.57-10.64-.12-.23-.26-.46-.39-.69.28.26.55.56.78.87 2.14-1.29 4.74-2.08 7.57-2.08 4.71 0 8.51 3.59 8.51 8s-3.81 8-8.51 8c-1.51 0-2.91-.37-4.15-.99-.14-.06.29-.49.21-.62-.2-.27-.49-.41-.77-.53-1.84-.95-3.12-2.82-3.12-5.01 0-2.63 1.64-4.85 3.93-5.82.29-.12.61-.23.93-.31.02.22.03.45.03.68zm-3.72 5.69c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25-1.25zm4.98 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25-1.25z" />
                </svg>
                <span className="font-body-md text-body-md">
                  {member.whatsappNumber ? (
                    <a
                      href={`https://wa.me/${member.whatsappNumber.replace(/[^\d]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {member.whatsappNumber}
                    </a>
                  ) : (
                    "No WhatsApp on file"
                  )}
                </span>
              </li>
              <li className="flex items-center gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined text-[24px] text-primary">
                  location_on
                </span>
                <span className="font-body-md text-body-md">
                  {member.address || "No address on file"}
                </span>
              </li>
            </ul>
          </div>

          {/* Internal Details Card */}
          <div className="bg-surface rounded-xl border border-outline-variant p-8 shadow-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-6">
              Internal Details
            </h2>
            <div className="space-y-6">
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                  Department
                </p>
                <p className="font-body-md text-body-md text-on-surface font-medium flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  {member.department || "Not assigned"}
                </p>
              </div>

              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                  Reports To
                </p>
                {member.managerReportTo ? (
                  <span className="font-body-md text-body-md text-on-surface">
                    {member.managerReportTo}
                  </span>
                ) : (
                  <span className="font-body-md text-body-md text-on-surface-variant">
                    No manager assigned
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                    Hire Date
                  </p>
                  <p className="font-body-md text-body-md text-on-surface">
                    {hireDate}
                  </p>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                    Emp. Type
                  </p>
                  <p className="font-body-md text-body-md text-on-surface">
                    {member.employmentType
                      ? member.employmentType.charAt(0).toUpperCase() +
                        member.employmentType.slice(1)
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Identification & Financial Details (Aadhar, Resume, Bank Details) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Identity & Resume Card */}
          <div className="bg-surface rounded-xl border border-outline-variant p-8 shadow-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                badge
              </span>
              Identity &amp; Resume
            </h2>

            <div className="space-y-6">
              {/* Employee ID */}
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                  Employee System ID
                </p>
                <div className="font-mono text-base font-semibold text-on-surface bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant inline-block">
                  TM-{member.id}
                </div>
              </div>

              {/* Aadhar Number */}
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                  Aadhar Number
                </p>
                {member.aadharNumber ? (
                  <p className="font-body-md text-body-md text-on-surface font-mono font-medium tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-emerald-600">
                      verified
                    </span>
                    {member.aadharNumber.replace(/(\d{4})/g, "$1 ").trim()}
                  </p>
                ) : (
                  <p className="font-body-md text-body-md text-on-surface-variant italic">
                    Aadhar number not uploaded
                  </p>
                )}
              </div>

              {/* Resume */}
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
                  Resume Document
                </p>
                {member.resume ? (
                  <a
                    href={member.resume}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`Resume_${member.name.replace(/\s+/g, "_")}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors font-label-md text-label-md"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      description
                    </span>
                    View / Download Resume
                  </a>
                ) : (
                  <p className="font-body-md text-body-md text-on-surface-variant italic">
                    No resume uploaded
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bank Details Card */}
          <div className="bg-surface rounded-xl border border-outline-variant p-8 shadow-sm">
            <h2 className="font-headline-sm text-headline-sm text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                account_balance
              </span>
              Bank Details
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                    Account Holder Name
                  </p>
                  <p className="font-body-md text-body-md text-on-surface font-medium">
                    {bankObj.accountHolderName || member.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                    Bank Name
                  </p>
                  <p className="font-body-md text-body-md text-on-surface font-medium">
                    {bankObj.bankName || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                    Account Number
                  </p>
                  <p className="font-body-md text-body-md text-on-surface font-mono font-medium">
                    {bankObj.accountNumber || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                    IFSC Code
                  </p>
                  <p className="font-body-md text-body-md text-on-surface font-mono font-medium uppercase">
                    {bankObj.ifscCode || "Not provided"}
                  </p>
                </div>
              </div>

              {bankObj.upiId && (
                <div className="pt-2">
                  <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                    UPI ID
                  </p>
                  <p className="font-body-md text-body-md text-on-surface font-mono">
                    {bankObj.upiId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Clients Card */}
        <div className="bg-surface rounded-xl border border-outline-variant p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                Assigned Clients
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Clients managed by {member.name}
              </p>
            </div>
            <button
              onClick={() => setIsAssignClientModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-label-md text-label-md hover:bg-blue-700 transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                person_add
              </span>
              Assign New Client
            </button>
          </div>

          {loadingClients ? (
            <div className="p-6 text-center text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-2xl">
                progress_activity
              </span>
            </div>
          ) : assignedClientsList.length > 0 || clientHandlingNames.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedClientsList.length > 0
                ? assignedClientsList.map((client) => (
                    <div
                      key={client.id ? `client-db-${client.id}` : `client-name-${client.name}`}
                      className="p-4 rounded-xl border border-outline-variant bg-surface hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Link
                            href={`/clients/${client.id}`}
                            className="font-title-lg text-title-lg text-on-surface hover:text-primary transition-colors font-bold"
                          >
                            {client.name}
                          </Link>
                          <span className="px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-700 font-medium border border-blue-100">
                            {client.industry || "Client"}
                          </span>
                        </div>
                        <p className="text-body-sm text-on-surface-variant mb-2">
                          {client.email || client.phoneNumber || "No contact info"}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
                        <span>ID: #{client.id}</span>
                        <Link
                          href={`/clients/${client.id}`}
                          className="text-primary hover:underline font-medium flex items-center gap-0.5"
                        >
                          View Client
                          <span className="material-symbols-outlined text-[14px]">
                            arrow_forward
                          </span>
                        </Link>
                      </div>
                    </div>
                  ))
                : clientHandlingNames.map((clientName, idx) => (
                    <div
                      key={`client-legacy-${idx}-${clientName}`}
                      className="p-4 rounded-xl border border-outline-variant bg-surface"
                    >
                      <h4 className="font-title-md text-title-md text-on-surface font-bold">
                        {clientName}
                      </h4>
                      <p className="text-xs text-on-surface-variant">
                        Assigned Client
                      </p>
                    </div>
                  ))}
            </div>
          ) : (
            <div className="p-6 text-center text-on-surface-variant rounded-lg border border-dashed border-outline-variant">
              <span className="material-symbols-outlined text-3xl mb-2">
                groups
              </span>
              <p>No clients currently assigned to {member.name}.</p>
            </div>
          )}
        </div>

        {/* Assigned Works Card */}
        <div className="bg-surface rounded-xl border border-outline-variant p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                Assigned Works
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Tasks &amp; work items assigned to {member.name}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <Link
                href={`/tasks?assigneeId=${member.id}`}
                className="px-4 py-2 rounded-lg bg-surface border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">
                  view_kanban
                </span>
                View Tasks Board
              </Link>
              <button
                onClick={() => setIsAssignWorkModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-label-md text-label-md hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add_task
                </span>
                Assign New Work
              </button>
            </div>
          </div>

          {loadingTasks ? (
            <div className="p-6 text-center text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-2xl">
                progress_activity
              </span>
            </div>
          ) : displayWorksList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                      Work Item
                    </th>
                    <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                      Client
                    </th>
                    <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                      Status
                    </th>
                    <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="pb-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {displayWorksList.map((work, idx) => (
                    <tr
                      key={work.id ? `task-db-${work.id}` : `work-legacy-${idx}-${work.title}`}
                      className="group hover:bg-surface-container-low transition-colors"
                    >
                      <td className="py-4 font-body-md text-body-md text-on-surface font-medium">
                        <Link
                          href={`/tasks?search=${encodeURIComponent(work.title)}&assigneeId=${member.id}`}
                          className="hover:text-primary transition-colors inline-flex items-center gap-1.5 font-semibold"
                          title="Click to view on Tasks Board"
                        >
                          {work.title}
                          <span className="material-symbols-outlined text-[15px] opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                            open_in_new
                          </span>
                        </Link>
                      </td>
                      <td className="py-4 font-body-md text-body-md text-on-surface-variant">
                        {work.clientName || clientHandlingNames[idx] || "N/A"}
                      </td>
                      <td className="py-4">
                        {renderStatusBadge(work.status)}
                      </td>
                      <td className="py-4 font-body-md text-body-md text-on-surface-variant font-mono text-sm">
                        {formatDueDate(work.dueDate)}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/tasks?search=${encodeURIComponent(work.title)}&assigneeId=${member.id}`}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-gray-100 transition-colors"
                            title="View on Tasks Board"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              open_in_new
                            </span>
                          </Link>
                          <button
                            onClick={() => handleOpenEditTask(work)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-gray-100 transition-colors"
                            title="Edit Work Item"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleDeleteTask(work)}
                            disabled={deletingTaskId === (work.id || work.title)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete Work Item"
                          >
                            {deletingTaskId === (work.id || work.title) ? (
                              <span className="material-symbols-outlined text-[18px] animate-spin">
                                progress_activity
                              </span>
                            ) : (
                              <span className="material-symbols-outlined text-[18px]">
                                delete
                              </span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-on-surface-variant rounded-lg border border-dashed border-outline-variant">
              <span className="material-symbols-outlined text-3xl mb-2">
                assignment
              </span>
              <p>No works currently assigned to {member.name}.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Member Modal */}
      {isEditModalOpen && (
        <EditMemberModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          member={member}
          onSuccess={() => {
            setIsEditModalOpen(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Modal: Assign Work */}
      {isAssignWorkModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsAssignWorkModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">
                  add_task
                </span>
                Assign Work to {member.name}
              </h3>
              <button
                onClick={() => setIsAssignWorkModalOpen(false)}
                className="text-secondary hover:text-primary transition-colors p-1"
              >
                <span className="material-symbols-outlined text-[24px]">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleAssignWorkSubmit} className="space-y-4">
              <div>
                <label className="block font-label-sm text-label-sm text-secondary mb-1">
                  Work / Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={workForm.title}
                  onChange={(e) =>
                    setWorkForm({ ...workForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                  placeholder="e.g. Design August Social Media Calendar"
                />
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-secondary mb-1">
                  Associated Client (Optional)
                </label>
                <select
                  value={workForm.clientId}
                  onChange={(e) =>
                    setWorkForm({ ...workForm, clientId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                >
                  <option value="">Select Client (Optional)</option>
                  {allClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-sm text-label-sm text-secondary mb-1">
                    Status
                  </label>
                  <select
                    value={workForm.status}
                    onChange={(e) =>
                      setWorkForm({ ...workForm, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-secondary mb-1">
                    Priority
                  </label>
                  <select
                    value={workForm.priority}
                    onChange={(e) =>
                      setWorkForm({ ...workForm, priority: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-secondary mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={workForm.dueDate}
                  onChange={(e) =>
                    setWorkForm({ ...workForm, dueDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                />
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-secondary mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={workForm.description}
                  onChange={(e) =>
                    setWorkForm({ ...workForm, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                  placeholder="Task details and instructions..."
                />
              </div>

              <div className="pt-3 border-t border-[#E5E5E7] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignWorkModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E5E7] rounded-lg text-secondary font-label-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignWorkLoading}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-label-md hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {assignWorkLoading ? (
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                  ) : null}
                  Assign Work
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Work / Task */}
      {isEditTaskModalOpen && editingTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setIsEditTaskModalOpen(false);
            setEditingTask(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  edit_square
                </span>
                Edit Work Item
              </h3>
              <button
                onClick={() => {
                  setIsEditTaskModalOpen(false);
                  setEditingTask(null);
                }}
                className="text-secondary hover:text-primary transition-colors p-1"
              >
                <span className="material-symbols-outlined text-[24px]">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleEditTaskSubmit} className="space-y-4">
              <div>
                <label className="block font-label-sm text-label-sm text-secondary mb-1">
                  Work / Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                  placeholder="Task title"
                />
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-secondary mb-1">
                  Associated Client
                </label>
                <select
                  value={editingTask.clientId}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, clientId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                >
                  <option value="">Select Client (Optional)</option>
                  {allClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-sm text-label-sm text-secondary mb-1">
                    Status
                  </label>
                  <select
                    value={editingTask.status}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-secondary mb-1">
                    Priority
                  </label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, priority: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-secondary mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editingTask.dueDate}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, dueDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                />
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-secondary mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingTask.description}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                  placeholder="Task details and instructions..."
                />
              </div>

              <div className="pt-3 border-t border-[#E5E5E7] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditTaskModalOpen(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 border border-[#E5E5E7] rounded-lg text-secondary font-label-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editTaskLoading}
                  className="px-5 py-2 bg-primary text-white rounded-lg font-label-md hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {editTaskLoading ? (
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                  ) : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Client */}
      {isAssignClientModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsAssignClientModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">
                  person_add
                </span>
                Assign Client to {member.name}
              </h3>
              <button
                onClick={() => setIsAssignClientModalOpen(false)}
                className="text-secondary hover:text-primary transition-colors p-1"
              >
                <span className="material-symbols-outlined text-[24px]">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleAssignClientSubmit} className="space-y-4">
              <div>
                <label className="block font-label-sm text-label-sm text-secondary mb-1">
                  Select Client *
                </label>
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                >
                  <option value="">Choose a client...</option>
                  {allClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}{" "}
                      {client.industry ? `(${client.industry})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[#E5E5E7] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignClientModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E5E7] rounded-lg text-secondary font-label-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignClientLoading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg font-label-md hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {assignClientLoading ? (
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      progress_activity
                    </span>
                  ) : null}
                  Assign Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
