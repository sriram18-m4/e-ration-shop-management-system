import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '');

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is required.');
}

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eration_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const responseData = error.response?.data;
    const validationDetails = Array.isArray(responseData?.details) ? responseData.details : [];
    const validationMessage = validationDetails
      .map((detail) => detail.msg)
      .filter((message) => message && message !== 'Invalid value')
      .join(' ');
    const message = validationMessage || responseData?.message || error.message || 'Something went wrong.';

    return Promise.reject(new Error(message));
  }
);

export default api;
