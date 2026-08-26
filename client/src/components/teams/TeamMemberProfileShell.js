"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { parseArrayField } from "@/services/teamService";
import { updateTeamMember } from "@/redux/slices/teamSlice";
import { fetchClients, updateClient } from "@/redux/slices/clientsSlice";
import { createTask, fetchTasksByAssignee, updateTask, deleteTask } from "@/redux/slices/tasksSlice";
import EditMemberModal from "@/components/teams/EditMemberModal";
import TeamMemberProfileHeader from "@/components/teams/TeamMemberProfileHeader";
import ContactInfoCard from "@/components/teams/ContactInfoCard";
import InternalDetailsCard from "@/components/teams/InternalDetailsCard";
import IdentityResumeCard from "@/components/teams/IdentityResumeCard";
import BankDetailsCard from "@/components/teams/BankDetailsCard";
import AssignedClientsCard from "@/components/teams/AssignedClientsCard";
import AssignedWorksCard from "@/components/teams/AssignedWorksCard";
import AssignWorkModal from "@/components/teams/AssignWorkModal";
import EditWorkModal from "@/components/teams/EditWorkModal";
import AssignClientModal from "@/components/teams/AssignClientModal";

const BLANK_WORK_FORM = {
  title: "",
  clientId: "",
  clientName: "",
  status: "in_progress",
  priority: "medium",
  dueDate: "",
  description: "",
};

