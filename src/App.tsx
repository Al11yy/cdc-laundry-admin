import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pastikan semua huruf depannya besar ya sesuai nama file!
import Login from '@/pages/login';
import DashboardLayout from '@/layouts/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import Services from '@/pages/Services';
import Customers from './pages/Customers';
import Transactions from './pages/Transactions';
import Reports from '@/pages/Reports';
import Queue from '@/pages/Queue';
import Staff from '@/pages/Staff';
import Settings from '@/pages/Settings';

import { ThemeProvider } from '@/context/ThemeContext';
import { SearchProvider } from '@/context/SearchContext';
import { Toaster } from 'sonner';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <SearchProvider>
        <Toaster 
        position="bottom-right" 
        closeButton 
        theme="system" 
        toastOptions={{
          className: 'font-sans text-xs bg-card border border-border text-foreground shadow-xl rounded-xl',
          style: {
            fontFamily: 'Poppins, sans-serif',
          }
        }}
      />
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
          <Route path="reports" element={<Reports />} />
          <Route path="queue" element={<Queue />} />
          <Route path="staff" element={<Staff />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
      </SearchProvider>
   </ThemeProvider>
  );
}

export default App;