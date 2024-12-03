// Get the globally configured axios instance
const api = window.api;

if (!api) {
    throw new Error('API not initialized. Make sure main.jsx is loaded first.');
}

export default api; 