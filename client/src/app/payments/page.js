"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import RequireAdmin from "@/components/auth/RequireAdmin";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import PaymentsFilters from "@/components/payments/PaymentsFilters";
import ClientPaymentsTable from "@/components/payments/ClientPaymentsTable";
import ClientPaymentDrawer from "@/components/payments/ClientPaymentDrawer";
import RecordPaymentModal from "@/components/payments/RecordPaymentModal";
import RecurringBillingPanel from "@/components/payments/RecurringBillingPanel";
import PaymentsReportsPanel from "@/components/payments/PaymentsReportsPanel";
import Pagination from "@/components/ui/Pagination";
import { fetchPaymentsOverview, fetchClientPayments, invalidatePaymentsCaches } from "@/redux/slices/paymentsSlice";
import { formatRupees } from "@/lib/formatCurrency";

const LIMIT = 24;

// "2026-10" -> { from: "2026-10-01", to: "2026-10-31" }
const monthToRange = (month) => {
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
};

export default function PaymentsPage() {
  const dispatch = useDispatch();
  const { overview, loadingOverview, clients, loadingClients, pagination } = useSelector((s) => s.payments);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [month, setMonth] = useState(""); // "" = all time, "YYYY-MM", or "custom"
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleMonthChange = (value) => {
    setMonth(value);
    setPage(1);
    if (!value || value === "custom") {
      if (!value) {
        setDateFrom("");
        setDateTo("");
      }
      return;
    }
    const { from, to } = monthToRange(value);
    setDateFrom(from);
    setDateTo(to);
  };

  const handleCustomDate = (setter) => (value) => {
    setter(value);
    setMonth("custom");
    setPage(1);
  };
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("ASC");
  const [page, setPage] = useState(1);

  const [drawerClientId, setDrawerClientId] = useState(null);
  const [drawerOptions, setDrawerOptions] = useState({});
  const [quickPaymentClient, setQuickPaymentClient] = useState(null);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchPaymentsOverview({ dateFrom, dateTo }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  const tableParams = {
    search: search || undefined,
    status: status || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy,
    sortDir,
    page,
    limit: LIMIT,
  };

  useEffect(() => {
    dispatch(fetchClientPayments(tableParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, dateFrom, dateTo, sortBy, sortDir, page]);

  const refreshTable = () => {
    invalidatePaymentsCaches();
    dispatch(fetchClientPayments(tableParams));
    dispatch(fetchPaymentsOverview({ dateFrom, dateTo }));
  };

  const periodLabel = month && month !== "custom" ? new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : dateFrom || dateTo ? "Selected range" : null;

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(column);
      setSortDir("DESC");
    }
    setPage(1);
  };

  const openDrawer = (row, options = {}) => {
    setDrawerClientId(row.id);
    setDrawerOptions(options);
  };

  const metrics = overview
    ? [
        { title: "Total Clients", value: String(overview.totalClients), icon: "group" },
        { title: "Total Billed", value: formatRupees(overview.totalBilled), icon: "receipt_long", change: periodLabel || "All time", changeType: "neutral" },
        { title: "Total Collected", value: formatRupees(overview.totalCollected), icon: "payments", change: periodLabel || "All time", changeType: "neutral" },
        { title: "Outstanding", value: formatRupees(overview.totalOutstanding), icon: "pending_actions" },
        { title: "Overdue", value: formatRupees(overview.overdueAmount), icon: "warning", changeType: overview.overdueAmount > 0 ? "negative" : "neutral" },
        { title: "Advance Balance", value: formatRupees(overview.advanceBalance), icon: "account_balance_wallet" },
        { title: "Net Receivable", value: formatRupees(overview.netReceivable), icon: "trending_up" },
      ]
    : [];

  return (
    <RequireAdmin>
      <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface">Payments</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Billing, invoices, collections, dues, and advances across every client.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refreshTable}
              disabled={loadingClients || loadingOverview}
              title="Reload the latest figures, including invoices just synced from the Invoice Builder"
              className="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-variant transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-[18px] ${loadingClients || loadingOverview ? "animate-spin" : ""}`}>refresh</span>
              Refresh
            </button>
            <button onClick={() => setRecurringOpen(true)} className="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-variant transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">autorenew</span>
              Recurring Invoices
            </button>
            <button onClick={() => setReportsOpen(true)} className="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-variant transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Reports
            </button>
          </div>
        </div>

        <div className="mb-6">
          <MetricsGrid metrics={metrics} loading={loadingOverview} />
        </div>

        <PaymentsFilters
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          status={status}
          onStatusChange={(v) => { setStatus(v); setPage(1); }}
          month={month}
          onMonthChange={handleMonthChange}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={handleCustomDate(setDateFrom)}
          onDateToChange={handleCustomDate(setDateTo)}
        />

        <ClientPaymentsTable
          rows={clients}
          loading={loadingClients}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          onSelectClient={(row) => openDrawer(row)}
          onRecordPayment={(row) => setQuickPaymentClient(row)}
          onNewInvoice={(row) => openDrawer(row, { initialTab: "Invoices", autoAddInvoice: true })}
        />

        <Pagination page={page} limit={LIMIT} totalItems={pagination.total} totalPages={pagination.totalPages} loading={loadingClients} onPageChange={setPage} />
      </main>

      {drawerClientId && (
        <ClientPaymentDrawer
          clientId={drawerClientId}
          initialTab={drawerOptions.initialTab}
          autoAddInvoice={drawerOptions.autoAddInvoice}
          onClose={() => {
            setDrawerClientId(null);
            setDrawerOptions({});
          }}
        />
      )}

      {quickPaymentClient && (
        <RecordPaymentModal clientId={quickPaymentClient.id} clientName={quickPaymentClient.name} onClose={() => setQuickPaymentClient(null)} onRecorded={refreshTable} />
      )}
      {recurringOpen && <RecurringBillingPanel onClose={() => setRecurringOpen(false)} onGenerated={refreshTable} />}
      {reportsOpen && <PaymentsReportsPanel onClose={() => setReportsOpen(false)} />}
    </RequireAdmin>
  );
}
