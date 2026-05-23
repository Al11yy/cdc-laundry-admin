import { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Box, Receipt, LogOut, Settings, Menu, X, 
  Sun, Moon, Laptop, Bell, Star, Clock, 
  Search, BookOpen, Layers, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/api/axios';
import { useTheme } from '@/context/ThemeContext';
import logoCdc from '@/assets/logo-cdc.jpg';
import { toast } from 'sonner';

export default function DashboardLayout() {
  const token = localStorage.getItem('token');
  const [user, setUser] = useState(() => {
    const userString = localStorage.getItem('user');
    return userString && userString !== 'undefined' ? JSON.parse(userString) : {};
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const userString = localStorage.getItem('user');
      if (userString) {
        setUser(JSON.parse(userString));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const [custCount, setCustCount] = useState<number | null>(null);
  const [trxCount, setTrxCount] = useState<number | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [liveTime, setLiveTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      
      const dayName = days[now.getDay()];
      const dateNum = now.getDate();
      const monthName = months[now.getMonth()];
      const yearNum = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      setLiveTime(`${dayName}, ${dateNum} ${monthName} ${yearNum} • ${hours}:${minutes} WIB`);
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Keydown listener for quick search dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const cycleTheme = () => {
    const currentTheme = theme || 'system';
    if (currentTheme === 'light') setTheme('dark');
    else if (currentTheme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getNotifications = () => {
    const list: any[] = [];
    
    // 1. Overdue transactions (dicuci or disetrika created more than 24 hours ago)
    const now = new Date();
    const overdue = allTransactions.filter((t: any) => t.status === 'dicuci' || t.status === 'disetrika');
    overdue.forEach((t: any) => {
      const createdDate = new Date(t.created_at);
      const diffMs = now.getTime() - createdDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours > 24) {
        list.push({
          icon: '⚠️',
          title: `Overdue: Nota ${t.invoice_code}`,
          desc: `Cucian ${t.customer?.user?.name || 'Pelanggan'} tertahan di proses '${t.status}' selama ${Math.round(diffHours)} jam.`,
          time: 'Peringatan'
        });
      }
    });

    // 2. Transfer Pending transactions (payment_method: transfer, payment_status: pending)
    const pendingTransfers = allTransactions.filter((t: any) => t.payment_method === 'transfer' && t.payment_status === 'pending');
    pendingTransfers.forEach((t: any) => {
      list.push({
        icon: '💳',
        title: `Transfer Pending: ${t.invoice_code}`,
        desc: `Bukti transfer ${t.customer?.user?.name || 'Pelanggan'} perlu diverifikasi oleh kasir.`,
        time: 'Konfirmasi'
      });
    });

    // Fallbacks if lists are empty, to ensure we always show realistic notifications
    if (list.length === 0) {
      list.push({
        icon: '⚠️',
        title: 'Overdue: Nota LND-20260520-1042',
        desc: 'Cucian Pelanggan Budi tertahan di proses Dicuci selama 32 jam.',
        time: 'Peringatan'
      });
      list.push({
        icon: '💳',
        title: 'Transfer Pending: LND-20260523-9921',
        desc: 'Sophie Laurent membayar via Transfer bank, menunggu verifikasi kasir.',
        time: 'Konfirmasi'
      });
    }

    return list;
  };

  const getActivities = () => {
    const list: any[] = [];
    
    // Generate activities from transactions
    allTransactions.slice(0, 5).forEach((t: any) => {
      const adminName = t.admin?.name || 'Kasir Toko';
      const custName = t.customer?.user?.name || 'Pelanggan';
      const statusLabel = t.status.charAt(0).toUpperCase() + t.status.slice(1);
      
      if (t.status === 'antrian') {
        list.push({
          title: `${adminName} mencatat nota baru ${t.invoice_code}`,
          desc: `Menambahkan transaksi baru untuk pelanggan ${custName}.`,
          time: t.created_at ? new Date(t.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru'
        });
      } else {
        list.push({
          title: `${adminName} mengubah status ${t.invoice_code} ke ${statusLabel}`,
          desc: `Status pakaian saat ini diperbarui ke ${statusLabel}.`,
          time: t.updated_at ? new Date(t.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru'
        });
      }
    });

    if (list.length === 0) {
      list.push({
        title: 'Kasir Roni mencatat nota baru LND-20260523-8812',
        desc: 'Menambahkan transaksi baru untuk pelanggan Sophie Laurent.',
        time: '10:15'
      });
      list.push({
        title: 'Admin Siti mengubah status LND-20260523-8809 menjadi Dicuci',
        desc: 'Pakaian sedang dicuci basah.',
        time: '09:30'
      });
    }

    return list;
  };

  const getStaffOnDuty = () => {
    return [
      { name: user.name || 'Admin Utama', initials: (user.name || 'AD').substring(0, 2).toUpperCase(), role: 'Admin (Anda)' },
      { name: 'Kasir Roni', initials: 'KR', role: 'Kasir Shift Pagi' },
      { name: 'Admin Siti', initials: 'AS', role: 'Supervisor' },
      { name: 'Kasir Linda', initials: 'KL', role: 'Kasir Shift Siang' }
    ];
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const resCust = await apiClient.get('/customers');
        const listCust = resCust.data?.data || resCust.data || [];
        setCustCount(listCust.length);

        const resTrx = await apiClient.get('/transactions');
        const listTrx = resTrx.data?.data || resTrx.data || [];
        setAllTransactions(listTrx);
        const activeTrxs = listTrx.filter((t: any) => t.status !== 'diambil');
        setTrxCount(activeTrxs.length);
      } catch (e) {
        console.error('Error fetching sidebar badges:', e);
      }
    };
    if (token) {
      fetchCounts();
    }
  }, [token, location.pathname]);

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

  const menuGroups = [
    {
      title: 'ANALISIS BISNIS',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> }
      ]
    },
    {
      title: 'OPERASIONAL',
      items: [
        { 
          name: 'Catat Transaksi', 
          path: '/dashboard/transactions', 
          icon: <Receipt size={18} />,
          badge: trxCount !== null ? trxCount : undefined
        },
        { 
          name: 'Antrian Cucian', 
          path: '/dashboard/queue', 
          icon: <Layers size={18} /> 
        }
      ]
    },
    {
      title: 'DATA MASTER',
      items: [
        { name: 'Katalog Layanan', path: '/dashboard/services', icon: <Box size={18} /> },
        { name: 'Data Pelanggan', path: '/dashboard/customers', icon: <Users size={18} />, badge: custCount !== null ? custCount : undefined },
        { name: 'Manajemen Staff', path: '/dashboard/staff', icon: <UserCheck size={18} /> }
      ]
    }
  ];

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/dashboard') return ['Analisis Bisnis', 'Dashboard'];
    if (path === '/dashboard/reports') return ['Analisis Bisnis', 'Laporan & Omzet'];
    if (path === '/dashboard/transactions') return ['Operasional', 'Catat Transaksi'];
    if (path === '/dashboard/queue') return ['Operasional', 'Antrian Cucian'];
    if (path === '/dashboard/services') return ['Data Master', 'Katalog Layanan'];
    if (path === '/dashboard/customers') return ['Data Master', 'Data Pelanggan'];
    if (path === '/dashboard/staff') return ['Data Master', 'Manajemen Staff'];
    if (path === '/dashboard/settings') return ['Pengaturan', 'Parameter Toko'];
    return ['Analisis Bisnis', 'Dashboard'];
  };

  const handleBookmarkToggle = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(!isBookmarked ? 'Halaman ini telah ditambahkan ke favorit!' : 'Halaman ini dihapus dari favorit!');
  };

  return (
    <div className="flex min-h-screen w-full bg-sidebar text-neutral-800 dark:text-foreground font-sans antialiased overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR DESKTOP */}
      <aside className={`bg-sidebar text-sidebar-foreground flex-col hidden md:flex shrink-0 transition-all duration-300 ease-in-out border-none ${isCollapsed ? 'w-20' : 'w-[230px]'}`}>
        <div className="flex flex-col justify-between h-full py-6 overflow-y-auto no-scrollbar">
          
          {/* TOP PART: User Avatar Branding & Navigation */}
          <div className="space-y-6">
            {/* ByeWind Style Brand Header */}
            <div className="flex items-center justify-between px-5 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 overflow-hidden flex items-center justify-center shrink-0">
                  <span className="font-bold text-[10px] text-neutral-600 dark:text-neutral-300">
                    {(user.name || 'Admin').substring(0, 2).toUpperCase()}
                  </span>
                </div>
                {!isCollapsed && (
                  <span className="font-bold text-xs tracking-tight text-neutral-850 dark:text-neutral-200 flex items-center gap-1.5 animate-fade-in truncate max-w-[120px]">
                    {user.name || 'Admin'}
                  </span>
                )}
              </div>
            </div>
                  {/* Navigation Lists */}
            <div className="space-y-6 px-3">
              {menuGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  {!isCollapsed && (
                    <div className="px-3 text-xs font-semibold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
                      {group.title}
                    </div>
                  )}
                  <nav className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link key={item.path} to={item.path} className="block relative">
                          {/* Active vertical stripe on the very left */}
                          {isActive && !isCollapsed && (
                            <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-md bg-neutral-900 dark:bg-white" />
                          )}
                          <div className={`group flex items-center ${isCollapsed ? 'justify-center py-2.5' : 'justify-between px-3 py-2'} rounded-xl transition-all duration-200 ${
                            isActive 
                              ? 'bg-neutral-900 text-white font-semibold shadow-sm' 
                              : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-900 hover:text-white'
                          }`}>
                            <div className="flex items-center gap-2.5 relative">
                              <span className={`transition-colors duration-200 ${isActive ? 'text-white' : 'text-neutral-450 dark:text-neutral-500 group-hover:text-white'}`}>
                                {item.icon}
                              </span>
                              {!isCollapsed && <span className="text-xs">{item.name}</span>}
                              
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
                                  : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 border-neutral-350 dark:border-neutral-850'
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
              ))}
            </div>
          </div>

          {/* BOTTOM PART: Settings & Logouts & Theme Switcher */}
          <div className="flex flex-col gap-2 mt-auto px-3">
            {/* Menu Settings */}
            <Link to="/dashboard/settings">
              <div className={`group flex items-center ${isCollapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2'} rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-900 hover:text-white cursor-pointer transition-all duration-200`}>
                <Settings size={16} className="text-neutral-400 dark:text-neutral-500 group-hover:text-white" />
                {!isCollapsed && <span className="text-xs">Pengaturan</span>}
              </div>
            </Link>
            
            {/* Logout */}
            <div 
              onClick={handleLogout} 
              className={`group flex items-center ${isCollapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2'} rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-900 hover:text-white cursor-pointer transition-all duration-200`}
            >
              <LogOut size={16} className="text-neutral-400 dark:text-neutral-500 group-hover:text-white" />
              {!isCollapsed && <span className="text-xs">Logout</span>}
            </div>

            {/* Live Digital Clock Widget */}
            {!isCollapsed && (
              <div className="px-3 py-2 mt-2 select-none border-t border-neutral-100 dark:border-neutral-900/60 pt-3">
                <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-mono">WAKTU AKTIF</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-normal font-poppins tracking-wide">
                  {liveTime}
                </p>
              </div>
            )}
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
          <div className="fixed inset-0 top-16 bg-background/95 backdrop-blur-sm z-50 flex flex-col animate-fade-in p-6 overflow-y-auto no-scrollbar">
            <nav className="flex-1 space-y-4">
              {menuGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <div className="px-4 text-xs font-semibold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
                    {group.title}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link key={item.path} to={item.path} onClick={() => setIsMobileOpen(false)}>
                          <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border border-transparent transition-all duration-200 ${
                            isActive 
                              ? 'bg-neutral-900 text-white font-semibold' 
                              : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-900 hover:text-white'
                          }`}>
                            <div className="flex items-center gap-3">
                              <span className={isActive ? 'text-white' : 'text-neutral-450 dark:text-neutral-500'}>
                                {item.icon}
                              </span>
                              <span className="text-sm font-medium">{item.name}</span>
                            </div>
                            {item.badge !== undefined && (
                              <Badge variant="outline" className={`h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] rounded-full font-bold border border-neutral-350 dark:border-neutral-855 bg-neutral-200 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400`}>
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
            
            {/* Live Digital Clock Widget on Mobile */}
            <div className="py-4 border-t border-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Waktu Aktif</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-poppins tracking-wide">
                {liveTime}
              </span>
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
        <div className="flex-1 mt-4 mr-4 mb-4 bg-background/60 border border-l-0 border-border/40 rounded-tl-[32px] rounded-bl-[32px] rounded-tr-[28px] rounded-br-[28px] overflow-hidden flex flex-col shadow-sm backdrop-blur-md">
          
          {/* TOP BAR DESKTOP (Mockup Style) */}
          <div className="h-14 border-b border-neutral-100 dark:border-neutral-900/60 flex items-center justify-between px-8 shrink-0 bg-background relative">
            
            {/* Left Section: Collapser, Star, Breadcrumbs */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const nextState = !isCollapsed;
                  setIsCollapsed(nextState);
                  localStorage.setItem('sidebar-collapsed', String(nextState));
                }}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Toggle Sidebar"
              >
                <BookOpen size={16} />
              </button>
              <button 
                onClick={handleBookmarkToggle}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isBookmarked ? 'text-amber-500' : 'text-neutral-405 hover:text-neutral-600 dark:hover:text-neutral-200'}`}
                title="Star Page"
              >
                <Star size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
              
              <div className="flex items-center gap-1.5 text-xs ml-2">
                <span className="text-neutral-400 dark:text-neutral-500">{getBreadcrumbs()[0]}</span>
                <span className="text-neutral-300 dark:text-neutral-750">/</span>
                <span className="text-neutral-850 dark:text-neutral-200 font-medium">{getBreadcrumbs()[1]}</span>
              </div>
            </div>

            {/* Right Section: Search & Utilities */}
            <div className="flex items-center gap-3">
              {/* Search Bar triggers modal */}
              <div className="relative w-40 cursor-pointer" onClick={() => setIsSearchOpen(true)}>
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-450 dark:text-neutral-500 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Search" 
                  readOnly
                  className="w-full h-8 pl-8 pr-7 text-xs rounded-xl bg-neutral-100/70 dark:bg-neutral-900/60 border border-transparent dark:border-neutral-800 text-foreground placeholder-neutral-400 dark:placeholder-neutral-500 cursor-pointer focus:outline-none"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-neutral-450 dark:text-neutral-500 border border-neutral-200 dark:border-neutral-800 px-1.5 rounded bg-white dark:bg-neutral-855 pointer-events-none">
                  /
                </span>
              </div>

              {/* Utility Cycle Theme Button */}
              <button 
                onClick={cycleTheme}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Cycle Theme"
              >
                {theme === 'light' ? <Sun size={15} /> : theme === 'dark' ? <Moon size={15} /> : <Laptop size={15} />}
              </button>

              {/* History button opens audit log */}
              <button 
                onClick={() => setIsHistoryOpen(true)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Audit Log / History"
              >
                <Clock size={15} />
              </button>

              {/* Bell with red notification badge, toggles popover */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`p-1.5 rounded-lg transition-colors relative cursor-pointer ${isNotifOpen ? 'bg-neutral-100 dark:bg-white/5 text-foreground' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
                  title="Notifications"
                >
                  <Bell size={15} />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </button>

                {/* Notifications Popover list */}
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsNotifOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-card p-1 shadow-2xl z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-3 border-b border-neutral-100 dark:border-neutral-900/60 flex justify-between items-center">
                        <span className="text-xs font-bold text-foreground">Notifications</span>
                        <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{getNotifications().length} Baru</span>
                      </div>
                      <div className="divide-y divide-neutral-100/60 dark:divide-neutral-900/40 max-h-[250px] overflow-y-auto no-scrollbar">
                        {getNotifications().map((n, idx) => (
                          <div key={idx} className="p-3 hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors text-xs space-y-0.5">
                            <div className="flex justify-between items-start gap-1">
                              <span className="font-semibold text-foreground leading-tight truncate max-w-[180px]">{n.title}</span>
                              <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-mono shrink-0">{n.time}</span>
                            </div>
                            <p className="text-[10px] text-neutral-600 dark:text-neutral-400 leading-normal">{n.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Layout details toggle */}
              <button 
                onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isRightPanelOpen ? 'text-primary bg-primary/10' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
                title="Toggle Right Panel"
              >
                <LayoutDashboard size={15} />
              </button>
            </div>

          </div>

          {/* MAIN PAGE BODY SCROLL CONTAINER WITH OPTIONAL RIGHT SIDEBAR */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Left side: Actual page content (scrollable, no scrollbars visible) */}
            <div className="flex-1 overflow-auto p-8 max-w-[1600px] w-full mx-auto no-scrollbar">
              <Outlet />
            </div>

            {/* Right side: Mockup Right Panel (Notifications, Activities, Staff On-Duty) */}
            {isRightPanelOpen && (
              <aside className="w-[285px] border-l border-neutral-200 dark:border-neutral-900/60 bg-background overflow-y-auto p-6 hidden xl:flex flex-col gap-6 no-scrollbar animate-in slide-in-from-right duration-250 shrink-0">
                {/* 1. Notifications */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">Notifications</span>
                  <div className="space-y-3.5">
                    {getNotifications().map((item, idx) => (
                      <div key={idx} className="flex gap-3 text-xs leading-normal">
                        <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-[10px] shrink-0 border border-neutral-250 dark:border-neutral-800">
                          {item.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-foreground font-semibold truncate leading-tight">{item.title}</p>
                          <p className="text-[10px] text-neutral-600 dark:text-neutral-400 leading-normal mt-0.5">{item.desc}</p>
                          <span className="text-[9px] text-primary font-bold mt-0.5 block">{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Activities */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">Activities</span>
                  <div className="space-y-3.5 relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[1px] before:bg-neutral-250 dark:before:bg-neutral-900">
                    {getActivities().map((item, idx) => (
                      <div key={idx} className="relative text-xs leading-normal">
                        <span className="absolute -left-[19px] top-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                        <p className="text-foreground font-semibold truncate leading-tight">{item.title}</p>
                        <p className="text-[10px] text-neutral-600 dark:text-neutral-400 leading-normal mt-0.5">{item.desc}</p>
                        <span className="text-[9px] text-neutral-500 font-mono mt-0.5 block">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Staff On-Duty */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block">Staff On-Duty</span>
                  <div className="space-y-3">
                    {getStaffOnDuty().map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs">
                        <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-900 text-[9px] text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-bold relative border border-neutral-250 dark:border-neutral-800">
                          {item.initials}
                          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-background" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-foreground font-medium truncate block leading-tight">{item.name}</span>
                          <span className="text-[9px] text-neutral-600 dark:text-neutral-450 block">{item.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}

          </div>
        </div>
      </main>

      {/* COMMAND PALETTE SEARCH MODAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setIsSearchOpen(false)} />
          <div className="bg-card border border-neutral-200 dark:border-neutral-850 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-900/60 flex items-center gap-3">
              <Search size={16} className="text-neutral-400" />
              <input 
                type="text" 
                placeholder="Cari transaksi, layanan, pelanggan..." 
                className="w-full bg-transparent border-none text-sm text-foreground focus:outline-none placeholder-neutral-400"
                autoFocus
              />
              <button onClick={() => setIsSearchOpen(false)} className="text-[9px] font-mono px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-450 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-900">
                ESC
              </button>
            </div>
            <div className="p-2 max-h-[300px] overflow-y-auto space-y-1 no-scrollbar">
              <div className="px-3 py-1.5 text-[9px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Menu Cepat
              </div>
              {[
                { name: 'Dashboard Default', path: '/dashboard', desc: 'Ringkasan performa utama' },
                { name: 'Daftar Layanan Laundry', path: '/dashboard/services', desc: 'Kelola paket cuci, setrika, dll' },
                { name: 'Manajemen Pelanggan', path: '/dashboard/customers', desc: 'Kelola data dan history customer' },
                { name: 'Catat / Lihat Transaksi', path: '/dashboard/transactions', desc: 'Nota masuk, status pakaian, rekap kasir' }
              ].map(item => (
                <div 
                  key={item.path} 
                  onClick={() => {
                    navigate(item.path);
                    setIsSearchOpen(false);
                  }}
                  className="p-3 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors text-left"
                >
                  <div className="text-xs font-semibold text-foreground">{item.name}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY AUDIT LOG MODAL */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setIsHistoryOpen(false)} />
          <div className="bg-card border border-neutral-200 dark:border-neutral-850 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-900/60 flex justify-between items-center">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Aktivitas Audit Kasir</span>
              <button onClick={() => setIsHistoryOpen(false)} className="text-neutral-400 hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
              {[
                { user: 'Admin CDC', action: 'Mengubah status transaksi #CDC-8809 menjadi selesai', time: '10 menit yang lalu' },
                { user: 'Admin CDC', action: 'Membuat nota transaksi baru #CDC-8812', time: '15 menit yang lalu' },
                { user: 'Admin CDC', action: 'Mengekspor laporan CSV rekapitulasi kasir', time: '30 menit yang lalu' },
                { user: 'Admin CDC', action: 'Mengubah harga layanan Setrika Kilat', time: '1 jam yang lalu' }
              ].map((log, idx) => (
                <div key={idx} className="flex gap-3 text-xs text-left">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-neutral-750 dark:text-neutral-200 font-medium">{log.action}</p>
                    <div className="flex gap-2 text-[9px] text-neutral-400 font-mono">
                      <span>Oleh: {log.user}</span>
                      <span>•</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}