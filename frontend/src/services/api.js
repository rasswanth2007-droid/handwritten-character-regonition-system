import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/api/auth/login/', credentials),
  register: (userData) => api.post('/api/auth/register/', userData),
  getProfile: () => api.get('/api/auth/profile/'),
  updateProfile: (data) => api.patch('/api/auth/profile/', data),
};

export const recognitionAPI = {
  predict: (formData) => api.post('/api/recognition/predict/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPredictions: () => api.get('/api/recognition/predictions/'),
  getPrediction: (id) => api.get(`/api/recognition/predictions/${id}/`),
  batchPredict: (formData) => api.post('/api/recognition/batch-predict/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const trainingAPI = {
  getDatasets: () => api.get('/api/training/datasets/'),
  uploadDataset: (formData) => api.post('/api/training/datasets/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getModels: () => api.get('/api/training/models/'),
  createModel: (data) => api.post('/api/training/models/', data),
  getModel: (id) => api.get(`/api/training/models/${id}/`),
  trainModel: (data) => api.post('/api/training/train/', data),
  deployModel: (id) => api.post(`/api/training/models/${id}/deploy/`),
  getModelHistory: (id) => api.get(`/api/training/models/${id}/history/`),
};

export const analyticsAPI = {
  getDashboardStats: () => api.get('/api/analytics/dashboard/'),
  getCharacterFrequency: () => api.get('/api/analytics/charts/character-frequency/'),
  getPredictionTimeline: () => api.get('/api/analytics/charts/prediction-timeline/'),
  getConfidenceDistribution: () => api.get('/api/analytics/charts/confidence-distribution/'),
  getModelComparison: () => api.get('/api/analytics/charts/model-comparison/'),
  getTrainingProgress: (modelId) => api.get(`/api/analytics/training-progress/${modelId}/`),
  getDatasetStats: () => api.get('/api/analytics/dataset-stats/'),
};

export default api;
