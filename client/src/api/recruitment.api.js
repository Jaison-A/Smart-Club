import api from './axiosInstance';

export const recruitmentApi = {
  listDrivesForClub: (clubId, params) => api.get(`/clubs/${clubId}/drives`, { params }),
  createDrive: (clubId, payload) => api.post(`/clubs/${clubId}/drives`, payload),
  getDrive: (driveId) => api.get(`/drives/${driveId}`),
  updateDrive: (driveId, payload) => api.patch(`/drives/${driveId}`, payload),
  apply: (driveId, payload) => api.post(`/drives/${driveId}/apply`, payload),
  listApplicationsForDrive: (driveId, params) => api.get(`/drives/${driveId}/applications`, { params }),
  getApplication: (id) => api.get(`/applications/${id}`),
  updateApplicationStatus: (id, payload) => api.patch(`/applications/${id}/status`, payload),
  listApplicationsForUser: (userId, params) => api.get(`/users/${userId}/applications`, { params }),
};
