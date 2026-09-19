"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTeamMembers } from "@/redux/slices/teamSlice";

// Same shape as useInvoiceClients.js, backed by the team roster instead of
// the client list.
export function useSalarySlipTeamMembers({ onMemberSelected } = {}) {
  const dispatch = useDispatch();
  const rawMembers = useSelector((state) => state.team.teamMembers);
  const isMembersLoading = useSelector((state) => state.team.loading);
  const [selectedMemberId, setSelectedMemberId] = useState("");

  useEffect(() => {
    dispatch(fetchTeamMembers());
  }, [dispatch]);

  const members = useMemo(() => {
    const arr = Array.isArray(rawMembers) ? rawMembers : [];
    return arr.map((m) => ({
      id: m.id,
      name: m.name || "",
      email: m.email || "",
      designation: m.designation || "",
      department: m.department || "",
      bankDetails: m.bankDetails || "",
    }));
  }, [rawMembers]);

  const handleMemberChange = useCallback(
    (id) => {
      setSelectedMemberId(id);
      if (id && onMemberSelected) onMemberSelected();
    },
    [onMemberSelected]
  );

  const selectedMember = useMemo(
    () => members.find((m) => String(m.id) === String(selectedMemberId)) || null,
    [members, selectedMemberId]
  );

  return { members, isMembersLoading, selectedMemberId, selectedMember, handleMemberChange };
}
