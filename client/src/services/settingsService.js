import { apiClient } from './apiClient';

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

  return apiClient('/settings/upload-logo', {
    method: 'POST',
    body: formData,
  });
};

export const verifyAgencyPassword = async (password) => {
  const response = await apiClient('/settings/verify-password', {
    method: 'POST',
    body: { password },
  });
  return response;
};
