const isDevelopment = process.env.NODE_ENV === 'development';
console.log('NODE_ENV:', process.env.NODE_ENV);
const API_URL = isDevelopment 
  ? 'http://localhost:5001/api'
  : 'https://esdoriginaltestingapp-production.up.railway.app/api';
console.log('API_URL:', API_URL);

export default API_URL; 