import api from './apiService';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async loginDev() {
    const response = await api.post('/auth/login/dev');
    return response.data;
  },

  async loginDevUser(email) {
    const response = await api.post(`/auth/login/dev/${encodeURIComponent(email)}`);
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data.user;
  },

  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData);
    return response.data.user;
  },

  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};