export default function TeamMemberProfileShell({ member, onRefresh }) {
  const dispatch = useDispatch();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignWorkModalOpen, setIsAssignWorkModalOpen] = useState(false);
  const [isAssignClientModalOpen, setIsAssignClientModalOpen] = useState(false);

  // All clients for selection
  const allClients = useSelector((state) => state.clients.clients);
  const loadingClients = useSelector((state) => state.clients.loading);

  // Member Tasks from DB
  const memberTasks = useSelector((state) => state.tasks.memberTasks);
  const loadingTasks = useSelector((state) => state.tasks.loadingMemberTasks);

  // Assign Work Form State
  const [workForm, setWorkForm] = useState(BLANK_WORK_FORM);
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
  let bankObj = { bankName: "", accountNumber: "", ifscCode: "", accountHolderName: "", upiId: "" };
  if (member.bankDetails) {
    try {
      const parsed = typeof member.bankDetails === "string" ? JSON.parse(member.bankDetails) : member.bankDetails;
      if (typeof parsed === "object" && parsed !== null) {
        bankObj = { ...bankObj, ...parsed };
      }
    } catch {
      bankObj.bankName = member.bankDetails;
    }
  }

  // Fetch Member Tasks from API
  const loadMemberTasks = useCallback(() => {
    if (!member?.id) return Promise.resolve();
    // dispatch() on a createAsyncThunk resolves with the fulfilled/rejected
    // action rather than throwing; errors surface via state.tasks.error.
    return dispatch(fetchTasksByAssignee(member.id));
  }, [dispatch, member.id]);

  useEffect(() => {
    loadMemberTasks();
  }, [loadMemberTasks]);

  // Merge database tasks with raw assignedWorks strings for complete view
  const displayWorksList = React.useMemo(() => {
    const list = [...memberTasks];
    assignedWorksRaw.forEach((work) => {
      const workTitle = typeof work === "string" ? work : work.title || work.name;
      if (workTitle) {
        const exists = list.some((t) => t.title?.toLowerCase() === workTitle.toLowerCase());
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
    if (member?.id) {
      dispatch(fetchClients({ limit: 100 }));
    }
  }, [dispatch, member?.id, member?.clientHandling]);

  const assignedClientsList = React.useMemo(() => {
    return allClients.filter((c) => {
      const isManagedBy = String(c.clientManagedBy) === String(member.id);
      const isNameInHandling = clientHandlingNames.some((name) => name.toLowerCase() === c.name.toLowerCase());
      return isManagedBy || isNameInHandling;
    });
  }, [allClients, clientHandlingNames, member.id]);

  const tenureMonths =
    member.hireDate && !isNaN(new Date(member.hireDate))
      ? Math.floor((new Date().getTime() - new Date(member.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 0;

  const hireDateFormatted = member.hireDate
    ? new Date(member.hireDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "N/A";

  // Handle Assign Work Submission
  const handleAssignWorkSubmit = async (e) => {
    e.preventDefault();
    if (!workForm.title.trim()) return;

    setAssignWorkLoading(true);
    try {
      await dispatch(
        createTask({
          title: workForm.title,
          description: workForm.description || null,
          status: workForm.status || "in_progress",
          priority: workForm.priority || "medium",
          clientId: workForm.clientId ? parseInt(workForm.clientId) : null,
          assignees: [member.id],
          dueDate: workForm.dueDate || null,
        })
      ).unwrap();

      const updatedWorks = [...assignedWorksRaw];
      if (!updatedWorks.includes(workForm.title)) {
        updatedWorks.push(workForm.title);
        await dispatch(
          updateTeamMember({ id: member.id, memberData: { assignedWorks: JSON.stringify(updatedWorks) } })
        ).unwrap();
      }

      setIsAssignWorkModalOpen(false);
      setWorkForm(BLANK_WORK_FORM);

      await loadMemberTasks();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error assigning work:", err);
      alert("Failed to assign work. Please try again.");
    } finally {
      setAssignWorkLoading(false);
    }
  };

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

  const handleEditTaskSubmit = async (e) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;

    setEditTaskLoading(true);
    try {
      if (editingTask.id) {
        await dispatch(
          updateTask({
            id: editingTask.id,
            taskData: {
              title: editingTask.title,
              status: editingTask.status,
              priority: editingTask.priority,
              clientId: editingTask.clientId ? parseInt(editingTask.clientId) : null,
              dueDate: editingTask.dueDate || null,
              description: editingTask.description || null,
            },
          })
        ).unwrap();
      } else {
        const updated = assignedWorksRaw.map((item) => {
          const t = typeof item === "string" ? item : item.title || item.name;
          return t === editingTask.originalTitle ? editingTask.title : item;
        });
        await dispatch(
          updateTeamMember({ id: member.id, memberData: { assignedWorks: JSON.stringify(updated) } })
        ).unwrap();
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

  const handleDeleteTask = async (taskItem) => {
    if (!window.confirm(`Are you sure you want to delete work "${taskItem.title}"?`)) return;

    setDeletingTaskId(taskItem.id || taskItem.title);
    try {
      if (taskItem.id) {
        await dispatch(deleteTask(taskItem.id)).unwrap();
      } else {
        const updatedWorks = assignedWorksRaw.filter((item) => {
          const t = typeof item === "string" ? item : item.title || item.name;
          return t !== taskItem.title;
        });
        await dispatch(
          updateTeamMember({ id: member.id, memberData: { assignedWorks: JSON.stringify(updatedWorks) } })
        ).unwrap();
      }

      await loadMemberTasks();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error deleting task:", err);
      alert(err?.message || err || "Failed to delete task. Please try again.");
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleAssignClientSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientId) return;

    setAssignClientLoading(true);
    try {
      const selectedClient = allClients.find((c) => String(c.id) === String(selectedClientId));

      await dispatch(updateClient({ id: selectedClientId, clientData: { clientManagedBy: member.id } })).unwrap();

      let updatedClientNames = [...clientHandlingNames];
      if (selectedClient && !updatedClientNames.some((name) => name.toLowerCase() === selectedClient.name.toLowerCase())) {
        updatedClientNames.push(selectedClient.name);
        await dispatch(
          updateTeamMember({ id: member.id, memberData: { clientHandling: JSON.stringify(updatedClientNames) } })
        ).unwrap();
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
      <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
        <TeamMemberProfileHeader
          member={member}
          tenureMonths={tenureMonths}
          onAssignWork={() => setIsAssignWorkModalOpen(true)}
          onAssignClient={() => setIsAssignClientModalOpen(true)}
          onEditProfile={() => setIsEditModalOpen(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar — static reference information */}
          <div className="lg:col-span-4 space-y-6">
            <ContactInfoCard member={member} />
            <InternalDetailsCard member={member} hireDate={hireDateFormatted} />
            <IdentityResumeCard member={member} />
            <BankDetailsCard bankObj={bankObj} member={member} />
          </div>

          {/* Main content — active, day-to-day data */}
          <div className="lg:col-span-8 space-y-6">
            <AssignedClientsCard
              memberName={member.name}
              assignedClientsList={assignedClientsList}
              clientHandlingNames={clientHandlingNames}
              loadingClients={loadingClients}
              onAssignClient={() => setIsAssignClientModalOpen(true)}
            />

            <AssignedWorksCard
              memberId={member.id}
              memberName={member.name}
              displayWorksList={displayWorksList}
              loadingTasks={loadingTasks}
              clientHandlingNames={clientHandlingNames}
              deletingTaskId={deletingTaskId}
              onAssignWork={() => setIsAssignWorkModalOpen(true)}
              onEditTask={handleOpenEditTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        </div>
      </div>

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

      <AssignWorkModal
        isOpen={isAssignWorkModalOpen}
        onClose={() => setIsAssignWorkModalOpen(false)}
        memberName={member.name}
        allClients={allClients}
        workForm={workForm}
        onChange={setWorkForm}
        onSubmit={handleAssignWorkSubmit}
        loading={assignWorkLoading}
      />

      <EditWorkModal
        isOpen={isEditTaskModalOpen}
        onClose={() => {
          setIsEditTaskModalOpen(false);
          setEditingTask(null);
        }}
        allClients={allClients}
        editingTask={editingTask}
        onChange={setEditingTask}
        onSubmit={handleEditTaskSubmit}
        loading={editTaskLoading}
      />

      <AssignClientModal
        isOpen={isAssignClientModalOpen}
        onClose={() => setIsAssignClientModalOpen(false)}
        memberName={member.name}
        allClients={allClients}
        selectedClientId={selectedClientId}
        onChange={setSelectedClientId}
        onSubmit={handleAssignClientSubmit}
        loading={assignClientLoading}
      />
    </div>
  );
}
