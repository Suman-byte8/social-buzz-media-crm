"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClients, exportClients, deleteClient, clearMessages } from "@/redux/slices/clientsSlice";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";

export default function ClientsPage() {
  const dispatch = useDispatch();
  const { clients, loading, error, successMessage, totalPages, currentPage } = useSelector((state) => state.clients);
  
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [healthMin, setHealthMin] = useState("");
  const [healthMax, setHealthMax] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [editingClient, setEditingClient] = useState(null);

  useEffect(() => {
    dispatch(fetchClients({ page, limit, search, sortBy, sortOrder, industry, healthMin, healthMax }));
  }, [dispatch, page, limit, search, sortBy, sortOrder, industry, healthMin, healthMax]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => dispatch(clearMessages()), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleExport = () => {
    dispatch(exportClients({ search, industry, healthMin, healthMax }));
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      await dispatch(deleteClient(id));
      dispatch(fetchClients({ page, limit, search, sortBy, sortOrder, industry, healthMin, healthMax }));
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingClient(null);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(column);
      setSortOrder("ASC");
    }
  };

  const getHealthColor = (health) => {
    if (health >= 80) return "green";
    if (health >= 50) return "amber";
    return "red";
  };

  const getHealthLabel = (health) => {
    if (health >= 80) return "Excellent";
    if (health >= 50) return "Fair";
    return "At Risk";
  };

  const formatServices = (services) => {
    if (!services) return "";
    const arr = typeof services === "string" ? services.split(",").filter(Boolean) : services;
    return arr.slice(0, 3).map((s) => (
      <span key={s} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs border border-gray-200">
        {s.trim()}
      </span>
    ));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* TopNavBar */}
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
              className="w-full pl-10 pr-4 py-2 bg-[#F5F5F7] border-none rounded-lg text-body-sm font-body-sm focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant"
              placeholder="Search..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined" data-icon="help">help</span>
          </button>
          <button className="hidden md:block font-label-md text-label-md font-bold text-on-surface-variant hover:text-primary transition-colors">Support</button>
          <div className="w-8 h-8 rounded-full overflow-hidden cursor-pointer active:opacity-80 border border-outline-variant">
            <img alt="User Avatar" className="w-full h-full object-cover" data-alt="A professional headshot of a business user in a modern office environment, soft natural lighting, high quality." src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" />
          </div>
        </div>
      </header>
      
      {/* Main Canvas */}
      <main className="flex-1 overflow-y-auto p-4 md:p-container-margin">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-stack-lg gap-4">
          <div>
            <h2 className="font-display-lg text-display-lg text-on-surface">Clients</h2>
            <p className="font-body-sm text-body-sm text-secondary mt-1">Manage your agency accounts and monitor health scores.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="flex items-center gap-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-gray-50 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export
            </button>
            <button onClick={() => { setEditingClient(null); setShowAddModal(true); }} className="flex items-center gap-2 bg-[#E8262A] text-white px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Client
            </button>
          </div>
        </div>
        
        {/* Filters & Search Bar */}
        <div className="bg-white rounded-t-xl p-card-padding border border-b-0 border-[#E5E5E7] shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E5E7] rounded-lg text-body-sm font-body-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none placeholder:text-on-surface-variant"
              placeholder="Search clients..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <select value={industry} onChange={(e) => { setIndustry(e.target.value); setPage(1); }} className="border border-[#E5E5E7] rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none">
              <option value="">All Industries</option>
              <option value="SaaS">SaaS</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Education">Education</option>
              <option value="Real Estate">Real Estate</option>
            </select>
            <select value={healthMin} onChange={(e) => { setHealthMin(e.target.value); setPage(1); }} className="border border-[#E5E5E7] rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none">
              <option value="">Min Health</option>
              <option value="0">0%</option>
              <option value="25">25%</option>
              <option value="50">50%</option>
              <option value="75">75%</option>
            </select>
            <select value={healthMax} onChange={(e) => { setHealthMax(e.target.value); setPage(1); }} className="border border-[#E5E5E7] rounded-lg px-3 py-2 text-body-sm font-body-sm bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none">
              <option value="">Max Health</option>
              <option value="100">100%</option>
              <option value="75">75%</option>
              <option value="50">50%</option>
              <option value="25">25%</option>
            </select>
            <button className="flex items-center gap-1 text-secondary hover:text-primary transition-colors text-body-sm font-body-sm whitespace-nowrap px-2">
              <span className="material-symbols-outlined text-[18px]">filter_list</span> More Filters
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {(successMessage || error) && (
          <div className={`mb-4 p-4 rounded-lg flex items-center justify-between ${successMessage ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            <span>{successMessage || error}</span>
            <button onClick={() => dispatch(clearMessages())} className="text-lg font-bold leading-none">×</button>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-b-xl border border-[#E5E5E7] shadow-[0_2px_4px_rgba(0,0,0,0.05)] overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
              <tr>
                {[
                  { key: "name", label: "Client Name" },
                  { key: "industry", label: "Industry" },
                  { key: "servicesSelected", label: "Services" },
                  { key: "clientManagedBy", label: "Account Manager" },
                  { key: "clientHealth", label: "Health" },
                  { key: "id", label: "Actions" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.key !== "id" && handleSort(col.key)}
                    className={`py-3 px-4 font-label-sm text-label-sm text-secondary uppercase tracking-wider cursor-pointer select-none ${col.key !== "id" ? "hover:bg-gray-100" : ""} ${col.key === "id" ? "text-right" : ""}`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortBy === col.key && (
                        <span className="material-symbols-outlined text-[16px]">{sortOrder === "ASC" ? "arrow_upward" : "arrow_downward"}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-body-sm font-body-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-secondary">Loading clients...</td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-secondary">No clients found</td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors group">
                    <td className="py-4 px-4">
                      <Link href={`/clients/${client.id}`} className="block">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg border border-[#E5E5E7] flex items-center justify-center bg-white overflow-hidden shrink-0">
                            {client.avatar ? (
                              <img alt={`${client.name} Logo`} className="w-full h-full object-cover" src={client.avatar} />
                            ) : (
                              <div className="font-bold text-gray-400">{client.name.charAt(0)}</div>
                            )}
                          </div>
                          <div>
                            <p className="font-title-lg text-title-lg text-on-surface">{client.name}</p>
                            <p className="text-secondary text-xs mt-0.5">ID: {client.id}</p>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-secondary">{client.industry || "—"}</td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5">{formatServices(client.servicesSelected)}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                          {client.clientManagedBy ? `TM${client.clientManagedBy}` : "—"}
                        </div>
                        <span className="text-on-surface">{client.clientManagedBy ? `Team Member ${client.clientManagedBy}` : "Unassigned"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge 
                        status={getHealthLabel(client.clientHealth)} 
                        color={getHealthColor(client.clientHealth)}
                        showDot 
                      />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-secondary hover:text-primary transition-colors p-1"
                          title="Edit Client"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-secondary hover:text-red-600 transition-colors p-1"
                          title="Delete Client"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                        <Link href={`/clients/${client.id}`} className="text-secondary hover:text-primary transition-colors p-1" title="View Profile">
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 border-t border-[#F0F0F0] flex items-center justify-between sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-secondary">
                  Showing <span className="font-medium text-on-surface">{((page - 1) * limit) + 1}</span> to{" "}
                  <span className="font-medium text-on-surface">{Math.min(page * limit, clients.length + (page - 1) * limit)}</span> of{" "}
                  <span className="font-medium text-on-surface">{totalPages * limit}</span> results
                </p>
              </div>
              <div>
                <nav aria-label="Pagination" className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-[#E5E5E7] bg-white text-sm font-medium text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum
                            ? "z-10 bg-primary-container text-white border-primary-container"
                            : "bg-white border-[#E5E5E7] text-secondary hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-[#E5E5E7] bg-white text-sm font-medium text-secondary hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="font-title-lg text-title-lg text-on-surface">
                {editingClient ? "Edit Client" : "Add New Client"}
              </h3>
              <button onClick={handleCloseModal} className="text-secondary hover:text-primary transition-colors p-1">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <AddClientForm
              client={editingClient}
              onClose={handleCloseModal}
              onSuccess={() => {
                handleCloseModal();
                dispatch(fetchClients({ page: 1, limit, search, sortBy, sortOrder, industry, healthMin, healthMax }));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AddClientForm({ client, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    phoneNumber: "",
    whatsappNumber: "",
    address: "",
    email: "",
    servicesSelected: [],
    clientManagedBy: "",
    clientHealth: 50,
    proposals: [],
    credentials: {},
    campaigns: [],
    socialMediaAccounts: [],
    reports: [],
    invoices: [],
    notes: "",
    renewal: "",
    contentCalendar: [],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        industry: client.industry || "",
        phoneNumber: client.phoneNumber || "",
        whatsappNumber: client.whatsappNumber || "",
        address: client.address || "",
        email: client.email || "",
        servicesSelected: Array.isArray(client.servicesSelected) 
          ? client.servicesSelected 
          : (client.servicesSelected ? client.servicesSelected.split(",").map(s => s.trim()).filter(Boolean) : []),
        clientManagedBy: client.clientManagedBy || "",
        clientHealth: client.clientHealth || 50,
        proposals: Array.isArray(client.proposals) 
          ? client.proposals 
          : (client.proposals ? client.proposals.split(",").map(s => s.trim()).filter(Boolean) : []),
        credentials: typeof client.credentials === "object" && client.credentials !== null 
          ? client.credentials 
          : (client.credentials ? JSON.parse(client.credentials) : {}),
        campaigns: Array.isArray(client.campaigns) 
          ? client.campaigns 
          : (client.campaigns ? client.campaigns.split(",").map(s => s.trim()).filter(Boolean) : []),
        socialMediaAccounts: Array.isArray(client.socialMediaAccounts) 
          ? client.socialMediaAccounts 
          : (client.socialMediaAccounts ? client.socialMediaAccounts.split(",").map(s => s.trim()).filter(Boolean) : []),
        reports: Array.isArray(client.reports) 
          ? client.reports 
          : (client.reports ? client.reports.split(",").map(s => s.trim()).filter(Boolean) : []),
        invoices: Array.isArray(client.invoices) 
          ? client.invoices 
          : (client.invoices ? client.invoices.split(",").map(s => s.trim()).filter(Boolean) : []),
        notes: client.notes || "",
        renewal: client.renewal ? new Date(client.renewal).toISOString().split("T")[0] : "",
        contentCalendar: Array.isArray(client.contentCalendar) 
          ? client.contentCalendar 
          : (client.contentCalendar ? client.contentCalendar.split(",").map(s => s.trim()).filter(Boolean) : []),
      });
    }
  }, [client]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Client name is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (formData.clientHealth < 0 || formData.clientHealth > 100) {
      newErrors.clientHealth = "Health must be between 0 and 100";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        servicesSelected: formData.servicesSelected.filter(Boolean).join(","),
        proposals: formData.proposals.filter(Boolean).join(","),
        credentials: Object.keys(formData.credentials).length ? JSON.stringify(formData.credentials) : null,
        campaigns: formData.campaigns.filter(Boolean).join(","),
        socialMediaAccounts: formData.socialMediaAccounts.filter(Boolean).join(","),
        reports: formData.reports.filter(Boolean).join(","),
        invoices: formData.invoices.filter(Boolean).join(","),
        contentCalendar: formData.contentCalendar.filter(Boolean).join(","),
        clientManagedBy: formData.clientManagedBy ? parseInt(formData.clientManagedBy) : null,
        clientHealth: parseInt(formData.clientHealth),
        renewal: formData.renewal ? new Date(formData.renewal).toISOString() : null,
      };

      if (client) {
        await fetch(`/api/clients/${client.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Failed to save client. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Client Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary ${errors.name ? "border-red-500" : "border-[#E5E5E7]"} bg-white`}
            placeholder="Enter client name"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Industry</label>
          <select
            value={formData.industry}
            onChange={(e) => handleChange("industry", e.target.value)}
            className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
          >
            <option value="">Select Industry</option>
            <option value="SaaS">SaaS</option>
            <option value="E-commerce">E-commerce</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
            <option value="Education">Education</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary ${errors.email ? "border-red-500" : "border-[#E5E5E7]"} bg-white`}
            placeholder="client@example.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Phone Number</label>
          <input
            type="text"
            value={formData.phoneNumber}
            onChange={(e) => handleChange("phoneNumber", e.target.value)}
            className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">WhatsApp Number</label>
          <input
            type="text"
            value={formData.whatsappNumber}
            onChange={(e) => handleChange("whatsappNumber", e.target.value)}
            className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Client Health (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.clientHealth}
            onChange={(e) => handleChange("clientHealth", parseInt(e.target.value) || 0)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary ${errors.clientHealth ? "border-red-500" : "border-[#E5E5E7]"} bg-white`}
          />
          {errors.clientHealth && <p className="text-red-500 text-sm mt-1">{errors.clientHealth}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            placeholder="Client address"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Services Selected (comma separated)</label>
          <textarea
            value={formData.servicesSelected.join(", ")}
            onChange={(e) => handleChange("servicesSelected", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            rows={2}
            className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            placeholder="SEO, Content Marketing, PPC"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Account Manager (Team Member ID)</label>
          <input
            type="number"
            value={formData.clientManagedBy}
            onChange={(e) => handleChange("clientManagedBy", e.target.value)}
            className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            placeholder="Enter team member ID"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            placeholder="Additional notes about the client"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block font-label-sm text-label-sm text-secondary mb-1">Renewal Date</label>
          <input
            type="date"
            value={formData.renewal}
            onChange={(e) => handleChange("renewal", e.target.value)}
            className="w-full px-4 py-2 border border-[#E5E5E7] rounded-lg focus:ring-1 focus:ring-primary focus:border-primary bg-white"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 rounded-lg border border-[#E5E5E7] text-secondary font-label-md text-label-md hover:bg-gray-50 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-[#E8262A] text-white font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin">sync</span>
              Saving...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">save</span>
              {client ? "Update Client" : "Add Client"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}