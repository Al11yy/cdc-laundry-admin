import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', 
  headers: {
    'Accept': 'application/json',
  },
});

// Otomatis suntik token Sanctum jika admin sudah login
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  // PERBAIKAN: Pastikan tokennya beneran ada, bukan teks 'undefined' atau 'null'
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default apiClient;