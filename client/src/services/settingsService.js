import { apiClient } from './apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const getGeneralSettings = async () => {
  const response = await apiClient('/settings/general');
  return response.data;
};

export const updateGeneralSettings = async (settingsData) => {
  const response = await apiClient('/settings/general', {
    method: 'PUT',
    body: settingsData,
  });
  return response.data;
};

export const uploadAgencyLogo = async (file) => {
  const formData = new FormData();
  formData.append('logo', file);

  const response = await fetch(`${API_BASE_URL}/settings/upload-logo`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload logo image');
  }
  return data;
};

export const verifyAgencyPassword = async (password) => {
  const response = await apiClient('/settings/verify-password', {
    method: 'POST',
    body: { password },
  });
  return response;
};
