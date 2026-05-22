import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Box, ReceiptText, LogOut, Settings, Menu, X, ChevronLeft, ChevronRight, Sun, Moon, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/api/axios';
import { useTheme } from '@/context/ThemeContext';
import logoCdc from '@/assets/logo-cdc.jpg';

export default function DashboardLayout() {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString && userString !== 'undefined' ? JSON.parse(userString) : {};

  const navigate = useNavigate();
  const location = useLocation();

  const [custCount, setCustCount] = useState<number | null>(null);
  const [trxCount, setTrxCount] = useState<number | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const cycleTheme = () => {
    const currentTheme = theme || 'system';
    if (currentTheme === 'light') setTheme('dark');
    else if (currentTheme === 'dark') setTheme('system');
    else setTheme('light');
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const resCust = await apiClient.get('/customers');
        const listCust = resCust.data?.data || resCust.data || [];
        setCustCount(listCust.length);

        const resTrx = await apiClient.get('/transactions');
        const listTrx = resTrx.data?.data || resTrx.data || [];
        const activeTrxs = listTrx.filter((t: any) => t.status !== 'diambil');
        setTrxCount(activeTrxs.length);
      } catch (e) {
        console.error('Error fetching sidebar badges:', e);
      }
    };
    if (token) {
      fetchCounts();
    }
  }, [token, location.pathname]); // re-fetch on route change to keep badges fresh!

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
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: <LayoutDashboard size={18} /> 
    },
    { 
      name: 'Layanan', 
      path: '/dashboard/services', 
      icon: <Box size={18} /> 
    },
    { 
      name: 'Pelanggan', 
      path: '/dashboard/customers', 
      icon: <Users size={18} />,
      badge: custCount !== null ? custCount : undefined
    },
    { 
      name: 'Transaksi', 
      path: '/dashboard/transactions', 
      icon: <ReceiptText size={18} />,
      badge: trxCount !== null ? trxCount : undefined,
      badgeColor: 'bg-primary/20 text-primary border-primary/30'
    },
  ];

  return (
    <div className="flex min-h-screen w-full bg-sidebar text-neutral-800 dark:text-foreground font-sans antialiased overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR DESKTOP */}
      <aside className={`bg-sidebar text-sidebar-foreground flex-col hidden md:flex shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex flex-col justify-between h-full py-4 overflow-y-auto">
          
          {/* TOP PART: Brand Logo & Navigation */}
          <div className="space-y-6">
            {/* Brand Header (NO border-b / divider!) */}
            <div className="flex items-center justify-between px-4 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 overflow-hidden flex items-center justify-center shadow-sm shrink-0">
                  <img src={logoCdc} alt="Logo" className="w-full h-full object-cover" />
                </div>
                {!isCollapsed && (
                  <span className="font-bold text-sm tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5 animate-fade-in">
                    CDC Laundry
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  </span>
                )}
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/30 hover:bg-neutral-200 dark:hover:bg-neutral-900 shrink-0"
                onClick={() => {
                  const nextState = !isCollapsed;
                  setIsCollapsed(nextState);
                  localStorage.setItem('sidebar-collapsed', String(nextState));
                }}
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </Button>
            </div>

            {/* Tautan Navigasi */}
            <nav className="p-3 space-y-1.5">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <div className={`group flex items-center ${isCollapsed ? 'justify-center py-3' : 'justify-between px-3 py-2.5'} rounded-xl transition-all duration-200 border ${
                      isActive 
                        ? 'bg-neutral-200/80 dark:bg-neutral-900 border-neutral-300/60 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold shadow-sm' 
                        : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 hover:text-neutral-800 dark:hover:text-neutral-200 border-transparent'
                    }`}>
                      <div className="flex items-center gap-3 relative">
                        <span className={`transition-colors duration-200 ${isActive ? 'text-primary' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200'}`}>
                          {item.icon}
                        </span>
                        {!isCollapsed && <span className="text-sm">{item.name}</span>}
                        
                        {isCollapsed && item.badge !== undefined && (
                          <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 flex items-center justify-center text-[8px] rounded-full font-extrabold bg-primary text-white border border-neutral-950">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && item.badge !== undefined && (
                        <Badge variant="outline" className={`h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] rounded-full font-bold border ${
                          isActive 
                            ? 'bg-primary/20 text-primary border-primary/30'
                            : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 border-neutral-300 dark:border-neutral-850'
                        }`}>
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* BOTTOM PART: Laundry Status, Theme Switcher, Profile, Settings & Logout */}
          <div className="space-y-4">
            {/* Laundry Status (Clean, no border-t or divider!) */}
            <div className={`px-4 flex items-center justify-between`}>
              {!isCollapsed && <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Laundry Status</span>}
              <div className="flex gap-1.5 mx-auto md:mx-0">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" title="Antrian" />
                <span className="w-2 h-2 rounded-full bg-primary/70" title="Proses" />
                <span className="w-2 h-2 rounded-full bg-primary/45" title="Selesai" />
              </div>
            </div>

            {/* Theme Switcher section (Clean, no divider!) */}
            <div className="px-4">
              {isCollapsed ? (
                <button 
                  onClick={cycleTheme}
                  className="w-10 h-10 mx-auto rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 bg-neutral-100/50 dark:bg-neutral-900/65 hover:bg-neutral-200 dark:hover:bg-neutral-900 transition-all"
                  title="Ganti Tema"
                >
                  {theme === 'light' ? <Sun size={16} /> : theme === 'dark' ? <Moon size={16} /> : <Laptop size={16} />}
                </button>
              ) : (
                <div className="flex bg-neutral-100 dark:bg-neutral-900/65 border border-neutral-200 dark:border-neutral-900 p-1 rounded-xl">
                  <button 
                    onClick={() => setTheme('light')} 
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                      theme === 'light' 
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm' 
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Sun size={13} />
                    <span>Light</span>
                  </button>
                  <button 
                    onClick={() => setTheme('dark')} 
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                      theme === 'dark' 
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm' 
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Moon size={13} />
                    <span>Dark</span>
                  </button>
                  <button 
                    onClick={() => setTheme('system')} 
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                      theme === 'system' 
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm' 
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Laptop size={13} />
                    <span>System</span>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Info block (Clean, no divider!) */}
            {!isCollapsed && (
              <div className="px-4 py-2 animate-fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-850 overflow-hidden flex items-center justify-center shadow-sm shrink-0">
                    <span className="font-bold text-xs text-neutral-600 dark:text-neutral-300">
                      {(user.name || 'Admin').substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs tracking-tight text-neutral-800 dark:text-neutral-200">
                      {user.name || 'Admin'}
                    </span>
                    <span className="text-[10px] text-neutral-500 truncate max-w-[140px]">
                      {user.email || 'admin@cdclaundry.com'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Jarang Dipakai (Bottom-most, clean, no divider!) */}
            <div className="px-4 pb-2 space-y-1">
              <Link to="/dashboard">
                <div className={`flex items-center ${isCollapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2'} rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer transition-colors`}>
                  <Settings size={18} />
                  {!isCollapsed && <span className="text-xs font-medium">Pengaturan</span>}
                </div>
              </Link>
              <div 
                onClick={handleLogout} 
                className={`flex items-center ${isCollapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2'} rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors`}
              >
                <LogOut size={18} />
                {!isCollapsed && <span className="text-xs font-medium">Logout</span>}
              </div>
            </div>
          </div>

        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden flex flex-col w-full h-screen overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-card border border-border overflow-hidden flex items-center justify-center shadow-sm shrink-0">
              <img src={logoCdc} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-foreground">CDC Laundry</span>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className="border-border text-foreground hover:bg-muted bg-card" 
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </header>

        {/* MOBILE DRAWER SIDEBAR */}
        {isMobileOpen && (
          <div className="fixed inset-0 top-16 bg-background/95 backdrop-blur-sm z-50 flex flex-col animate-fade-in p-6">
            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setIsMobileOpen(false)}>
                    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                      isActive 
                        ? 'bg-muted border-border text-foreground' 
                        : 'text-muted-foreground hover:bg-muted/50 border-transparent'
                    }`}>
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      {item.badge !== undefined && (
                        <Badge variant="outline" className={`h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] rounded-full font-bold border ${
                          item.badgeColor || 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
            
            {/* Theme switcher on mobile */}
            <div className="py-4 border-t border-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Tema Aplikasi</span>
              <button 
                onClick={cycleTheme}
                className="px-3 py-1.5 rounded-xl border border-border flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground bg-muted/50"
              >
                {theme === 'light' ? <Sun size={14} /> : theme === 'dark' ? <Moon size={14} /> : <Laptop size={14} />}
                <span className="capitalize">{theme || 'system'}</span>
              </button>
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <div className="px-4">
                <p className="text-sm font-medium text-foreground">{user.name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">{user.email || 'admin@cdclaundry.com'}</p>
              </div>
              <Button variant="destructive" className="w-full justify-center gap-2 rounded-xl" onClick={handleLogout}>
                <LogOut size={18} />
                Logout
              </Button>
            </div>
          </div>
        )}

        {/* CONTENT FOR MOBILE */}
        <div className="flex-1 overflow-auto bg-background p-6">
          <Outlet />
        </div>
      </div>

      {/* DESKTOP CONTENT WRAPPER */}
      <main className="flex-1 hidden md:flex flex-col h-screen overflow-hidden bg-sidebar">
        <div className="flex-1 mt-4 mr-4 mb-4 bg-background border border-neutral-200 dark:border-neutral-900 rounded-tl-[32px] rounded-tr-[12px] rounded-br-[12px] rounded-bl-[12px] overflow-hidden flex flex-col shadow-xl">
          <div className="flex-1 overflow-auto p-8 max-w-[1600px] w-full mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

    </div>
  );
}