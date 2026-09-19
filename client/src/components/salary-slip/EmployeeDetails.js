"use client";
import React from "react";
import TeamMemberSelectDropdown from "./TeamMemberSelectDropdown";

// Same two-column layout as invoices/Billingdetails.js: left is "who this
// document is for" (picker + resolved identity), right is supporting detail
// specific to the document type (bank details here, engagement title there).
export default function EmployeeDetails({ members, isMembersLoading, selectedMemberId, onMemberChange }) {
  const selectedMember = members.find((m) => String(m.id) === String(selectedMemberId));

  return (
    <section className="mt-9 grid grid-cols-2 gap-6 border-y border-[#DEDBD6] py-5">
      <div>
        <p className="font-display text-[9.5px] font-700 uppercase tracking-[.24em] text-[#6E6A65]">
          Paid to
        </p>

        {/*
          data-html2canvas-ignore: on-screen editing control only — the
          exported PDF shows the selected team member's name/role just once,
          in the plain text block below (see Billingdetails.js for the same
          reasoning with the invoice client picker).
        */}
        <div className="mt-2" data-html2canvas-ignore="true">
          <label className="sr-only" htmlFor="paidToMember">
            Select team member
          </label>
          <TeamMemberSelectDropdown
            members={members}
            isMembersLoading={isMembersLoading}
            selectedMemberId={selectedMemberId}
            onMemberChange={onMemberChange}
          />
        </div>

        <div className="mt-2">
          {selectedMember ? (
            <>
              <p className="font-display text-[15px] font-700">
                {selectedMember.name}
              </p>
              <p className="mt-0.5 text-[10.5px] text-[#6E6A65]">
                {[selectedMember.designation, selectedMember.department].filter(Boolean).join(" · ") || "—"}
              </p>
              {selectedMember.email && (
                <p className="mt-0.5 text-[10.5px] text-[#6E6A65]">{selectedMember.email}</p>
              )}
            </>
          ) : (
            <p className="text-[10.5px] text-[#6E6A65]">
              Select a team member to autofill their details.
            </p>
          )}
        </div>
      </div>

      <div>
        <p className="font-display text-[9.5px] font-700 uppercase tracking-[.24em] text-[#6E6A65]">
          Bank Details
        </p>
        <p className="mt-2 whitespace-pre-line text-[10.5px] leading-[1.7] text-[#6E6A65]">
          {selectedMember
            ? selectedMember.bankDetails || "No bank details on file for this employee."
            : "Select a team member to show their bank details."}
        </p>
      </div>
    </section>
  );
}
