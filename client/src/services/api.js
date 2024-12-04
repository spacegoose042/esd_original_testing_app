import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to handle auth token
api.interceptors.request.use(
    (config) => {
        // Add leading slash to paths that don't start with /api
        if (!config.url.startsWith('/api') && !config.url.startsWith('http')) {
            config.url = `/api${config.url}`;
        }

        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api; 