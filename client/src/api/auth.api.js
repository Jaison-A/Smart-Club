import api from './axiosInstance';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh-token'),
  changePassword: (payload) => api.patch('/auth/change-password', payload),
  updateProfile: (payload) => api.patch('/auth/me', payload),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    // No explicit Content-Type: the browser must set it (with the multipart boundary).
    return api.post('/auth/me/avatar', formData);
  },
};
