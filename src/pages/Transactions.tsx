import React, { useState, useEffect } from 'react';
import apiClient from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Trash2, Loader2, Camera, Eye, Edit, Receipt, 
  WashingMachine, Search 
} from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_URL = 'http://127.0.0.1:8000/storage/';

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ customer_id: '', service_id: '', weight: '', payment_method: 'cash' });
  const [clothesPhoto, setClothesPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resCust = await apiClient.get('/customers'); 
      setCustomers(resCust.data?.data || resCust.data || []);
      
      const resServ = await apiClient.get('/services'); 
      setServices(resServ.data?.data || resServ.data || []);
      
      const resTx = await apiClient.get('/transactions'); 
      setTransactions(resTx.data?.data || resTx.data || []);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleClothesPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setClothesPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleAddOpen = () => {
    setEditId(null);
    setFormData({ customer_id: '', service_id: '', weight: '', payment_method: 'cash' });
    setClothesPhoto(null);
    setPhotoPreview(null);
    setIsModalOpen(true);
  };

  const handleEditOpen = (trx: any) => {
    setEditId(trx.id);
    setFormData({
      customer_id: trx.customer_id.toString(),
      service_id: trx.service_id.toString(),
      weight: trx.weight.toString(),
      payment_method: trx.payment_method
    });
    setClothesPhoto(null);
    if (trx.clothes_photo) {
      setPhotoPreview(`${STORAGE_URL}${trx.clothes_photo}`);
    } else {
      setPhotoPreview(null);
    }
    setIsModalOpen(true);
  };

  const handleViewDetail = (trx: any) => {
    setSelectedTrx(trx);
    setIsDetailOpen(true);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    const prevTransactions = [...transactions];
    setTransactions(transactions.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    try {
      await apiClient.patch(`/transactions/${id}/status`, { status: newStatus });
      toast.success('Status transaksi berhasil diperbarui.');
    } catch (error) {
      setTransactions(prevTransactions);
      toast.error('Gagal memperbarui status!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('customer_id', formData.customer_id);
      submitData.append('service_id', formData.service_id);
      submitData.append('weight', formData.weight);
      submitData.append('payment_method', formData.payment_method);
      if (clothesPhoto) { 
        submitData.append('clothes_photo', clothesPhoto); 
      }

      if (editId) {
        submitData.append('_method', 'PUT'); 
        await apiClient.post(`/transactions/${editId}`, submitData);
        toast.success('Sukses!', { description: 'Transaksi berhasil diupdate.' });
      } else {
        await apiClient.post('/transactions', submitData);
        toast.success('Sukses!', { description: 'Transaksi baru berhasil disimpan.' });
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) { 
      const validationErrors = error.response?.data?.errors;
      let detailedError = error.response?.data?.message || 'Pastikan form terisi valid.';
      if (validationErrors) { 
        detailedError = Object.values(validationErrors).flat().join(', '); 
      }
      toast.error('Gagal Menyimpan', { description: detailedError });
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini?')) return;
    
    const prevTransactions = [...transactions];
    setTransactions(transactions.filter(t => t.id !== id));
    
    try { 
      await apiClient.delete(`/transactions/${id}`); 
      toast.success('Transaksi berhasil dihapus.'); 
    } catch (error) { 
      setTransactions(prevTransactions);
      toast.error('Gagal menghapus transaksi!'); 
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'TR';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  // Helper untuk formatting link WhatsApp
  const formatWhatsAppLink = (phone: string) => {
    if (!phone) return '#';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }
    return `https://wa.me/${cleaned}`;
  };

  const avatarColors = [
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800/40',
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/40',
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/40',
    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800/40',
    'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/40',
  ];

  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'antrian':
        return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/30';
      case 'dicuci':
        return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30';
      case 'disetrika':
        return 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/30';
      case 'siap diambil':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/30';
      case 'diambil':
        return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700/50';
      default:
        return 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-750';
    }
  };

  const filteredTransactions = transactions.filter((trx) => {
    const invoice = trx.invoice_code || '';
    const customerName = trx.customer?.user?.name || '';
    const serviceName = trx.service?.service_name || '';
    const matchesSearch = 
      invoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || trx.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Data Transaksi</h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Monitor sirkulasi pakaian masuk, status pencucian, dan riwayat nota pembayaran pelanggan.
          </p>
        </div>
        <Button onClick={handleAddOpen} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl px-4 py-2 font-medium">
          <Plus size={16} /> Catat Transaksi
        </Button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari nota, pelanggan, layanan..." 
            className="pl-9 bg-background border-border text-foreground focus-visible:ring-primary rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Status Filters Chips */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: 'all', label: 'Semua' },
            { value: 'antrian', label: '🕒 Antrian' },
            { value: 'dicuci', label: '🧼 Dicuci' },
            { value: 'disetrika', label: '💨 Disetrika' },
            { value: 'siap diambil', label: '✅ Siap Diambil' },
            { value: 'diambil', label: '📦 Diambil' }
          ].map((chip) => (
            <button
              key={chip.value}
              onClick={() => setStatusFilter(chip.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
                statusFilter === chip.value
                  ? 'bg-primary border-primary text-primary-foreground font-semibold shadow-sm'
                  : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* TRANSACTION LIST TABLE */}
      <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-28 text-muted-foreground font-mono text-xs pl-6">Nota ID</TableHead>
                <TableHead className="w-24 text-muted-foreground font-mono text-xs">Foto Pakaian</TableHead>
                <TableHead className="text-muted-foreground font-mono text-xs">Pelanggan</TableHead>
                <TableHead className="text-muted-foreground font-mono text-xs">Total Harga</TableHead>
                <TableHead className="text-muted-foreground font-mono text-xs">Update Status</TableHead>
                <TableHead className="text-right text-muted-foreground font-mono text-xs pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center h-32">
                    <Loader2 className="animate-spin text-primary mx-auto h-8 w-8" />
                    <p className="text-xs text-muted-foreground font-mono mt-2">MENGAMBIL TRANSAKSI...</p>
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-muted/65 flex items-center justify-center text-muted-foreground mb-4 border border-border/60 shadow-sm">
                        <Receipt className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">Tidak Ada Transaksi</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                        {searchQuery || statusFilter !== 'all' ? 'Tidak ada transaksi yang cocok dengan filter pencarian.' : 'Belum ada transaksi tercatat di sistem laundry.'}
                      </p>
                      {statusFilter === 'all' && !searchQuery && (
                        <Button onClick={handleAddOpen} variant="outline" className="mt-4 border-border text-xs rounded-xl gap-2 hover:bg-muted text-foreground">
                          <Plus size={14} /> Catat Transaksi
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((trx, i) => {
                  const name = trx.customer?.user?.name || 'Pelanggan';
                  const avatarColor = avatarColors[i % avatarColors.length];

                  return (
                    <TableRow key={trx.id} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <span className="font-mono font-bold text-primary text-xs tracking-wider">{trx.invoice_code}</span>
                      </TableCell>
                      <TableCell>
                        {trx.clothes_photo ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-muted relative group cursor-zoom-in" onClick={() => handleViewDetail(trx)}>
                            <img 
                              src={`${STORAGE_URL}${trx.clothes_photo}`} 
                              alt="Kondisi" 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic font-mono">Tidak ada</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-bold font-mono ${avatarColor}`}>
                            {getInitials(name)}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground text-sm block">{name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{trx.service?.service_name || 'Layanan'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-semibold text-foreground text-sm block font-mono">
                            Rp {Number(trx.total_price).toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {trx.weight} {trx.service?.unit || 'Kg'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <select 
                          className={`h-8 rounded-lg border px-2.5 text-xs font-semibold font-mono bg-background border-border text-foreground hover:bg-muted/80 cursor-pointer focus:outline-none transition-all duration-200 ${getStatusStyles(trx.status)}`} 
                          value={trx.status} 
                          onChange={(e) => handleStatusChange(trx.id, e.target.value)}
                        >
                          <option value="antrian" className="bg-card text-amber-500">🕒 Antrian</option>
                          <option value="dicuci" className="bg-card text-blue-500">🧼 Dicuci</option>
                          <option value="disetrika" className="bg-card text-purple-500">💨 Disetrika</option>
                          <option value="siap diambil" className="bg-card text-emerald-500">✅ Siap Diambil</option>
                          <option value="diambil" className="bg-card text-muted-foreground">📦 Sudah Diambil</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1.5">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 rounded-lg" 
                            onClick={() => handleViewDetail(trx)}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="border-border text-primary hover:text-primary-foreground hover:bg-primary h-8 w-8 rounded-lg" 
                            onClick={() => handleEditOpen(trx)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="border-border text-destructive hover:text-destructive-foreground hover:bg-destructive h-8 w-8 rounded-lg" 
                            onClick={() => handleDelete(trx.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* FORM INPUT/EDIT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] bg-card border-border text-foreground rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground border-b border-border/60 pb-3">
              {editId ? 'Ubah Nota Transaksi' : 'Buat Nota Transaksi Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-semibold">Pelanggan</Label>
              <select 
                className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all" 
                value={formData.customer_id} 
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} 
                required
              >
                <option value="" className="bg-card text-muted-foreground">-- Pilih Pelanggan --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-card text-foreground">
                    {c.user?.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-semibold">Layanan</Label>
              <select 
                className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all" 
                value={formData.service_id} 
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })} 
                required
              >
                <option value="" className="bg-card text-muted-foreground">-- Pilih Layanan --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id} className="bg-card text-foreground">
                    {s.service_name} (Rp {Number(s.price).toLocaleString('id-ID')} / {s.unit})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-semibold">Berat / Kuantitas</Label>
              <div className="relative">
                <Input 
                  type="number" 
                  step="0.1" 
                  value={formData.weight} 
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })} 
                  placeholder="Misal: 2.5"
                  className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm pr-12 font-mono"
                  required 
                />
                <div className="absolute right-3.5 top-2.5 text-xs text-muted-foreground font-mono">
                  {formData.service_id ? (services.find(s => s.id.toString() === formData.service_id)?.unit || 'Kg') : 'Kg'}
                </div>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-semibold">Foto Kondisi Pakaian {editId && '(Kosongkan jika tak diubah)'}</Label>
              <div className="border border-dashed border-border rounded-xl p-4 bg-background flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors relative cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleClothesPhotoChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
                {photoPreview ? (
                  <div className="relative w-full max-h-[140px] flex items-center justify-center overflow-hidden rounded-lg border border-border">
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-contain bg-black/5" />
                  </div>
                ) : (
                  <>
                    <Camera className="text-muted-foreground h-6 w-6 group-hover:text-primary transition-colors" />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      Klik untuk mengambil atau mengupload foto
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-semibold">Metode Pembayaran</Label>
              <select 
                className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all" 
                value={formData.payment_method} 
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="cash" className="bg-card text-foreground">Tunai (Cash)</option>
                <option value="transfer" className="bg-card text-foreground">Transfer Bank</option>
              </select>
            </div>
            
            <DialogFooter className="pt-4 border-t border-border/60 mt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-2">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Simpan Transaksi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DETAIL DRAWER / NOTA */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto bg-card border-border text-foreground rounded-2xl p-6">
          <DialogHeader className="print:hidden">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground border-b border-border/60 pb-3">
              <Receipt className="text-primary" /> Detail Nota Transaksi
            </DialogTitle>
          </DialogHeader>
          
          {selectedTrx && (
            <div id="print-receipt" className="space-y-6 p-1 print:p-0 text-foreground">
              {/* Store Branding (ala kasir modern) */}
              <div className="text-center space-y-1.5 pb-4 border-b border-dashed border-border/80">
                <div className="flex justify-center print:hidden">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <WashingMachine className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="font-bold text-base tracking-tight text-foreground">CDC LAUNDRY & DRY CLEAN</h3>
                <p className="text-[10px] text-muted-foreground leading-normal max-w-[240px] mx-auto font-mono">
                  Jl. Merdeka Raya No. 12, Jakarta Selatan<br />
                  Telp/WA: 0812-3456-7890
                </p>
              </div>

              {/* Receipt Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono py-1">
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Nomor Nota</p>
                  <p className="font-bold text-primary text-sm mt-0.5 print:text-foreground">{selectedTrx.invoice_code}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1 justify-end">
                    Tanggal Masuk
                  </p>
                  <p className="text-foreground font-medium mt-0.5">
                    {new Date(selectedTrx.created_at).toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>

              {/* Customer & Service Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/40 border border-border p-4 rounded-2xl text-xs">
                <div className="space-y-2">
                  <span className="text-[10px] text-muted-foreground font-bold font-mono uppercase tracking-wider block">
                    Pelanggan
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{selectedTrx.customer?.user?.name || 'Pelanggan'}</p>
                    <p className="text-muted-foreground font-mono mt-0.5">
                      {selectedTrx.customer?.phone ? (
                        <a 
                          href={formatWhatsAppLink(selectedTrx.customer.phone)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 text-primary hover:underline hover:text-primary/80 transition-colors print:no-underline print:text-foreground"
                        >
                          {selectedTrx.customer.phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </p>
                    <p className="text-muted-foreground mt-1 leading-relaxed max-w-[200px] break-words">
                      {selectedTrx.customer?.address || '-'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-border/80 pt-3 sm:pt-0 sm:pl-4">
                  <span className="text-[10px] text-muted-foreground font-bold font-mono uppercase tracking-wider block">
                    Layanan Laundry
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{selectedTrx.service?.service_name || 'Layanan'}</p>
                    <p className="text-muted-foreground mt-0.5 font-mono">
                      Rp {Number(selectedTrx.service?.price).toLocaleString('id-ID')} / {selectedTrx.service?.unit || 'Kg'}
                    </p>
                    <p className="text-muted-foreground mt-1 italic text-[10px] line-clamp-2">
                      {selectedTrx.service?.description || 'Tidak ada deskripsi.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Calculations */}
              <div className="space-y-3 border-b border-dashed border-border pb-5 text-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-mono">Kuantitas / Berat</span>
                  <span className="font-semibold text-foreground font-mono">{selectedTrx.weight} {selectedTrx.service?.unit || 'Kg'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-mono">Metode Pembayaran</span>
                  <Badge variant="outline" className="capitalize font-mono border-border text-foreground bg-muted px-2 py-0.5 rounded-lg text-[10px] font-medium">
                    {selectedTrx.payment_method === 'cash' ? '💵 Cash/Tunai' : '💳 Transfer Bank'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-mono">Status Cucian</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(selectedTrx.status)}`}>
                    {selectedTrx.status}
                  </span>
                </div>
                
                <div className="pt-3 border-t border-border flex justify-between items-baseline">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">TOTAL BAYAR</span>
                  <span className="text-primary text-xl font-bold font-mono print:text-foreground">
                    Rp {Number(selectedTrx.total_price).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Photos section (hidden on print) */}
              <div className="space-y-2.5 print:hidden">
                <span className="text-[10px] text-muted-foreground font-bold font-mono uppercase tracking-wider block">Foto Bukti Kondisi Pakaian:</span>
                {selectedTrx.clothes_photo ? (
                  <div className="border border-border rounded-xl p-2 bg-muted overflow-hidden group">
                    <img 
                      src={`${STORAGE_URL}${selectedTrx.clothes_photo}`} 
                      alt="Foto pakaian" 
                      className="w-full max-h-[240px] object-contain rounded-lg bg-black/5 group-hover:scale-[1.01] transition-transform duration-300" 
                    />
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-xl h-24 flex flex-col items-center justify-center bg-muted/40 text-muted-foreground">
                    <Camera size={20} className="stroke-[1.5] mb-1.5" />
                    <p className="text-xs italic font-mono">Tidak ada lampiran foto kondisi.</p>
                  </div>
                )}
              </div>

              {/* Footer Greeting (kasir modern style) */}
              <div className="text-center space-y-1 pt-2 border-t border-dashed border-border/80">
                <p className="text-xs font-semibold text-foreground">Terima Kasih Atas Kepercayaan Anda</p>
                <p className="text-[9px] text-muted-foreground leading-normal max-w-[320px] mx-auto font-mono">
                  Mohon periksa cucian sebelum meninggalkan outlet. Komplain maksimal 24 jam setelah cucian diambil.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2 print:hidden">
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium"
              onClick={() => window.print()}
            >
              Cetak Struk (Print)
            </Button>
            <Button 
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-muted rounded-xl" 
              onClick={() => setIsDetailOpen(false)}
            >
              Tutup Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}