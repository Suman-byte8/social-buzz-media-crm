import { apiClient } from './apiClient';

export const fetchClients = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await apiClient(`/clients?${queryString}`);
  return response;
};

export const fetchClientById = async (id) => {
  const response = await apiClient(`/clients/${id}`);
  return response;
};

export const createClient = async (clientData) => {
  const response = await apiClient('/clients', {
    method: 'POST',
    body: clientData,
  });
  return response;
};

export const updateClient = async (id, clientData) => {
  const response = await apiClient(`/clients/${id}`, {
    method: 'PUT',
    body: clientData,
  });
  return response;
};

export const deleteClient = async (id) => {
  const response = await apiClient(`/clients/${id}`, {
    method: 'DELETE',
  });
  return response;
};

export const exportClients = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiClient(`/clients/export?${queryString}`, { responseType: 'blob' });
};

export const formatClientData = (formData) => {
  return {
    name: formData.name || '',
    industry: formData.industry || '',
    phoneNumber: formData.phoneNumber || '',
    whatsappNumber: formData.whatsappNumber || '',
    address: formData.address || '',
    email: formData.email || '',
    servicesSelected: formData.servicesSelected ? formData.servicesSelected.split(',').map(s => s.trim()).filter(Boolean) : [],
    clientManagedBy: formData.clientManagedBy || null,
    clientHealth: formData.clientHealth ? parseInt(formData.clientHealth) : 0,
    proposals: formData.proposals ? formData.proposals.split(',').map(s => s.trim()).filter(Boolean) : [],
    credentials: formData.credentials ? JSON.parse(formData.credentials) : {},
    campaigns: formData.campaigns ? formData.campaigns.split(',').map(s => s.trim()).filter(Boolean) : [],
    socialMediaAccounts: formData.socialMediaAccounts ? formData.socialMediaAccounts.split(',').map(s => s.trim()).filter(Boolean) : [],
    reports: formData.reports ? formData.reports.split(',').map(s => s.trim()).filter(Boolean) : [],
    invoices: formData.invoices ? formData.invoices.split(',').map(s => s.trim()).filter(Boolean) : [],
    notes: formData.notes || '',
    renewal: formData.renewal || null,
    contentCalendar: formData.contentCalendar ? formData.contentCalendar.split(',').map(s => s.trim()).filter(Boolean) : [],
  };
};

export const uploadInvoiceToDrive = async (pdfBlob, clientId, invoiceNumber) => {
  const formData = new FormData();
  formData.append('file', pdfBlob, `Invoice-${invoiceNumber || 'draft'}.pdf`);
  formData.append('clientId', clientId.toString());
  formData.append('documentType', 'invoice');

  return apiClient('/documents/upload', {
    method: 'POST',
    body: formData,
  });
};