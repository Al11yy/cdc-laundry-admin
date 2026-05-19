import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Users, Receipt, Activity, Loader2, Plus, WashingMachine, RefreshCcw, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_income: 0, monthly_income: 0, total_all: 0 });
  const [dailyStats, setDailyStats] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [resIncome, resStats, resTrx] = await Promise.all([
        apiClient.get('/reports/income'),
        apiClient.get('/reports/statistics'),
        apiClient.get('/transactions')
      ]);
      setStats(resIncome.data.data);
      setDailyStats(resStats.data.data.daily_stats);
      setRecentTransactions(resTrx.data.data.slice(0, 5));
    } catch (error) { console.error("Gagal load dashboard", error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Hitung jumlah status (Fitur Status Overview)
  const countByStatus = (status: string) => recentTransactions.filter((t: any) => t.status === status).length;

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;

  return (
    <div className="space-y-8">
      {/* 1. QUICK ACTION BAR */}
      <div className="flex gap-4">
        <Button onClick={() => navigate('/transactions')} className="gap-2"><Plus size={16} /> Transaksi Baru</Button>
        <Button onClick={() => navigate('/dashboard/customers')} variant="outline" className="gap-2"><Users size={16} /> Pelanggan Baru</Button>
        <Button onClick={() => navigate('/dashboard/services')} variant="outline" className="gap-2"><WashingMachine size={16} /> Layanan Baru</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pendapatan Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">Rp {Number(stats.total_income).toLocaleString('id-ID')}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Transaksi</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total_all}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Bulan Ini</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">Rp {Number(stats.monthly_income).toLocaleString('id-ID')}</div></CardContent></Card>
      </div>

      {/* 2. LAUNDRY STATUS OVERVIEW */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-orange-50 border-orange-200"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><RefreshCcw size={16}/> Antrian</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-700">{countByStatus('antrian')}</div></CardContent></Card>
        <Card className="bg-blue-50 border-blue-200"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><WashingMachine size={16}/> Diproses</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-700">{countByStatus('dicuci') + countByStatus('disetrika')}</div></CardContent></Card>
        <Card className="bg-green-50 border-green-200"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle size={16}/> Siap Diambil</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-700">{countByStatus('siap diambil')}</div></CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Statistik Transaksi Harian</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_transactions" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader><CardTitle>Transaksi Terbaru</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Nota</TableHead><TableHead>Pelanggan</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {recentTransactions.map((trx: any) => (
                  <TableRow key={trx.id}>
                    <TableCell className="font-mono font-bold">{trx.invoice_code}</TableCell>
                    <TableCell>{trx.customer?.user?.name}</TableCell>
                    <TableCell><Badge className="bg-slate-100 text-slate-800">{trx.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}