import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Box, ReceiptText, LogOut, WashingMachine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/api/axios';

export default function DashboardLayout() {
  const token = localStorage.getItem('token');
  
  // Pengaman ekstra biar gak crash kalau data user-nya kosong/undefined
  const userString = localStorage.getItem('user');
  const user = userString && userString !== 'undefined' ? JSON.parse(userString) : {};
  
  const navigate = useNavigate();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    try {
      await apiClient.post('/logout');
    } catch (error) {
      console.log('Logout error', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Layanan', path: '/dashboard/services', icon: <Box size={20} /> },
    { name: 'Pelanggan', path: '/dashboard/customers', icon: <Users size={20} /> },
    { name: 'Transaksi', path: '/dashboard/transactions', icon: <ReceiptText size={20} /> },
  ];

  return (
    <div className="flex min-h-screen w-full bg-slate-50/50">
      
      {/* SIDEBAR KIRI */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <WashingMachine />
            <span>CDC Laundry</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname === item.path 
                  ? 'bg-primary text-primary-foreground font-medium shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}>
                {item.icon}
                {item.name}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="mb-4 px-3">
            <p className="text-sm font-medium text-slate-900">{user.name || 'Admin'}</p>
            <p className="text-xs text-slate-500 truncate">{user.email || 'admin@cdclaundry.com'}</p>
          </div>
          <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </aside>

      {/* KONTEN KANAN */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 md:hidden">
          <span className="font-bold text-lg">CDC Laundry</span>
        </header>

        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

    </div>
  );
}