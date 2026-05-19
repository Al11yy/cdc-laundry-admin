import React, { useState, useEffect } from 'react';
import apiClient from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';

// URL storage Laravel
const STORAGE_URL = 'http://127.0.0.1:8000/storage/';

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({ customer_id: '', service_id: '', weight: '', payment_method: 'cash' });
  const [clothesPhoto, setClothesPhoto] = useState<File | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resCust = await apiClient.get('/customers'); 
      setCustomers(resCust.data?.data || []);
      
      const resServ = await apiClient.get('/services'); 
      setServices(resServ.data?.data || []);
      
      // INI YANG MISSING! Kita harus tarik data transaksinya juga
      const resTx = await apiClient.get('/transactions'); 
      setTransactions(resTx.data?.data || []);

      // Ganti cara request-nya buat bypass header JSON kalau ada file
      await apiClient.post('/transactions', new FormData(), { // Kirim FormData kosong dulu buat trigger header multipart
        headers: {
          'Content-Type': 'multipart/form-data' // Override header default
        }
      });
      
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('customer_id', formData.customer_id);
      submitData.append('service_id', formData.service_id);
      submitData.append('weight', formData.weight);
      submitData.append('payment_method', formData.payment_method);
      if (clothesPhoto) { submitData.append('clothes_photo', clothesPhoto); }

      await apiClient.post('/transactions', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setIsModalOpen(false);
      setFormData({ customer_id: '', service_id: '', weight: '', payment_method: 'cash' });
      setClothesPhoto(null);
      fetchData(); // Refresh data biar transaksi baru muncul di tabel
      toast.success('Berhasil!', { description: 'Transaksi dan foto kondisi pakaian tersimpan.' });
    } catch (error: any) { 
      toast.error('Gagal', { description: error.response?.data?.message || 'Pastikan form lengkap.' }); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin hapus transaksi?')) return;
    try { 
      await apiClient.delete(`/transactions/${id}`); 
      fetchData(); 
      toast.success('Dihapus!'); 
    } catch (error) { 
      toast.error('Gagal menghapus!'); 
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Data Transaksi</h1></div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus size={16} /> Catat Transaksi</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader><DialogTitle>Buat Nota & Bukti Kondisi</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Pelanggan</Label>
                <select className="flex h-10 w-full rounded-md border bg-background px-3" value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} required>
                  <option value="">-- Pilih --</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.user?.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Layanan</Label>
                <select className="flex h-10 w-full rounded-md border bg-background px-3" value={formData.service_id} onChange={(e) => setFormData({ ...formData, service_id: e.target.value })} required>
                  <option value="">-- Pilih --</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.service_name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Berat/Jumlah</Label>
                <Input type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Foto Kondisi Pakaian (Opsional)</Label>
                <div className="flex items-center gap-2">
                  <Camera className="text-muted-foreground h-5 w-5" />
                  <Input type="file" accept="image/*" onChange={(e) => setClothesPhoto(e.target.files?.[0] || null)} />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? <Loader2 className="animate-spin" /> : 'Simpan Transaksi'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Nota</TableHead><TableHead>Kondisi Pakaian</TableHead><TableHead>Pelanggan</TableHead><TableHead>Total Harga</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> : transactions.map((trx) => (
              <TableRow key={trx.id}>
                <TableCell className="font-mono font-bold">{trx.invoice_code}</TableCell>
                <TableCell>
                  {trx.clothes_photo ? (
                    <img src={`${STORAGE_URL}${trx.clothes_photo}`} alt="Kondisi" className="w-12 h-12 object-cover rounded-md border shadow-sm" />
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Tidak Ada</span>
                  )}
                </TableCell>
                <TableCell className="font-semibold">{trx.customer?.user?.name}</TableCell>
                <TableCell>Rp {Number(trx.total_price).toLocaleString('id-ID')}</TableCell>
                <TableCell><Badge className="bg-orange-100 text-orange-800">{trx.status}</Badge></TableCell>
                <TableCell className="text-right"><Button variant="outline" size="icon" className="text-red-600" onClick={() => handleDelete(trx.id)}><Trash2 size={16} /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}