import React, { useState, useEffect } from 'react';
import apiClient from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Trash2, Loader2, Camera, Edit, Receipt, 
  Search, X, LayoutGrid, List, MessageSquare, MapPin,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_URL = 'http://127.0.0.1:8000/storage/';

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activePopoverId, setActivePopoverId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);
  
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Data Transaksi</h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Monitor sirkulasi pakaian masuk, status pencucian, dan riwayat progress laundry pelanggan secara real-time.
          </p>
        </div>
        <Button onClick={handleAddOpen} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl px-4 py-2 font-medium">
          <Plus size={16} /> Catat Transaksi
        </Button>
      </div>

      {/* FILTER, SEARCH & VIEW SWITCHER */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nota, pelanggan, layanan..." 
              className="pl-9 bg-background border-border text-foreground focus-visible:ring-primary rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* View Toggle Switcher */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60 shrink-0 w-fit">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Tampilan Tabel"
            >
              <List size={14} />
              <span>Tabel</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Card Grid"
            >
              <LayoutGrid size={14} />
              <span>Grid</span>
            </button>
          </div>
        </div>
        
        {/* Status Filters Chips */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: 'all', label: 'Semua' },
            { value: 'antrian', label: 'Antrian' },
            { value: 'dicuci', label: 'Dicuci' },
            { value: 'disetrika', label: 'Disetrika' },
            { value: 'siap diambil', label: 'Siap Diambil' },
            { value: 'diambil', label: 'Diambil' }
          ].map((chip) => (
            <button
              key={chip.value}
              onClick={() => setStatusFilter(chip.value)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-300 transform hover:scale-[1.02] active:scale-95 cursor-pointer ${
                statusFilter === chip.value
                  ? 'bg-primary border-primary text-primary-foreground font-semibold shadow-md shadow-primary/20'
                  : 'bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* RENDER LIST (TABLE VS GRID) */}
      {loading ? (
        <div className="border border-border rounded-2xl bg-card p-12 text-center shadow-sm">
          <Loader2 className="animate-spin text-primary mx-auto h-8 w-8" />
          <p className="text-xs text-muted-foreground font-mono mt-2">MENGAMBIL TRANSAKSI...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="border border-border rounded-2xl bg-card p-12 shadow-sm">
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
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW MODE */
        <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 border-b border-border">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-28 text-muted-foreground font-mono text-xs pl-6">Nota ID</TableHead>
                  <TableHead className="w-24 text-muted-foreground font-mono text-xs">Foto Pakaian</TableHead>
                  <TableHead className="text-muted-foreground font-mono text-xs">Pelanggan</TableHead>
                  <TableHead className="text-muted-foreground font-mono text-xs">Berat / Kuantitas</TableHead>
                  <TableHead className="text-muted-foreground font-mono text-xs">Update Status</TableHead>
                  <TableHead className="text-right text-muted-foreground font-mono text-xs pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTransactions.map((trx, i) => {
                  const name = trx.customer?.user?.name || 'Pelanggan';
                  const avatarColor = avatarColors[i % avatarColors.length];

                  return (
                    <TableRow 
                      key={trx.id} 
                      onClick={() => handleViewDetail(trx)}
                      className="border-b border-border/60 cursor-pointer hover:bg-muted/70 dark:hover:bg-neutral-900/50 transition-colors"
                    >
                      <TableCell className="pl-6 py-4">
                        <span className="font-mono font-bold text-primary text-xs tracking-wider">{trx.invoice_code}</span>
                      </TableCell>
                      <TableCell>
                        {trx.clothes_photo ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-muted relative group">
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
                      <TableCell className="relative">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-bold font-mono ${avatarColor}`}>
                            {getInitials(name)}
                          </div>
                          <div 
                            className="relative"
                            onMouseEnter={() => setActivePopoverId(trx.id)}
                            onMouseLeave={() => setActivePopoverId(null)}
                          >
                            <button 
                              type="button"
                              className="font-semibold text-foreground text-sm hover:text-primary transition-colors cursor-pointer text-left block focus:outline-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePopoverId(activePopoverId === trx.id ? null : trx.id);
                              }}
                            >
                              {name}
                            </button>
                            <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">{trx.service?.service_name || 'Layanan'}</span>

                            {activePopoverId === trx.id && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-0 bottom-full mb-2.5 z-50 w-64 bg-card border border-border p-4 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200 text-left"
                              >
                                <div className="space-y-2.5">
                                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>Detail Kontak Pelanggan</span>
                                  </div>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <MessageSquare size={13} className="shrink-0" />
                                      <a 
                                        href={formatWhatsAppLink(trx.customer?.phone)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline font-mono font-semibold"
                                      >
                                        {trx.customer?.phone || '-'} ↗
                                      </a>
                                    </div>
                                    <div className="flex items-start gap-2 text-muted-foreground">
                                      <MapPin size={13} className="shrink-0 mt-0.5" />
                                      <span className="leading-relaxed">
                                        {trx.customer?.address || 'Tidak ada alamat'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="absolute top-full left-4 -translate-y-px border-8 border-transparent border-t-card" />
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-foreground text-sm font-mono block">
                          {trx.weight} {trx.service?.unit || 'Kg'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <select 
                          onClick={(e) => e.stopPropagation()}
                          className={`h-8 rounded-lg border px-2.5 text-xs font-semibold font-mono bg-background border-border text-foreground hover:bg-muted/80 cursor-pointer focus:outline-none transition-all duration-200 ${getStatusStyles(trx.status)}`} 
                          value={trx.status} 
                          onChange={(e) => handleStatusChange(trx.id, e.target.value)}
                        >
                          <option value="antrian" className="bg-card text-amber-500">Antrian</option>
                          <option value="dicuci" className="bg-card text-blue-500">Dicuci</option>
                          <option value="disetrika" className="bg-card text-purple-500">Disetrika</option>
                          <option value="siap diambil" className="bg-card text-emerald-500">Siap Diambil</option>
                          <option value="diambil" className="bg-card text-muted-foreground">Sudah Diambil</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1.5">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="border-border text-primary hover:text-primary-foreground hover:bg-primary h-8 w-8 rounded-lg" 
                            onClick={(e) => { e.stopPropagation(); handleEditOpen(trx); }}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="border-border text-destructive hover:text-destructive-foreground hover:bg-destructive h-8 w-8 rounded-lg" 
                            onClick={(e) => { e.stopPropagation(); handleDelete(trx.id); }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentTransactions.map((trx, i) => {
            const name = trx.customer?.user?.name || 'Pelanggan';
            const avatarColor = avatarColors[i % avatarColors.length];
            return (
              <div 
                key={trx.id} 
                onClick={() => handleViewDetail(trx)}
                className="group bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Photo Container */}
                <div className="h-48 w-full bg-muted relative overflow-hidden shrink-0 border-b border-border/50">
                  {trx.clothes_photo ? (
                    <img 
                      src={`${STORAGE_URL}${trx.clothes_photo}`} 
                      alt="Kondisi Pakaian" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-505" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/60 gap-2 bg-neutral-50 dark:bg-neutral-900/20">
                      <Camera size={32} className="stroke-[1.5]" />
                      <span className="text-[10px] font-mono tracking-wider">TIDAK ADA FOTO</span>
                    </div>
                  )}
                  {/* Invoice Code Badge overlay */}
                  <div className="absolute top-3 left-3 bg-neutral-900/80 dark:bg-black/75 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider">
                    {trx.invoice_code}
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Customer & Service Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${avatarColor}`}>
                          {getInitials(name)}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground text-sm block leading-tight">{name}</span>
                          <span className="text-[10px] text-muted-foreground block font-mono mt-0.5">{trx.service?.service_name || 'Layanan'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Weight/Kuantitas */}
                    <div className="bg-muted/40 p-2.5 rounded-xl border border-border/60 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Kuantitas:</span>
                      <span className="font-semibold text-foreground font-mono">{trx.weight} {trx.service?.unit || 'Kg'}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-border/60">
                    {/* Status Select */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground font-mono uppercase font-bold">Status:</span>
                      <select 
                        onClick={(e) => e.stopPropagation()}
                        className={`h-8 rounded-lg border px-2 text-xs font-semibold font-mono bg-background border-border text-foreground hover:bg-muted/80 cursor-pointer focus:outline-none transition-all duration-205 ${getStatusStyles(trx.status)}`} 
                        value={trx.status} 
                        onChange={(e) => handleStatusChange(trx.id, e.target.value)}
                      >
                        <option value="antrian" className="bg-card text-amber-500">Antrian</option>
                        <option value="dicuci" className="bg-card text-blue-500">Dicuci</option>
                        <option value="disetrika" className="bg-card text-purple-500">Disetrika</option>
                        <option value="siap diambil" className="bg-card text-emerald-500">Siap Diambil</option>
                        <option value="diambil" className="bg-card text-muted-foreground">Sudah Diambil</option>
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-border text-xs text-primary hover:text-primary-foreground hover:bg-primary h-9 rounded-xl gap-1.5" 
                        onClick={(e) => { e.stopPropagation(); handleEditOpen(trx); }}
                      >
                        <Edit size={13} /> Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-border text-destructive hover:text-destructive-foreground hover:bg-destructive h-9 w-9 p-0 rounded-xl" 
                        onClick={(e) => { e.stopPropagation(); handleDelete(trx.id); }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm font-sans mt-4">
          <div className="text-xs text-muted-foreground font-mono">
            Menampilkan <span className="font-semibold text-foreground">{indexOfFirstItem + 1}</span> - <span className="font-semibold text-foreground">{Math.min(indexOfLastItem, filteredTransactions.length)}</span> dari <span className="font-semibold text-foreground">{filteredTransactions.length}</span> data
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft size={14} />
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                className={`h-8 w-8 text-xs rounded-lg ${
                  currentPage === page 
                    ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/10" 
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted font-medium"
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* FORM INPUT/EDIT SLIDE-OVER DRAWER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsModalOpen(false)}
          />
          {/* Slide-over Drawer Panel */}
          <div className="relative w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 ease-in-out text-foreground">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-border/60 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-foreground">
                  {editId ? 'Ubah Nota Transaksi' : 'Buat Nota Transaksi Baru'}
                </h2>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {editId ? `Mengedit Transaksi #${editId}` : 'Isi detail operasional pakaian pelanggan'}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
                {/* Pelanggan */}
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
                
                {/* Layanan */}
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Layanan</Label>
                  <select 
                    className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all" 
                    value={formData.service_id} 
                    onChange={(e) => setFormData({ ...formData, service_id: e.target.value })} 
                    required
                  >
                    <option value="" className="bg-card text-muted-foreground">-- Pilih Layanan --</option>
                    {services
                      .filter(service => service.is_active === true || service.is_active === 1 || (editId !== null && service.id.toString() === formData.service_id))
                      .map((s) => (
                        <option key={s.id} value={s.id} className="bg-card text-foreground">
                          {s.service_name} ({s.unit})
                        </option>
                      ))}
                  </select>
                </div>
                
                {/* Berat / Kuantitas */}
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Berat / Kuantitas</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      step="0.1" 
                      value={formData.weight} 
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })} 
                      placeholder="Misal: 2.5"
                      className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm pr-12 font-mono h-11"
                      required 
                    />
                    <div className="absolute right-3.5 top-3.5 text-xs text-muted-foreground font-mono">
                      {formData.service_id ? (services.find(s => s.id.toString() === formData.service_id)?.unit || 'Kg') : 'Kg'}
                    </div>
                  </div>
                </div>

                {/* Estimasi Harga */}
                {(() => {
                  const selectedService = services.find(s => s.id.toString() === formData.service_id);
                  if (!selectedService || !formData.weight) return null;
                  const estimated = Number(selectedService.price) * Number(formData.weight);
                  return (
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest block font-mono">Estimasi Biaya</span>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-muted-foreground">
                          {formData.weight} {selectedService.unit} × Rp {Number(selectedService.price).toLocaleString('id-ID')}
                        </span>
                        <span className="text-sm font-extrabold text-foreground font-mono">
                          Rp {estimated.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Foto Kondisi Pakaian */}
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
                      <div className="relative w-full max-h-[160px] flex items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
                        <img src={photoPreview} alt="Preview" className="h-full max-h-[140px] w-full object-contain" />
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

                {/* Hidden field for payment method to support DB payload constraints */}
                <input type="hidden" name="payment_method" value="cash" />
              </div>
              
              {/* Sticky Footer */}
              <div className="p-6 border-t border-border/60 bg-muted/20 flex gap-3 shrink-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 border-border text-foreground hover:bg-muted rounded-xl"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Simpan Transaksi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL / NOTA (Operational Only) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-card border-border text-foreground rounded-2xl p-6 no-scrollbar">
          {selectedTrx && (
            <div id="print-receipt" className="space-y-6 text-foreground print:p-0">
              
              {/* 1. TOP HEADER BANNER */}
              <div className="bg-primary text-primary-foreground p-6 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-md">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-85 font-mono">Invoice Code</span>
                  <h2 className="text-2xl font-black tracking-tight font-mono">{selectedTrx.invoice_code}</h2>
                  <p className="text-[11px] opacity-75 font-mono">
                    Masuk: {new Date(selectedTrx.created_at).toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-85 font-mono">Status Cucian</span>
                  <Badge className="text-xs uppercase font-extrabold tracking-wide mt-1 px-3 py-1 rounded-full bg-neutral-900/30 text-white border border-white/20">
                    {selectedTrx.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* 2. PROGRESS CUCIAN TIMELINE STEPPER */}
              {(() => {
                const steps = ['antrian', 'dicuci', 'disetrika', 'siap diambil', 'diambil'];
                const stepLabels: Record<string, string> = {
                  'antrian': 'Antrian',
                  'dicuci': 'Dicuci',
                  'disetrika': 'Disetrika',
                  'siap diambil': 'Siap Diambil',
                  'diambil': 'Selesai'
                };
                const currentStepIdx = steps.indexOf(selectedTrx.status.toLowerCase());
                
                return (
                  <div className="bg-muted/45 border border-border/85 p-5 rounded-2xl space-y-4 print:hidden">
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block font-mono">
                      Progress Cucian
                    </span>
                    <div className="relative flex items-center justify-between w-full pt-2 pb-1 px-4">
                      {/* Background connecting line */}
                      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[3px] bg-neutral-200 dark:bg-neutral-805 z-0" />
                      
                      {/* Active connecting line */}
                      <div 
                        className="absolute left-6 top-1/2 -translate-y-1/2 h-[3px] bg-primary transition-all duration-500 z-0" 
                        style={{ width: `${(Math.max(0, currentStepIdx) / (steps.length - 1)) * 100}%` }}
                      />

                      {steps.map((step, idx) => {
                        const isActive = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;
                        
                        return (
                          <div key={step} className="flex flex-col items-center z-10 relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                              isCurrent
                                ? 'bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/25'
                                : isActive
                                  ? 'bg-neutral-900 border-neutral-900 dark:bg-white dark:border-white text-white dark:text-neutral-950 font-bold'
                                  : 'bg-card border-neutral-200 dark:border-neutral-850 text-neutral-400 dark:text-neutral-600'
                            }`}>
                              <span className="text-[10px] font-bold">{idx + 1}</span>
                            </div>
                            <span className={`text-[10px] font-bold mt-2 tracking-tight whitespace-nowrap ${
                              isCurrent 
                                ? 'text-primary' 
                                : isActive 
                                  ? 'text-foreground' 
                                  : 'text-neutral-400 dark:text-neutral-600'
                            }`}>
                              {stepLabels[step]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* 3. AREA UPDATE STATUS */}
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-muted/40 border border-border/80 p-4 rounded-xl print:hidden">
                <div className="w-full sm:flex-1">
                  <label className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block font-mono mb-1.5">
                    Ubah Status Cucian
                  </label>
                  <select 
                    value={selectedTrx.status} 
                    onChange={(e) => {
                      setSelectedTrx({ ...selectedTrx, status: e.target.value });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                  >
                    <option value="antrian">Antrian</option>
                    <option value="dicuci">Dicuci</option>
                    <option value="disetrika">Disetrika</option>
                    <option value="siap diambil">Siap Diambil</option>
                    <option value="diambil">Selesai / Diambil</option>
                  </select>
                </div>
                <Button 
                  onClick={async () => {
                    setIsSubmitting(true);
                    try {
                      await apiClient.patch(`/transactions/${selectedTrx.id}/status`, { status: selectedTrx.status });
                      toast.success('Status transaksi berhasil diperbarui.');
                      fetchData(); 
                    } catch (err) {
                      toast.error('Gagal memperbarui status!');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shrink-0 sm:mt-5 transition-all"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Simpan Perubahan'}
                </Button>
              </div>

              {/* 4. BOTTOM TWO COLUMNS LAYOUT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Info Pelanggan */}
                <div className="space-y-4 border border-border/80 p-5 rounded-2xl bg-card/50">
                  <h4 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-mono border-b border-border/60 pb-2">
                    Info Pelanggan
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs font-mono">
                      {getInitials(selectedTrx.customer?.user?.name)}
                    </div>
                    <div>
                      <h5 className="font-extrabold text-sm text-foreground leading-tight">
                        {selectedTrx.customer?.user?.name || 'Pelanggan'}
                      </h5>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        ID: #CST-{selectedTrx.customer?.id}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 block font-mono uppercase">Email Address</span>
                      <span className="text-foreground font-semibold mt-0.5 block truncate">
                        {selectedTrx.customer?.user?.email || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 block font-mono uppercase">WhatsApp / HP</span>
                      <span className="text-foreground font-semibold mt-0.5 block font-mono">
                        {selectedTrx.customer?.phone ? (
                          <a 
                            href={formatWhatsAppLink(selectedTrx.customer.phone)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                          >
                            {selectedTrx.customer.phone} ↗
                          </a>
                        ) : (
                          '-'
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 block font-mono uppercase">Alamat Pengiriman</span>
                      <p className="text-foreground leading-relaxed mt-1 bg-muted/40 p-3 rounded-xl border border-border/60 whitespace-pre-wrap">
                        {selectedTrx.customer?.address || 'Tidak ada info alamat.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detail Operasional Cucian */}
                <div className="space-y-4 border border-border/80 p-5 rounded-2xl bg-card/50">
                  <h4 className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-mono border-b border-border/60 pb-2">
                    Detail Cucian
                  </h4>
                  <div className="space-y-4">
                    <div className="border border-border/60 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border/60">
                            <th className="p-2.5 font-semibold text-neutral-500 dark:text-neutral-400 font-mono text-[10px]">LAYANAN / KETERANGAN</th>
                            <th className="p-2.5 text-right font-semibold text-neutral-500 dark:text-neutral-400 font-mono text-[10px]">KUANTITAS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/65">
                          <tr>
                            <td className="p-2.5">
                              <span className="font-extrabold text-foreground block">
                                {selectedTrx.service?.service_name || 'Layanan Laundry'}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                                Unit: {selectedTrx.service?.unit || 'Kg'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-foreground">
                              {selectedTrx.weight} {selectedTrx.service?.unit || 'Kg'}
                            </td>
                          </tr>
                          <tr className="bg-muted/10">
                            <td className="p-2.5 text-neutral-500 dark:text-neutral-400">
                              Status Cucian
                            </td>
                            <td className="p-2.5 text-right font-bold text-foreground uppercase tracking-wide font-mono text-[10px]">
                              {selectedTrx.status}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Lampiran Foto Bukti Kondisi */}
                    {selectedTrx.clothes_photo && (
                      <div className="pt-2 border-t border-border/40">
                        <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 block font-mono uppercase mb-1.5">
                          Lampiran Bukti Pakaian
                        </span>
                        <div className="border border-border/80 rounded-xl p-1 bg-muted/40 overflow-hidden max-h-[140px] flex items-center justify-center">
                          <img 
                            src={`${STORAGE_URL}${selectedTrx.clothes_photo}`} 
                            alt="Bukti pakaian" 
                            className="max-h-32 object-contain rounded-lg hover:scale-105 transition-transform duration-300" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Store Footer Print Message */}
              <div className="text-center space-y-1 pt-4 border-t border-dashed border-border/80">
                <p className="text-xs font-bold text-foreground">Terima Kasih Atas Kepercayaan Anda</p>
                <p className="text-[9px] text-muted-foreground leading-normal max-w-[320px] mx-auto font-mono">
                  Mohon periksa cucian sebelum meninggalkan outlet. Komplain maksimal 24 jam setelah cucian diambil.
                </p>
              </div>

            </div>
          )}

          <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2 print:hidden border-t border-border/60">
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all"
              onClick={() => window.print()}
            >
              Cetak Struk (Print)
            </Button>
            <Button 
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-muted rounded-xl transition-all" 
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