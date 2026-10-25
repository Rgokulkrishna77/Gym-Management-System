import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gym_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired/invalid token anywhere (except the login call itself) sends the user to /login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLogin = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLogin) {
      localStorage.removeItem('gym_token');
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(err);
  },
);

// Turns any axios error into a readable message for toasts
export const errorMessage = (err) => {
  const body = err.response?.data;
  if (body?.errors?.length) return body.errors.map((e) => e.message).join('. ');
  if (body?.message) return body.message;
  if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the API running?';
  return err.message || 'Something went wrong';
};

export default api;
