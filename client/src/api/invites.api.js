import api from './axiosInstance';

export const coordinatorRequestsApi = {
  invite: (clubId, userId, message) => api.post(`/clubs/${clubId}/coordinator-requests/invite`, { userId, message }),
  apply: (clubId) => api.post(`/clubs/${clubId}/coordinator-requests/apply`),
  listForClub: (clubId) => api.get(`/clubs/${clubId}/coordinator-requests`),
  listMine: () => api.get('/coordinator-requests/mine'),
  listApplications: () => api.get('/coordinator-requests/applications'),
  accept: (requestId) => api.patch(`/coordinator-requests/${requestId}/accept`),
  reject: (requestId) => api.patch(`/coordinator-requests/${requestId}/reject`),
};

export const membershipInvitesApi = {
  invite: (clubId, userId, officerTitle) => api.post(`/clubs/${clubId}/member-invites`, { userId, officerTitle }),
  listMine: () => api.get('/member-invites/mine'),
  accept: (inviteId) => api.patch(`/member-invites/${inviteId}/accept`),
  reject: (inviteId) => api.patch(`/member-invites/${inviteId}/reject`),
};

export const usersApi = {
  search: (q) => api.get('/users/search', { params: { q } }),
};
