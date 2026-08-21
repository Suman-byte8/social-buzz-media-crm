import { apiClient } from './apiClient';

export const fetchTeamMembers = async () => {
  const response = await apiClient('/team-members');
  return response.data;
};

export const fetchTeamMemberById = async (id) => {
  const response = await apiClient(`/team-members/${id}`);
  return response.data;
};

export const createTeamMember = async (memberData) => {
  const response = await apiClient('/team-members', {
    method: 'POST',
    body: memberData,
  });
  return response;
};

export const updateTeamMember = async (id, memberData) => {
  const response = await apiClient(`/team-members/${id}`, {
    method: 'PUT',
    body: memberData,
  });
  return response;
};

export const deleteTeamMember = async (id) => {
  const response = await apiClient(`/team-members/${id}`, {
    method: 'DELETE',
  });
  return response;
};

export const parseArrayField = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return field.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
};
