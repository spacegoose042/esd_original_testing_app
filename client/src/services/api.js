import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://esdoriginaltestingapp-production.up.railway.app'
    : '';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(
    (config) => {
        if (config.url.startsWith('/api/api')) {
            config.url = config.url.replace('/api/api', '/api');
        }
        else if (!config.url.startsWith('/api')) {
            config.url = `/api${config.url}`;
        }
        
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }
);

export default api; 