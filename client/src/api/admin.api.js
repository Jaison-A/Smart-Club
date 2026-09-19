import api from './axiosInstance';

export const adminApi = {
  listUsers: (params) => api.get('/admin/users', { params }),
  setRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  disableUser: (id) => api.patch(`/admin/users/${id}/disable`),
  enableUser: (id) => api.patch(`/admin/users/${id}/enable`),
};
