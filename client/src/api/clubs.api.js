import api from './axiosInstance';

export const clubsApi = {
  list: (params) => api.get('/clubs', { params }),
  getBySlug: (slug) => api.get(`/clubs/${slug}`),
  create: (payload) => api.post('/clubs', payload),
  update: (id, payload) => api.patch(`/clubs/${id}`, payload),
  remove: (id) => api.delete(`/clubs/${id}`),
  assignCoordinator: (id, userId) => api.post(`/clubs/${id}/coordinators`, { userId }),
  removeCoordinator: (id, userId) => api.delete(`/clubs/${id}/coordinators/${userId}`),
  getMembers: (id, params) => api.get(`/clubs/${id}/members`, { params }),
  addMember: (id, userId) => api.post(`/clubs/${id}/members/${userId}`),
  removeMember: (id, userId) => api.delete(`/clubs/${id}/members/${userId}`),
};
