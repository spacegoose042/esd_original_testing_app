const isDevelopment = process.env.NODE_ENV === 'development';
const API_URL = isDevelopment 
  ? 'http://localhost:5001/api'
  : 'https://esdoriginaltestingapp-production.up.railway.app/api';

export default API_URL; 