import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://esdoriginaltestingapp-production.up.railway.app/api'
    : '/api';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000,
    validateStatus: status => status >= 200 && status < 500
});

api.interceptors.request.use(
    config => {
        console.log('API Request:', {
            method: config.method,
            url: config.url,
            data: config.data
        });
        return config;
    },
    error => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Response Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        return Promise.reject(error);
    }
);

export default api; 