"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTeamMembers } from "@/redux/slices/teamSlice";

// TeamMember.bankDetails is stored as a JSON string ({bankName,
// accountNumber, ifscCode, accountHolderName, upiId} — see
// TeamMemberProfileShell.js/BankDetailsCard.js for the same shape). Falls
// back to treating the raw string as a bank name, same as the team profile
// page does, for any pre-JSON free-text values still on old records.
const parseBankDetails = (raw) => {
  const empty = { bankName: "", accountNumber: "", ifscCode: "", accountHolderName: "", upiId: "" };
  if (!raw) return empty;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (typeof parsed === "object" && parsed !== null) return { ...empty, ...parsed };
    return empty;
  } catch {
    return { ...empty, bankName: raw };
  }
};

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
      bankDetails: parseBankDetails(m.bankDetails),
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
