import axios from 'axios';

const apiClient = axios.create({
  // Sesuaikan port-nya dengan port Laravel Laragon/XAMPP lo (misal: 8000 atau cdc-laundry-api.test)
  baseURL: 'http://127.0.0.1:8000/api', 
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Otomatis suntik token Sanctum jika admin sudah login
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;