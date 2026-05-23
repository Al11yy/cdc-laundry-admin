import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/axios';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, Plus, 
  ArrowUpRight, Calendar,
  ChevronDown, FileText
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [custCount, setCustCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [globalDateFilter, setGlobalDateFilter] = useState<'hari-ini' | 'minggu-ini' | 'bulan-ini' | 'sepanjang-masa'>('minggu-ini');
  const [dateFilterOpen, setDateFilterOpen] = useState(false);

  const fetchData = async (filterVal: string) => {
    try {
      const params = filterVal === 'sepanjang-masa' ? {} : { filter: filterVal };
      const [resIncome, resStats, resTrx, resCust] = await Promise.all([
        apiClient.get('/reports/income', { params }),
        apiClient.get('/reports/statistics', { params }),
        apiClient.get('/transactions'),
        apiClient.get('/customers')
      ]);
      console.log('Income reports loaded:', resIncome.data);
      console.log('Statistics reports loaded:', resStats.data);
      const trxList = resTrx.data?.data || resTrx.data || [];
      setAllTransactions(trxList);
      const custList = resCust.data?.data || resCust.data || [];
      setAllCustomers(custList);
      setCustCount(custList.length);
    } catch (error) { 
      console.error("Gagal load dashboard", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(globalDateFilter); 
  }, [globalDateFilter]);

  const countByStatus = (status: string) => 
    allTransactions.filter((t: any) => t.status.toLowerCase() === status.toLowerCase()).length;

  // Filter transactions based on globalDateFilter
  const getFilteredTransactions = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return allTransactions.filter((t: any) => {
      if (!t.created_at) return false;
      const tDate = new Date(t.created_at);
      
      if (globalDateFilter === 'hari-ini') {
        return tDate >= todayStart;
      } else if (globalDateFilter === 'minggu-ini') {
        const startOfWeek = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        return tDate >= startOfWeek;
      } else if (globalDateFilter === 'bulan-ini') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return tDate >= startOfMonth;
      }
      return true;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  const getFilteredCustomers = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return allCustomers.filter((c: any) => {
      if (!c.created_at) return false;
      const cDate = new Date(c.created_at);
      
      if (globalDateFilter === 'hari-ini') {
        return cDate >= todayStart;
      } else if (globalDateFilter === 'minggu-ini') {
        const startOfWeek = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        return cDate >= startOfWeek;
      } else if (globalDateFilter === 'bulan-ini') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return cDate >= startOfMonth;
      }
      return true;
    });
  };

  const totalIncomeFiltered = filteredTransactions
    .reduce((sum: number, t: any) => sum + Number(t.total_price || 0), 0);

  const totalIncomeAllTime = allTransactions
    .reduce((sum: number, t: any) => sum + Number(t.total_price || 0), 0);

  const getPeriodLabel = () => {
    switch (globalDateFilter) {
      case 'hari-ini': return 'Pendapatan Hari Ini';
      case 'minggu-ini': return 'Pendapatan Minggu Ini';
      case 'bulan-ini': return 'Pendapatan Bulan Ini';
      case 'sepanjang-masa': return 'Pendapatan Sepanjang Masa';
      default: return 'Pendapatan Periode Ini';
    }
  };

  const getPeriodSubtext = () => {
    switch (globalDateFilter) {
      case 'hari-ini': return 'Omzet kotor hari ini';
      case 'minggu-ini': return 'Omzet kotor minggu berjalan';
      case 'bulan-ini': return 'Omzet kotor bulan berjalan';
      case 'sepanjang-masa': return 'Omzet kotor sepanjang masa';
      default: return 'Omzet kotor periode berjalan';
    }
  };

  // Hitung popularitas layanan untuk Donut Chart dari data terfilter
  const getServicePopularity = () => {
    const counts: { [key: string]: number } = {};
    filteredTransactions.forEach((t: any) => {
      const name = t.service?.service_name || 'Lainnya';
      counts[name] = (counts[name] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const servicePopularityData = getServicePopularity();

  // Generate data grafik AreaChart dinamis sesuai filter
  const getChartData = () => {
    const dataMap: { [key: string]: number } = {};
    const now = new Date();
    
    if (globalDateFilter === 'hari-ini') {
      const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      hours.forEach(h => { dataMap[h] = 0; });
      
      filteredTransactions.forEach((t: any) => {
        if (!t.created_at) return;
        const date = new Date(t.created_at);
        const hour = date.getHours();
        const bracket = hours.find((h, idx) => {
          const hVal = parseInt(h.split(':')[0]);
          const nextHVal = hours[idx + 1] ? parseInt(hours[idx + 1].split(':')[0]) : 24;
          return hour >= hVal && hour < nextHVal;
        }) || '08:00';
        dataMap[bracket] = (dataMap[bracket] || 0) + Number(t.total_price || 0);
      });
    } else if (globalDateFilter === 'minggu-ini') {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const last7Days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(days[d.getDay()]);
      }
      last7Days.forEach(day => { dataMap[day] = 0; });
      
      filteredTransactions.forEach((t: any) => {
        if (!t.created_at) return;
        const date = new Date(t.created_at);
        const dayName = days[date.getDay()];
        if (dayName in dataMap) {
          dataMap[dayName] = (dataMap[dayName] || 0) + Number(t.total_price || 0);
        }
      });
    } else if (globalDateFilter === 'bulan-ini') {
      // bulan-ini: tampilkan 15 hari terakhir agar grafik tidak terlalu padat
      const last15DaysLabels: string[] = [];
      for (let i = 14; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        last15DaysLabels.push(label);
        dataMap[label] = 0;
      }
      
      filteredTransactions.forEach((t: any) => {
        if (!t.created_at) return;
        const date = new Date(t.created_at);
        const label = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (label in dataMap) {
          dataMap[label] = (dataMap[label] || 0) + Number(t.total_price || 0);
        }
      });
    } else {
      // sepanjang-masa: group by Month-Year chronologically
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const tempMap: { [key: string]: { label: string; value: number; sortKey: number } } = {};
      
      filteredTransactions.forEach((t: any) => {
        if (!t.created_at) return;
        const date = new Date(t.created_at);
        const y = date.getFullYear();
        const m = date.getMonth();
        const sortKey = y * 100 + m;
        const label = `${months[m]} ${String(y).slice(-2)}`;
        
        if (!tempMap[label]) {
          tempMap[label] = { label, value: 0, sortKey };
        }
        tempMap[label].value += Number(t.total_price || 0);
      });
      
      const sorted = Object.values(tempMap).sort((a, b) => a.sortKey - b.sortKey);
      
      if (sorted.length === 0) {
        // Fallback to show current month if no data
        const label = `${months[now.getMonth()]} ${String(now.getFullYear()).slice(-2)}`;
        return [{ date: label, total_income: 0 }];
      }
      
      return sorted.map(item => ({
        date: item.label,
        total_income: item.value
      }));
    }
    
    return Object.entries(dataMap).map(([key, val]) => ({
      date: key,
      total_income: val
    }));
  };

  const chartData = getChartData();

  const getBarChartData = () => {
    const dataMap: { [key: string]: { total: number; completed: number } } = {};
    
    if (globalDateFilter === 'hari-ini') {
      const hours = ['08:00', '12:00', '16:00', '20:00'];
      hours.forEach(h => { dataMap[h] = { total: 0, completed: 0 }; });
      filteredTransactions.forEach((t: any) => {
        if (!t.created_at) return;
        const date = new Date(t.created_at);
        const hour = date.getHours();
        const bracket = hours.find((h, idx) => {
          const hVal = parseInt(h.split(':')[0]);
          const nextHVal = hours[idx + 1] ? parseInt(hours[idx + 1].split(':')[0]) : 24;
          return hour >= hVal && hour < nextHVal;
        }) || '08:00';
        dataMap[bracket].total += 1;
        if (t.status === 'siap diambil' || t.status === 'diambil') {
          dataMap[bracket].completed += 1;
        }
      });
    } else if (globalDateFilter === 'minggu-ini') {
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const last7Days: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(days[d.getDay()]);
      }
      last7Days.forEach(day => { dataMap[day] = { total: 0, completed: 0 }; });
      
      filteredTransactions.forEach((t: any) => {
        if (!t.created_at) return;
        const date = new Date(t.created_at);
        const dayName = days[date.getDay()];
        if (dayName in dataMap) {
          dataMap[dayName].total += 1;
          if (t.status === 'siap diambil' || t.status === 'diambil') {
            dataMap[dayName].completed += 1;
          }
        }
      });
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const last6Months: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        last6Months.push(months[d.getMonth()]);
      }
      last6Months.forEach(m => { dataMap[m] = { total: 0, completed: 0 }; });
      
      filteredTransactions.forEach((t: any) => {
        if (!t.created_at) return;
        const date = new Date(t.created_at);
        const label = months[date.getMonth()];
        if (label in dataMap) {
          dataMap[label].total += 1;
          if (t.status === 'siap diambil' || t.status === 'diambil') {
            dataMap[label].completed += 1;
          }
        }
      });
    }
    
    return Object.entries(dataMap).map(([key, val]) => ({
      name: key,
      Total: val.total,
      Selesai: val.completed
    }));
  };

  const barChartData = getBarChartData();

  // Aksi Ekspor Laporan Rekapitulasi Kasir
  const handleExportReport = () => {
    if (filteredTransactions.length === 0) {
      toast.error('Tidak ada data transaksi untuk diekspor!');
      return;
    }

    const toastId = toast.loading('Mengekspor laporan...', {
      description: 'Menyiapkan berkas CSV rekapitulasi kasir...'
    });

    setTimeout(() => {
      try {
        const headers = ['Kode Invoice', 'Pelanggan', 'Layanan', 'Total Harga', 'Status', 'Tanggal'];
        const csvRows = [headers.join(',')];

        filteredTransactions.forEach((t: any) => {
          const row = [
            t.invoice_code || '',
            t.customer?.user?.name || 'Pelanggan',
            t.service?.service_name || '',
            t.total_price || 0,
            t.status || '',
            t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID') : ''
          ].map(val => `"${String(val).replace(/"/g, '""')}"`);
          csvRows.push(row.join(','));
        });

        const csvContent = "\uFEFF" + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        
        const dateFilterLabel = 
          globalDateFilter === 'hari-ini' ? 'Hari_Ini' :
          globalDateFilter === 'minggu-ini' ? 'Minggu_Ini' :
          globalDateFilter === 'bulan-ini' ? 'Bulan_Ini' :
          'Sepanjang_Masa';
          
        link.setAttribute("download", `Laporan_CDC_Laundry_${dateFilterLabel}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.dismiss(toastId);
        toast.success('Ekspor Berhasil', {
          description: `Laporan rekapitulasi (${filteredTransactions.length} transaksi) berhasil diunduh.`
        });
      } catch (err) {
        console.error(err);
        toast.dismiss(toastId);
        toast.error('Gagal mengekspor laporan.');
      }
    }, 800);
  };

  const recentTransactions = allTransactions.slice(0, 5);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
          <p className="text-xs text-muted-foreground font-medium font-mono">MEMUAT DATA DASHBOARD...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-background font-sans antialiased text-foreground">
      
      {/* 0. HEADER CONTROL BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground uppercase">Overview</h1>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            Real-time status dan metrik operasional laundry Anda.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Global Date Filter Dropdown */}
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDateFilterOpen(!dateFilterOpen)}
              className="h-8 text-xs gap-1.5 rounded-xl border-neutral-200 dark:border-neutral-800 bg-card hover:bg-neutral-100 dark:hover:bg-neutral-900 text-foreground transition-all"
            >
              <Calendar size={12} className="text-primary" />
              <span>
                {globalDateFilter === 'hari-ini' ? 'Hari Ini' :
                 globalDateFilter === 'minggu-ini' ? 'Minggu Ini' :
                 globalDateFilter === 'bulan-ini' ? 'Bulan Ini' :
                 'Sepanjang Masa'}
              </span>
              <ChevronDown size={10} className="text-neutral-400" />
            </Button>
            
            {dateFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDateFilterOpen(false)} />
                <div className="absolute right-0 mt-1 w-40 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-card p-1 shadow-lg z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                  {[
                    { value: 'hari-ini', label: 'Hari Ini' },
                    { value: 'minggu-ini', label: 'Minggu Ini' },
                    { value: 'bulan-ini', label: 'Bulan Ini' },
                    { value: 'sepanjang-masa', label: 'Sepanjang Masa' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        setGlobalDateFilter(item.value as any);
                        setDateFilterOpen(false);
                        toast.info(`Filter Rentang Waktu Diubah`, {
                          description: `Menampilkan data untuk: ${item.label}`
                        });
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        globalDateFilter === item.value 
                          ? 'bg-neutral-100 dark:bg-white/5 text-foreground font-semibold' 
                          : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-white/5'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Export button */}
          <Button 
            onClick={handleExportReport} 
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 rounded-xl border-neutral-200 dark:border-neutral-800 bg-card hover:bg-neutral-100 dark:hover:bg-neutral-900 text-foreground transition-all cursor-pointer"
          >
            <FileText size={12} className="text-primary" />
            <span>Ekspor CSV</span>
          </Button>

          {/* Catat Transaksi button */}
          <Button 
            onClick={() => navigate('/dashboard/transactions')} 
            className="bg-primary hover:bg-primary/90 text-white gap-1.5 font-medium text-xs h-8 px-3.5 rounded-xl shadow-md transition-all shrink-0"
          >
            <Plus size={13} /> <span>Catat</span>
          </Button>
        </div>
      </div>

      {/* 1. ROW 1: 2X2 CARDS GRID & PROJECTIONS BAR CHART */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        
        {/* Left column: 2x2 cards */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          
          {/* Card 1: Pelanggan (Soft Pastel CDC Green) */}
          <div className="bg-[#f0f9eb] border border-[#7ec143]/30 text-slate-800 dark:bg-[#7ec143]/10 dark:border-[#7ec143]/20 dark:text-[#8cd64f] rounded-[24px] p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-650 dark:text-[#8cd64f]/80 uppercase tracking-wider block">Pelanggan</span>
              <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-[#8cd64f]">{custCount}</div>
            </div>
            <div className="text-[10px] font-medium text-slate-600 dark:text-[#8cd64f]/80 mt-6 flex items-center gap-1">
              <span className="text-emerald-700 dark:text-[#8cd64f] font-bold flex items-center">
                +11.01% <ArrowUpRight size={10} />
              </span> 
              <span>terdaftar</span>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 bg-[#7ec143]/10 rounded-full blur-xl group-hover:bg-[#7ec143]/20 transition-all duration-300" />
          </div>

          {/* Card 2: Pelanggan Baru (Deep Dark Card) */}
          <div className="bg-card border border-neutral-200 dark:border-neutral-900/60 rounded-[24px] p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">Pelanggan Baru</span>
              <div className="text-3xl font-bold tracking-tight text-foreground">{getFilteredCustomers().length}</div>
            </div>
            <div className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 mt-6 flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-500 font-bold flex items-center">
                +{getFilteredCustomers().length} <ArrowUpRight size={10} />
              </span> 
              <span>terdaftar baru</span>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all duration-300" />
          </div>

          {/* Card 3: Pendapatan Periode Ini (Deep Dark Card) */}
          <div className="bg-card border border-neutral-200 dark:border-neutral-900/60 rounded-[24px] p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">{getPeriodLabel()}</span>
              <div className="text-xl font-bold tracking-tight text-foreground truncate">
                Rp {totalIncomeFiltered.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400 mt-6 flex items-center gap-1 truncate">
              {getPeriodSubtext()}
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all duration-300" />
          </div>

          {/* Card 4: Total Omzet (Soft Pastel CDC Blue) */}
          <div className="bg-[#e6f4fc] border border-[#0082c3]/30 text-slate-800 dark:bg-[#0082c3]/10 dark:border-[#0082c3]/20 dark:text-[#009ceb] rounded-[24px] p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-650 dark:text-[#009ceb]/80 uppercase tracking-wider block">Total Omzet</span>
              <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-[#009ceb] truncate">
                Rp {totalIncomeAllTime.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="text-[10px] font-medium text-slate-600 dark:text-[#009ceb]/80 mt-6 flex items-center gap-1">
              <span className="text-sky-800 dark:text-[#009ceb] font-bold flex items-center">
                +30.1% <ArrowUpRight size={10} />
              </span> 
              <span>all-time growth</span>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 bg-[#0082c3]/10 rounded-full blur-xl group-hover:bg-[#0082c3]/20 transition-all duration-300" />
          </div>

        </div>

        {/* Right column: Projections vs Actuals double bar chart */}
        <Card className="lg:col-span-6 bg-card border-neutral-100 dark:border-neutral-900/60 rounded-[28px] p-5 flex flex-col justify-between shadow-sm h-[260px] lg:h-auto">
          <div className="pb-3 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">Volume Transaksi</span>
              <CardTitle className="text-xs font-semibold text-foreground">Target vs Realisasi (Selesai)</CardTitle>
            </div>
            {/* Minimalist chart legends matching brand blue and brand green */}
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#0082c3]" />
                <span className="text-neutral-450 dark:text-neutral-500">Total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#7ec143]" />
                <span className="text-neutral-450 dark:text-neutral-500">Selesai</span>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[150px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--muted-foreground)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dy={5}
                />
                <YAxis 
                  stroke="var(--muted-foreground)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-5}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)', 
                    borderRadius: '12px',
                    color: 'var(--foreground)',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar 
                  dataKey="Total" 
                  fill="#0082c3" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={12}
                />
                <Bar 
                  dataKey="Selesai" 
                  fill="#7ec143" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 2. ROW 2: REVENUE LINE CHART & OPERATIONAL STATUS PROGRESS BARS */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        
        {/* Left side: Revenue Line Chart (Area Chart) */}
        <Card className="lg:col-span-8 bg-card border-neutral-100 dark:border-neutral-900/60 rounded-[28px] p-5 flex flex-col h-[320px] shadow-sm">
          <div className="pb-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900/40">
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">Keuangan</span>
              <CardTitle className="text-xs font-semibold text-foreground">Tren Pemasukan Laundry</CardTitle>
            </div>
            <div className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
              Nilai dalam Rupiah (Rp)
            </div>
          </div>
          
          <div className="flex-1 pt-6 pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.005}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.15} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--muted-foreground)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={5}
                />
                <YAxis 
                  stroke="var(--muted-foreground)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={-5}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')} jt`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)} rb`;
                    return `${val}`;
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)', 
                    borderRadius: '12px',
                    color: 'var(--foreground)',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                  formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pendapatan']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total_income" 
                  stroke="var(--color-primary)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#neonGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right side: Operational status list with progress bars (Mockup style "Revenue by Location") */}
        <Card className="lg:col-span-4 bg-card border-neutral-100 dark:border-neutral-900/60 rounded-[28px] p-5 flex flex-col h-[320px] shadow-sm justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">Operasional</span>
            <CardTitle className="text-xs font-semibold text-foreground">Distribusi Status Transaksi</CardTitle>
          </div>

          <div className="space-y-4 pt-3 flex-1 flex flex-col justify-center">
            {/* Status Item 1: Antrian */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-neutral-500 dark:text-neutral-400">Antrian Baru</span>
                <span className="text-foreground font-semibold">{countByStatus('antrian')} Nota</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                <div 
                  className="h-full bg-sky-400 transition-all duration-500" 
                  style={{ width: `${filteredTransactions.length > 0 ? (countByStatus('antrian') / filteredTransactions.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Status Item 2: Diproses */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-neutral-500 dark:text-neutral-400">Sedang Diproses</span>
                <span className="text-foreground font-semibold">{countByStatus('dicuci') + countByStatus('disetrika')} Nota</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${filteredTransactions.length > 0 ? ((countByStatus('dicuci') + countByStatus('disetrika')) / filteredTransactions.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Status Item 3: Siap Diambil */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-neutral-500 dark:text-neutral-400">Siap Diambil</span>
                <span className="text-foreground font-semibold">{countByStatus('siap diambil')} Nota</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${filteredTransactions.length > 0 ? (countByStatus('siap diambil') / filteredTransactions.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Status Item 4: Diambil */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-neutral-500 dark:text-neutral-400">Sudah Diambil (Selesai)</span>
                <span className="text-foreground font-semibold">{countByStatus('diambil')} Nota</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                <div 
                  className="h-full bg-[#c3d4e3] dark:bg-neutral-600 transition-all duration-500" 
                  style={{ width: `${filteredTransactions.length > 0 ? (countByStatus('diambil') / filteredTransactions.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. ROW 3: RECENT TRANSACTIONS TABLE & SERVICES DONUT CHART */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        
        {/* Left side: Recent Transactions (Mockup style "Top Selling Products") */}
        <Card className="lg:col-span-8 bg-card border-neutral-100 dark:border-neutral-900/60 rounded-[28px] p-5 flex flex-col shadow-sm min-h-[350px]">
          <div className="pb-3 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900/40">
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">Nota Transaksi</span>
              <CardTitle className="text-xs font-semibold text-foreground">Transaksi Terbaru</CardTitle>
            </div>
            <button 
              onClick={() => navigate('/dashboard/transactions')} 
              className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-primary transition-colors font-semibold"
            >
              Lihat Semua →
            </button>
          </div>

          <div className="flex-1 overflow-x-auto pt-3">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-900 text-neutral-400 dark:text-neutral-500 font-medium">
                  <th className="py-2.5 px-3">Pelanggan</th>
                  <th className="py-2.5 px-3">Kode Invoice</th>
                  <th className="py-2.5 px-3">Layanan</th>
                  <th className="py-2.5 px-3">Total Harga</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100/40 dark:divide-neutral-900/40">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-neutral-400 font-mono">
                      Belum ada transaksi.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-semibold text-foreground">
                        {trx.customer?.user?.name || 'Pelanggan'}
                      </td>
                      <td className="py-3 px-3 font-mono text-neutral-500">{trx.invoice_code}</td>
                      <td className="py-3 px-3 text-neutral-600 dark:text-neutral-400">
                        {trx.service?.service_name || '-'}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-foreground">
                        Rp {Number(trx.total_price).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${
                          trx.status === 'antrian' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                          trx.status === 'dicuci' || trx.status === 'disetrika' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          trx.status === 'siap diambil' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                        }`}>
                          {trx.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-neutral-400 dark:text-neutral-500 font-mono">
                        {trx.created_at ? new Date(trx.created_at).toLocaleDateString('id-ID') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right side: Services Donut Chart (Mockup style "Total Sales") */}
        <Card className="lg:col-span-4 bg-card border-neutral-100 dark:border-neutral-900/60 rounded-[28px] p-5 flex flex-col justify-between shadow-sm min-h-[350px]">
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">Kategori</span>
            <CardTitle className="text-xs font-semibold text-foreground">Layanan Terlaris</CardTitle>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center pt-2">
            {servicePopularityData.length === 0 ? (
              <p className="text-xs text-neutral-450 dark:text-neutral-500 font-mono py-8">Tidak ada data layanan</p>
            ) : (
              <>
                  <div className="h-44 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={servicePopularityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {servicePopularityData.map((_, index) => {
                            const pieColors = ['#0082c3', '#7ec143', '#00a3f5', '#a2e06c', '#006192', '#59942a'];
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={pieColors[index % pieColors.length]} 
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'var(--card)', 
                            borderColor: 'var(--border)', 
                            borderRadius: '12px',
                            color: 'var(--foreground)',
                            fontSize: '10px',
                            fontFamily: 'monospace'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Total</span>
                      <span className="text-base font-bold text-foreground">{filteredTransactions.length}</span>
                    </div>
                  </div>
                  
                  {/* Clean Custom legend with percentage metrics */}
                  <div className="w-full mt-4 space-y-1.5 px-2 max-h-[120px] overflow-y-auto scrollbar-thin">
                    {servicePopularityData.map((item, idx) => {
                      const pct = filteredTransactions.length > 0 
                        ? Math.round((item.value / filteredTransactions.length) * 100) 
                        : 0;
                      const pieColors = ['#0082c3', '#7ec143', '#00a3f5', '#a2e06c', '#006192', '#59942a'];
                      return (
                        <div key={item.name} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span 
                              className="w-1.5 h-1.5 rounded-sm shrink-0" 
                              style={{ 
                                backgroundColor: pieColors[idx % pieColors.length]
                              }} 
                            />
                            <span className="text-neutral-455 dark:text-neutral-400 truncate max-w-[120px]">{item.name}</span>
                          </div>
                          <span className="font-mono font-semibold text-foreground shrink-0">{item.value} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
              </>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}