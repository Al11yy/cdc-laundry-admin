import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pastikan semua huruf depannya besar ya sesuai nama file!
import Login from '@/pages/login';
import DashboardLayout from '@/layouts/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import Services from '@/pages/Services';
import Customers from './pages/Customers';
import Transactions from './pages/Transactions';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Grup Routing untuk halaman yang butuh Login */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Index (Halaman default pas buka /dashboard) */}
          <Route index element={<Dashboard />} />

          {/* Rute Layanan yang udah nyambung ke file komponen Services.tsx */}
          <Route path="services" element={<Services />} />
          
          {/* Sisa halaman yang nanti bakal kita bikin */}
          <Route path="customers" element={<Customers />} />
          <Route path="transactions" element={<Transactions />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;