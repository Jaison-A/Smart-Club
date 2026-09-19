import api from './axiosInstance';

export const eventsApi = {
  listForClub: (clubId, params) => api.get(`/clubs/${clubId}/events`, { params }),
  create: (clubId, payload) => api.post(`/clubs/${clubId}/events`, payload),
  get: (eventId) => api.get(`/events/${eventId}`),
  update: (eventId, payload) => api.patch(`/events/${eventId}`, payload),
  cancel: (eventId) => api.delete(`/events/${eventId}`),
  register: (eventId) => api.post(`/events/${eventId}/register`),
  cancelRegistration: (eventId) => api.delete(`/events/${eventId}/register`),
  listRegistrations: (eventId, params) => api.get(`/events/${eventId}/registrations`, { params }),
  listForUser: (userId, params) => api.get(`/users/${userId}/events`, { params }),

  createAttendanceSession: (eventId) => api.post(`/events/${eventId}/attendance/session`),
  scanAttendance: (eventId, code) => api.post(`/events/${eventId}/attendance/scan`, { code }),
  markManualAttendance: (eventId, userId) => api.post(`/events/${eventId}/attendance/manual/${userId}`),
  listAttendanceLogs: (eventId) => api.get(`/events/${eventId}/attendance/logs`),

  generateAllCertificates: (eventId) => api.post(`/events/${eventId}/certificates/generate-all`),
  generateCertificateFor: (eventId, userId) => api.post(`/events/${eventId}/certificates/${userId}`),
};

export const certificatesApi = {
  listForUser: (userId) => api.get(`/users/${userId}/certificates`),
  verify: (certificateId) => api.get(`/certificates/verify/${certificateId}`),
  // A plain <a href> can't carry the Authorization header (the access
  // token lives in memory, not a cookie), so download as a blob through
  // axios and trigger the save manually.
  download: async (certificateId) => {
    const res = await api.get(`/certificates/${certificateId}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${certificateId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
