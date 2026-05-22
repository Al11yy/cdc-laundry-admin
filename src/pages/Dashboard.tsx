import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, Plus, ReceiptText, 
  ArrowUpRight, TrendingUp, Calendar,
  ChevronDown, FileText
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalDateFilter, setGlobalDateFilter] = useState<'hari-ini' | 'minggu-ini' | 'bulan-ini' | 'sepanjang-masa'>('minggu-ini');
  const [dateFilterOpen, setDateFilterOpen] = useState(false);

  const fetchData = async (filterVal: string) => {
    try {
      const params = filterVal === 'sepanjang-masa' ? {} : { filter: filterVal };
      const [resIncome, resStats, resTrx] = await Promise.all([
        apiClient.get('/reports/income', { params }),
        apiClient.get('/reports/statistics', { params }),
        apiClient.get('/transactions')
      ]);
      console.log('Income reports loaded:', resIncome.data);
      console.log('Statistics reports loaded:', resStats.data);
      const trxList = resTrx.data?.data || resTrx.data || [];
      setAllTransactions(trxList);
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
    <div className="space-y-8 bg-background">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-5">
        {/* Row 1: Title & Sync */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Status operasi, transaksi masuk, dan rekapitulasi keuangan laundry.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => navigate('/dashboard/transactions')} 
              className="bg-primary hover:bg-primary/95 text-white gap-1.5 font-medium text-xs h-9 px-4 rounded-xl shadow-md transition-all duration-200 shrink-0"
            >
              <Plus size={14} /> Catat Transaksi
            </Button>
          </div>
        </div>
 
        {/* Row 2: Global Controls Toolbar */}
        <div className="flex items-center justify-between gap-3 bg-muted/40 border border-border/60 rounded-2xl p-3 shadow-sm">
          {/* Sisi Kiri: Global Date Filter */}
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDateFilterOpen(!dateFilterOpen)}
              className="h-9 text-xs gap-1.5 rounded-xl border-border bg-card hover:bg-muted text-foreground transition-all duration-200"
            >
              <Calendar size={12} className="text-primary" />
              <span>
                Filter: {
                  globalDateFilter === 'hari-ini' ? 'Hari Ini' :
                  globalDateFilter === 'minggu-ini' ? 'Minggu Ini' :
                  globalDateFilter === 'bulan-ini' ? 'Bulan Ini' :
                  'Sepanjang Masa'
                }
              </span>
              <ChevronDown size={12} className="text-muted-foreground" />
            </Button>
            
            {dateFilterOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDateFilterOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-40 rounded-xl border border-border bg-card p-1 shadow-lg z-20 animate-in fade-in slide-in-from-top-1 duration-200">
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
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${
                        globalDateFilter === item.value 
                          ? 'bg-primary/10 text-primary font-semibold' 
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sisi Kanan: Ekspor Laporan */}
          <div>
            <Button 
              onClick={handleExportReport} 
              variant="outline"
              size="sm"
              className="h-9 text-xs gap-1.5 rounded-xl border-border bg-card hover:bg-muted text-foreground transition-all duration-200 cursor-pointer"
            >
              <FileText size={12} className="text-primary" />
              <span>Ekspor Laporan</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 1. CARDS UTAMA KEUANGAN & OPERASIONAL (3 Columns) */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="bg-card border-border rounded-2xl shadow-sm relative overflow-hidden group p-5">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Total Pendapatan</span>
              <TrendingUp size={16} className="text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-3xl font-bold tracking-tight text-foreground">
              Rp {totalIncomeAllTime.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1 font-mono">
              <span className="text-primary font-semibold flex items-center">
                +12% <ArrowUpRight size={10} />
              </span> 
              dari bulan kemarin
            </p>
          </CardContent>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-300" />
        </Card>

        <Card className="bg-card border-border rounded-2xl shadow-sm relative overflow-hidden group p-5">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>{getPeriodLabel()}</span>
              <Calendar size={16} className="text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-3xl font-bold tracking-tight text-foreground">
              Rp {totalIncomeFiltered.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1 font-mono">
              {getPeriodSubtext()}
            </p>
          </CardContent>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-300" />
        </Card>

        <Card className="bg-card border-border rounded-2xl shadow-sm relative overflow-hidden group p-5">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Transaksi Masuk</span>
              <ReceiptText size={16} className="text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {filteredTransactions.length} Transaksi
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1 font-mono">
              Volume order dalam periode ini
            </p>
          </CardContent>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-300" />
        </Card>
      </div>

      {/* 2. STAT STATUS OPERASIONAL (Unified Status Bar) */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-stretch divide-y sm:divide-y-0 sm:divide-x divide-border shadow-sm gap-4 sm:gap-0">
        <div className="flex-1 flex items-center justify-between px-4 py-1.5 sm:py-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground font-mono">Antrian Baru</span>
          </div>
          <span className="text-lg font-bold text-foreground font-mono">{countByStatus('antrian')}</span>
        </div>
        
        <div className="flex-1 flex items-center justify-between px-4 py-1.5 sm:py-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary/70" />
            <span className="text-xs font-semibold text-muted-foreground font-mono">Sedang Diproses</span>
          </div>
          <span className="text-lg font-bold text-foreground font-mono">
            {countByStatus('dicuci') + countByStatus('disetrika')}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-between px-4 py-1.5 sm:py-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary/45" />
            <span className="text-xs font-semibold text-muted-foreground font-mono">Siap Diambil</span>
          </div>
          <span className="text-lg font-bold text-foreground font-mono">{countByStatus('siap diambil')}</span>
        </div>
      </div>

      {/* 3. GRAPHS, PIE CHART, WIDGETS, & RECENT TRANSACTIONS ACTIVITY FEED */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* GRAFIK TREN PEMASUKAN (lg:col-span-5) */}
        <Card className="bg-card border-border rounded-2xl shadow-sm lg:col-span-5 overflow-hidden p-5 flex flex-col h-[400px]">
          <CardHeader className="p-0 pb-5 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Tren Pemasukan</CardTitle>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Grafik perkembangan pendapatan laundry</p>
            </div>
          </CardHeader>
          <CardContent className="p-0 pt-5 flex-1 pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.55}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.01}/>
                  </linearGradient>
                  <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--color-primary)" floodOpacity="0.3" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--muted-foreground)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="var(--muted-foreground)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={-10}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')} jt`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)} rb`;
                    return `Rp ${val}`;
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
                  itemStyle={{ color: 'var(--color-primary)' }}
                  formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pendapatan']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total_income" 
                  stroke="var(--color-primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#purpleGradient)" 
                  filter="url(#glow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* KOLOM TENGAH: LAYANAN TERLARIS (lg:col-span-3) */}
        <div className="lg:col-span-3 h-[400px]">
          {/* Donut Chart */}
          <Card className="bg-card border-border rounded-2xl shadow-sm p-5 h-full flex flex-col justify-between animate-fade-in">
            <div className="border-b border-border pb-2 flex flex-col">
              <CardTitle className="text-xs font-semibold text-foreground uppercase tracking-wider">Layanan Terlaris</CardTitle>
              <span className="text-[9px] text-muted-foreground font-mono mt-0.5">Proporsi transaksi per kategori</span>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center pt-2">
              {servicePopularityData.length === 0 ? (
                <p className="text-xs text-muted-foreground font-mono py-8">Tidak ada data layanan</p>
              ) : (
                <>
                  <div className="h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={servicePopularityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={62}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {servicePopularityData.map((_, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill="var(--color-primary)" 
                              opacity={Math.max(0.2, 1 - index * 0.12)} 
                            />
                          ))}
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
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Total</span>
                      <span className="text-base font-bold text-foreground">{filteredTransactions.length}</span>
                    </div>
                  </div>
                  
                  {/* Custom legend */}
                  <div className="w-full mt-4 space-y-1.5 px-1 max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
                    {servicePopularityData.map((item, idx) => {
                      const pct = filteredTransactions.length > 0 
                        ? Math.round((item.value / filteredTransactions.length) * 100) 
                        : 0;
                      return (
                        <div key={item.name} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span 
                              className="w-2 h-2 rounded-sm shrink-0" 
                              style={{ 
                                backgroundColor: 'var(--color-primary)', 
                                opacity: Math.max(0.2, 1 - idx * 0.12) 
                              }} 
                            />
                            <span className="text-muted-foreground truncate max-w-[90px]">{item.name}</span>
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

        {/* TRANSAKSI TERBARU: ACTIVITY FEED (lg:col-span-4) */}
        <Card className="bg-card border-border rounded-2xl shadow-sm lg:col-span-4 p-5 flex flex-col h-[400px]">
          <CardHeader className="p-0 pb-3 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Transaksi Terbaru</CardTitle>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Aktivitas laundry terakhir</p>
            </div>
            <Button 
              variant="link" 
              onClick={() => navigate('/dashboard/transactions')} 
              className="text-xs text-primary hover:text-primary/80 px-0 h-auto font-mono"
            >
              Semua Nota →
            </Button>
          </CardHeader>
          <CardContent className="p-0 pt-5 flex-1 overflow-y-auto relative">
            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground font-mono">
                Belum ada data transaksi masuk.
              </div>
            ) : (
              <div className="relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60 space-y-5">
                {recentTransactions.map((trx) => {
                  const custName = trx.customer?.user?.name || 'Pelanggan';
                  const dateStr = trx.created_at 
                    ? new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
                    : '';
                  
                  let dotOpacity = 'opacity-100';
                  let statusBg = 'bg-primary';
                  if (trx.status === 'antrian') {
                    dotOpacity = 'opacity-100';
                    statusBg = 'bg-primary';
                  } else if (trx.status === 'dicuci' || trx.status === 'disetrika') {
                    dotOpacity = 'opacity-70';
                    statusBg = 'bg-primary/70';
                  } else {
                    dotOpacity = 'opacity-40';
                    statusBg = 'bg-primary/45';
                  }

                  return (
                    <div key={trx.id} className="relative flex justify-between items-start text-xs group/item hover:bg-muted/10 p-1.5 rounded-lg -mx-1.5 transition-all">
                      {/* Timeline Dot */}
                      <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border border-card ring-2 ring-background ${statusBg} ${dotOpacity}`} />
                      
                      <div className="space-y-0.5 pr-3 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-foreground truncate max-w-[110px]">{custName}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">{trx.invoice_code}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Layanan: <span className="font-medium text-foreground">{trx.service?.service_name || '-'}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${
                            trx.status === 'antrian' ? 'bg-primary/10 text-primary border-primary/20' :
                            trx.status === 'dicuci' || trx.status === 'disetrika' ? 'bg-primary/10 text-primary/80 border-primary/10' :
                            'bg-primary/5 text-primary/60 border-primary/5'
                          }`}>
                            {trx.status}
                          </span>
                          {dateStr && <span className="text-[9px] text-muted-foreground font-mono">{dateStr}</span>}
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0 font-mono">
                        <span className="font-bold text-foreground">
                          Rp {Number(trx.total_price).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}