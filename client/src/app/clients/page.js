"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClients, exportClients, deleteClient, clearMessages } from "@/redux/slices/clientsSlice";
import { fetchTeamMembers } from "@/services/teamService";
import ClientsToolbar from "@/components/clients/ClientsToolbar";
import ClientsFilters from "@/components/clients/ClientsFilters";
import ClientsTable from "@/components/clients/ClientsTable";
import ClientsPagination from "@/components/clients/ClientsPagination";
import AddEditClientModal from "@/components/clients/AddEditClientModal";

export default function ClientsPage() {
  const dispatch = useDispatch();
  const { clients, loading, error, successMessage, totalPages, totalItems } = useSelector((state) => state.clients);

  const [teamMembers, setTeamMembers] = useState([]);

  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [managedBy, setManagedBy] = useState("");
  const [healthMin, setHealthMin] = useState("");
  const [healthMax, setHealthMax] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [editingClient, setEditingClient] = useState(null);

  const queryParams = { page, limit, search, sortBy, sortOrder, industry, managedBy, healthMin, healthMax };

  useEffect(() => {
    dispatch(fetchClients(queryParams));
  }, [dispatch, page, limit, search, sortBy, sortOrder, industry, managedBy, healthMin, healthMax]);

  useEffect(() => {
    fetchTeamMembers()
      .then((members) => setTeamMembers(members || []))
      .catch((err) => console.error("Error fetching team members:", err));
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => dispatch(clearMessages()), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  const teamMemberMap = teamMembers.reduce((acc, member) => {
    acc[member.id] = member;
    return acc;
  }, {});

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleExport = () => {
    dispatch(exportClients({ search, industry, managedBy, healthMin, healthMax }));
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      await dispatch(deleteClient(id));
      dispatch(fetchClients(queryParams));
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setShowAddModal(true);
  };

  const handleAddNew = () => {
    setEditingClient(null);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingClient(null);
  };

  const handleModalSuccess = () => {
    handleCloseModal();
    dispatch(fetchClients({ ...queryParams, page: 1 }));
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(column);
      setSortOrder("ASC");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="bg-surface dark:bg-surface h-16 w-full sticky top-0 z-40 border-b border-outline-variant shadow-sm flex justify-between items-center px-gutter shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="md:hidden">
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
          <div className="relative w-full max-w-md hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container border-none rounded-lg text-body-sm font-body-sm focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant"
              placeholder="Search..."
              type="text"
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined">help</span>
          </button>
          <button className="hidden md:block font-label-md text-label-md font-bold text-on-surface-variant hover:text-primary transition-colors">Support</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-container-margin">
        <ClientsToolbar onExport={handleExport} onAddClient={handleAddNew} />

        <ClientsFilters
          search={search}
          onSearchChange={handleSearch}
          industry={industry}
          onIndustryChange={handleFilterChange(setIndustry)}
          managedBy={managedBy}
          onManagedByChange={handleFilterChange(setManagedBy)}
          healthMin={healthMin}
          onHealthMinChange={handleFilterChange(setHealthMin)}
          healthMax={healthMax}
          onHealthMaxChange={handleFilterChange(setHealthMax)}
          teamMembers={teamMembers}
        />

        {(successMessage || error) && (
          <div className={`mt-4 p-4 rounded-lg flex items-center justify-between ${successMessage ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            <span>{successMessage || error}</span>
            <button onClick={() => dispatch(clearMessages())} className="text-lg font-bold leading-none">×</button>
          </div>
        )}

        <ClientsTable
          clients={clients}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDelete}
          teamMemberMap={teamMemberMap}
        />

        <ClientsPagination
          page={page}
          limit={limit}
          totalItems={totalItems}
          totalPages={totalPages}
          loading={loading}
          onPageChange={setPage}
        />
      </main>

      <AddEditClientModal
        isOpen={showAddModal}
        client={editingClient}
        teamMembers={teamMembers}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
