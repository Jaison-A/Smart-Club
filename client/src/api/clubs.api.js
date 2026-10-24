import api from './axiosInstance';

export const clubsApi = {
  list: (params) => api.get('/clubs', { params }),
  mine: () => api.get('/clubs/mine'),
  getBySlug: (slug) => api.get(`/clubs/${slug}`),
  create: (payload) => api.post('/clubs', payload),
  update: (id, payload) => api.patch(`/clubs/${id}`, payload),
  remove: (id) => api.delete(`/clubs/${id}`),
  approve: (id) => api.patch(`/clubs/${id}/approve`),
  reject: (id, reason) => api.patch(`/clubs/${id}/reject`, { reason }),
  suspend: (id) => api.patch(`/clubs/${id}/suspend`),
  restore: (id) => api.patch(`/clubs/${id}/restore`),
  assignCoordinator: (id, userId) => api.post(`/clubs/${id}/coordinators`, { userId }),
  removeCoordinator: (id, userId) => api.delete(`/clubs/${id}/coordinators/${userId}`),
  getMembers: (id, params) => api.get(`/clubs/${id}/members`, { params }),
  addMember: (id, userId) => api.post(`/clubs/${id}/members/${userId}`),
  removeMember: (id, userId) => api.delete(`/clubs/${id}/members/${userId}`),
  setOfficerTitle: (id, userId, officerTitle) => api.patch(`/clubs/${id}/members/${userId}/title`, { officerTitle }),
};
