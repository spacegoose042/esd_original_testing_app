import axios from 'axios';

const API_URL = 'https://esdoriginaltestingapp-production.up.railway.app/api';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Export API methods
export const api = {
    get: (url, config = {}) => axiosInstance.get(url, config),
    post: (url, data = {}, config = {}) => axiosInstance.post(url, data, config),
    put: (url, data = {}, config = {}) => axiosInstance.put(url, data, config),
    delete: (url, config = {}) => axiosInstance.delete(url, config)
};

export default api; 