import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://esdoriginaltestingapp-production.up.railway.app/api'
    : '/api';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }
);

export default api; 