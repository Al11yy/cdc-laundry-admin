import React, { useState, useEffect } from 'react';
import apiClient from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2, Receipt } from 'lucide-react';

// Interface untuk tipe data
interface Transaction {
  id: number;
  invoice_code: string;
  customer: { name: string };
  service: { service_name: string; price: number; unit: string };
  quantity: number;
  total_price: number;
  status: string;
}

interface Customer {
  id: number;
  name: string;
}

interface Service {
  id: number;
  service_name: string;
  price: number;
  unit: string;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State Form Transaksi Baru
  const [formData, setFormData] = useState({
    customer_id: '',
    service_id: '',
    quantity: '',
    status: 'Baru'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ambil semua data dari API Laravel lo
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resTx, resCust, resServ] = await Promise.all([
        apiClient.get('/transactions'),
        apiClient.get('/customers'),
        apiClient.get('/services')
      ]);
      
      setTransactions(resTx.data.data || resTx.data);
      setCustomers(resCust.data.data || resCust.data);
      setServices(resServ.data.data || resServ.data);
    } catch (error) {
      console.error('Gagal mengambil data transaksi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Simpan Transaksi Baru
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/transactions', formData);
      setIsModalOpen(false);
      setFormData({ customer_id: '', service_id: '', quantity: '', status: 'Baru' });
      fetchData(); // Refresh data biar langsung muncul
    } catch (error) {
      console.error('Gagal membuat transaksi:', error);
      alert('Gagal menyimpan transaksi! Cek tab Network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Hapus Transaksi
  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin mau menghapus data transaksi ini?')) return;
    try {
      await apiClient.delete(`/transactions/${id}`);
      fetchData();
    } catch (error) {
      console.error('Gagal menghapus transaksi:', error);
      alert('Gagal menghapus transaksi!');
    }
  };

  // Fungsi pembantu buat nyari warna Badge Status cucian
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Selesai':
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Selesai</Badge>;
      case 'Proses':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Proses</Badge>;
      case 'Diambil':
        return <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200">Sudah Diambil</Badge>;
      default:
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100">Baru</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Transaksi Laundry</h1>
          <p className="text-sm text-muted-foreground">Catat transaksi masuk, hitung otomatis nota biaya, dan pantau status cucian.</p>
        </div>

        {/* Modal Dialog Tambah Transaksi */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm">
              <Plus size={16} /> Catat Transaksi Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt size={20} className="text-primary" />
                Buat Nota Transaksi Baru
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              
              {/* Dropdown Pilih Pelanggan dari DB */}
              <div className="space-y-2">
                <Label htmlFor="customer_id">Pilih Pelanggan</Label>
                <select 
                  id="customer_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  required
                >
                  <option value="">-- Pilih Pelanggan --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Dropdown Pilih Layanan dari DB */}
              <div className="space-y-2">
                <Label htmlFor="service_id">Pilih Layanan</Label>
                <select 
                  id="service_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.service_id}
                  onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                  required
                >
                  <option value="">-- Pilih Layanan Laundry --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.service_name} (Rp {Number(s.price).toLocaleString('id-ID')}/{s.unit})</option>
                  ))}
                </select>
              </div>

              {/* Input Jumlah Berat / Pcs */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah Cucian (Berat/Pcs)</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  step="any"
                  placeholder="Masukkan angka, misal: 3.5 atau 2" 
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required 
                />
              </div>

              {/* Status Awal Transaksi */}
              <div className="space-y-2">
                <Label htmlFor="status">Status Awal</Label>
                <select 
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Baru">Baru Masuk</option>
                  <option value="Proses">Sedang Diproses</option>
                </select>
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Cetak & Simpan Transaksi'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabel Data Transaksi */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Kode Nota</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Layanan</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Total Harga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Belum ada riwayat transaksi tercatat.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((trx) => (
                <TableRow key={trx.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono font-bold text-primary">{trx.invoice_code || `TRX-${trx.id}`}</TableCell>
                  <TableCell className="font-semibold">{trx.customer?.name || 'Pelanggan Umum'}</TableCell>
                  <TableCell>{trx.service?.service_name || 'Layanan Luar'}</TableCell>
                  <TableCell>{trx.quantity} {trx.service?.unit || 'Kg'}</TableCell>
                  <TableCell className="font-bold text-slate-900">Rp {Number(trx.total_price).toLocaleString('id-ID')}</TableCell>
                  <TableCell>{getStatusBadge(trx.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" 
                      onClick={() => handleDelete(trx.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}