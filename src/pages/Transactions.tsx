import React, { useState, useEffect } from 'react';
import apiClient from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Trash2, Loader2, Edit, Receipt, 
  Search, X, LayoutGrid, List, MessageSquare, MapPin,
  ChevronLeft, ChevronRight, CreditCard, DollarSign,
  SlidersHorizontal, Calendar as CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useSearch } from '@/context/SearchContext';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const STORAGE_URL = 'http://127.0.0.1:8000/storage/';

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [activePopoverId, setActivePopoverId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { searchQuery, setSearchQuery } = useSearch();
  const [statusFilter, setStatusFilter] = useState('all');
  const [proofFilter, setProofFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, proofFilter, sortBy, dateFilter]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refaktor Form Data untuk menyertakan pilar keuangan UKK
  const [formData, setFormData] = useState({ 
    customer_id: '', 
    service_id: '', 
    weight: '', 
    payment_method: 'cash',
    payment_status: 'pending'
  });
  
  // State Upload Image Bukti Transfer (dipetakan ke 'clothes_photo' di database)
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

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

  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPaymentProof(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
  };

  const handleAddOpen = () => {
    setEditId(null);
    setFormData({ 
      customer_id: '', 
      service_id: '', 
      weight: '', 
      payment_method: 'cash',
      payment_status: 'pending'
    });
    setPaymentProof(null);
    setProofPreview(null);
    setIsModalOpen(true);
  };

  const handleEditOpen = (trx: any) => {
    setEditId(trx.id);
    setFormData({
      customer_id: trx.customer_id.toString(),
      service_id: trx.service_id.toString(),
      weight: trx.weight.toString(),
      payment_method: trx.payment_method || 'cash',
      payment_status: trx.payment_status || 'pending'
    });
    setPaymentProof(null);
    
    if (trx.clothes_photo) {
      setProofPreview(`${STORAGE_URL}${trx.clothes_photo}`);
    } else {
      setProofPreview(null);
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
      if (selectedTrx && selectedTrx.id === id) {
        setSelectedTrx((prev: any) => ({ ...prev, status: newStatus }));
      }
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
      submitData.append('payment_status', formData.payment_status);
      
      // Kirim file bukti transfer dengan nama field 'clothes_photo' agar tersimpan di db backend
      if (formData.payment_method === 'transfer' && paymentProof) {
        submitData.append('clothes_photo', paymentProof);
      }

      if (editId) {
        submitData.append('_method', 'PUT');
        await apiClient.post(`/transactions/${editId}`, submitData);
        
        // Panggil PATCH status pembayaran secara terpisah untuk memastikan sinkronisasi ke db
        await apiClient.patch(`/transactions/${editId}/payment-status`, { 
          payment_status: formData.payment_status 
        });

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
    setSelectedIds(prev => prev.filter(item => item !== id));
    
    try { 
      await apiClient.delete(`/transactions/${id}`);
      toast.success('Transaksi berhasil dihapus.'); 
    } catch (error) { 
      setTransactions(prevTransactions);
      toast.error('Gagal menghapus transaksi!'); 
    }
  };

  const toggleSelect = (id: number) => {
    const numId = Number(id);
    setSelectedIds(prev => 
      prev.includes(numId) ? prev.filter(item => item !== numId) : [...prev, numId]
    );
  };

  const toggleSelectAll = () => {
    const currentIds = currentTransactions.map(t => Number(t.id));
    const allSelected = currentIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const newSelected = [...prev];
        currentIds.forEach(id => {
          if (!newSelected.includes(id)) newSelected.push(id);
        });
        return newSelected;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedIds.length} transaksi terpilih?`)) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => apiClient.delete(`/transactions/${id}`)));
      toast.success('Transaksi terpilih berhasil dihapus.');
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error('Gagal menghapus beberapa transaksi!');
      setSelectedIds([]);
      fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(
        selectedIds.map(id => apiClient.patch(`/transactions/${id}/status`, { status: newStatus }))
      );
      toast.success('Status transaksi terpilih berhasil diperbarui.');
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      toast.error('Gagal memperbarui status transaksi terpilih!');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'TR';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

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
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/40',
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/40',
    'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/40',
  ];

  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'antrian':
        return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30';
      case 'dicuci':
        return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30';
      case 'disetrika':
        return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30';
      case 'siap diambil':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/30';
      case 'diambil':
        return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700/50';
      default:
        return 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700/50';
    }
  };

  const getPaymentStatusStyles = (status: string) => {
    return status?.toLowerCase() === 'paid'
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : 'bg-rose-500/10 text-rose-500 border-rose-500/20';
  };

  const filteredTransactions = transactions
    .filter((trx) => {
      const invoice = trx.invoice_code || '';
      const customerName = trx.customer?.user?.name || '';
      const serviceName = trx.service?.service_name || '';
      const matchesSearch = 
        invoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        serviceName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || trx.status === statusFilter;
      
      let matchesProof = true;
      if (proofFilter === 'uploaded') {
        matchesProof = trx.payment_method === 'transfer' && !!trx.clothes_photo;
      } else if (proofFilter === 'not_uploaded') {
        matchesProof = trx.payment_method === 'transfer' && !trx.clothes_photo;
      } else if (proofFilter === 'cash') {
        matchesProof = trx.payment_method === 'cash';
      }
      
      let matchesDate = true;
      if (dateFilter) {
        if (!trx.created_at) {
          matchesDate = false;
        } else {
          const trxDate = new Date(trx.created_at);
          matchesDate = trxDate.getDate() === dateFilter.getDate() &&
                        trxDate.getMonth() === dateFilter.getMonth() &&
                        trxDate.getFullYear() === dateFilter.getFullYear();
        }
      }
      
      return matchesSearch && matchesStatus && matchesProof && matchesDate;
    })
    .sort((a, b) => {
      if (sortBy === 'weight_asc') {
        return Number(a.weight) - Number(b.weight);
      } else if (sortBy === 'weight_desc') {
        return Number(b.weight) - Number(a.weight);
      } else if (sortBy === 'price_asc') {
        return Number(a.total_price) - Number(b.total_price);
      } else if (sortBy === 'price_desc') {
        return Number(b.total_price) - Number(a.total_price);
      }
      return 0;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6 print:hidden">
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

      {/* FILTER, SEARCH & VIEW SWITCHER CARD */}
      <div className="flex flex-col gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm print:hidden">
        {/* Row 1: Search, Filter Toggle, & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80 shrink-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nota, pelanggan, layanan..." 
              className="pl-9 bg-background border-border text-foreground focus-visible:ring-primary rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-95 cursor-pointer ${
                showFilters 
                  ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20' 
                  : 'bg-background border-border text-foreground hover:bg-muted'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>Filter {statusFilter !== 'all' || proofFilter !== 'all' || sortBy !== 'default' ? '(Aktif)' : ''}</span>
            </button>

            {/* View Toggle Switcher */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  viewMode === 'table' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Tampilan Tabel"
              >
                <List size={14} />
                <span>Tabel</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  viewMode === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Card Grid"
              >
                <LayoutGrid size={14} />
                <span>Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-border/60 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Filter Tanggal */}
              <div className="space-y-1.5 flex flex-col">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Filter Tanggal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-10 justify-start text-left font-normal rounded-xl border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary cursor-pointer transition-all",
                        !dateFilter && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary shrink-0" />
                      {dateFilter ? (
                        dateFilter.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      ) : (
                        <span>Pilih Tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border border-border shadow-xl z-50 rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      captionLayout="dropdown"
                      startMonth={new Date(2020, 0)}
                      endMonth={new Date(2035, 11)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Bukti Bayar Filter */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Filter Bukti Bayar</Label>
                <Select value={proofFilter} onValueChange={setProofFilter}>
                  <SelectTrigger className="w-full h-10 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary cursor-pointer transition-all">
                    <SelectValue placeholder="Semua Bukti" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="bg-card border-border text-foreground">
                    <SelectItem value="all" className="cursor-pointer">Semua Bukti</SelectItem>
                    <SelectItem value="uploaded" className="cursor-pointer">Sudah Upload Bukti Transfer</SelectItem>
                    <SelectItem value="not_uploaded" className="cursor-pointer">Belum Upload Bukti Transfer</SelectItem>
                    <SelectItem value="cash" className="cursor-pointer">Cash (Tunai)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Filter */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Urutkan Berdasarkan</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full h-10 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary cursor-pointer transition-all">
                    <SelectValue placeholder="Default (Terbaru)" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="bg-card border-border text-foreground">
                    <SelectItem value="default" className="cursor-pointer">Default (Terbaru)</SelectItem>
                    <SelectItem value="weight_asc" className="cursor-pointer">Berat Terkecil → Terbesar</SelectItem>
                    <SelectItem value="weight_desc" className="cursor-pointer">Berat Terbesar → Terkecil</SelectItem>
                    <SelectItem value="price_asc" className="cursor-pointer">Total Harga Terendah → Tertinggi</SelectItem>
                    <SelectItem value="price_desc" className="cursor-pointer">Total Harga Tertinggi → Terendah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status Filters Chips */}
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Filter Status Cucian</Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'all', label: 'Semua Status' },
                  { value: 'antrian', label: 'Antrian' },
                  { value: 'dicuci', label: 'Dicuci' },
                  { value: 'disetrika', label: 'Setrika' },
                  { value: 'siap diambil', label: 'Siap Diambil' },
                  { value: 'diambil', label: 'Diambil' }
                ].map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => setStatusFilter(chip.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 transform hover:scale-[1.02] active:scale-95 cursor-pointer ${
                      statusFilter === chip.value
                        ? 'bg-primary border-primary text-primary-foreground font-semibold shadow-sm'
                        : 'bg-background border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            {(statusFilter !== 'all' || proofFilter !== 'all' || sortBy !== 'default' || dateFilter !== undefined) && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setProofFilter('all');
                    setSortBy('default');
                    setDateFilter(undefined);
                  }}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X size={12} />
                  <span>Reset Filter</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BULK ACTIONS BAR */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-primary/5 border border-primary/20 rounded-2xl p-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary font-mono bg-primary/10 px-2.5 py-1 rounded-lg">
              {selectedIds.length} Data Terpilih
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Ubah Status Terpilih */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 border-border rounded-xl cursor-pointer">
                  Ubah Status Terpilih
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card text-foreground border-border">
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('antrian')} className="cursor-pointer">
                  Antrian
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('dicuci')} className="cursor-pointer">
                  Dicuci
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('disetrika')} className="cursor-pointer">
                  Disetrika
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('siap diambil')} className="cursor-pointer">
                  Siap Diambil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('diambil')} className="cursor-pointer">
                  Diambil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hapus Terpilih */}
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleBulkDelete}
              className="h-9 text-xs gap-1.5 rounded-xl cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Hapus Terpilih</span>
            </Button>

            {/* Deselect All */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedIds([])}
              className="h-9 text-xs text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* RENDER LIST (TABLE VS GRID) */}
      {loading ? (
        <div className="border border-border rounded-2xl bg-card p-12 text-center shadow-sm print:hidden">
          <Loader2 className="animate-spin text-primary mx-auto h-8 w-8" />
          <p className="text-xs text-muted-foreground font-mono mt-2">MENGAMBIL TRANSAKSI...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="border border-border rounded-2xl bg-card p-12 shadow-sm print:hidden">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/65 flex items-center justify-center text-muted-foreground mb-4 border border-border/60 shadow-sm">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Tidak Ada Transaksi</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
              {searchQuery || statusFilter !== 'all' || proofFilter !== 'all' || sortBy !== 'default' 
                ? 'Tidak ada transaksi yang cocok dengan filter pencarian.' 
                : 'Belum ada transaksi tercatat di sistem laundry.'}
            </p>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW MODE */
        <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm print:hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 border-b border-border">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-12 pl-6">
                    <Checkbox 
                      checked={
                        currentTransactions.length > 0 && 
                        currentTransactions.every(t => selectedIds.includes(Number(t.id)))
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Pilih semua transaksi"
                    />
                  </TableHead>
                  <TableHead className="w-28 text-muted-foreground font-mono text-xs">Nota ID</TableHead>
                  <TableHead className="w-28 text-muted-foreground font-mono text-xs">Bukti Bayar</TableHead>
                  <TableHead className="text-muted-foreground font-mono text-xs">Pelanggan</TableHead>
                  <TableHead className="text-muted-foreground font-mono text-xs">Kuantitas</TableHead>
                  <TableHead className="text-muted-foreground font-mono text-xs">Keuangan</TableHead>
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
                      <TableCell className="pl-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={selectedIds.includes(Number(trx.id))}
                          onCheckedChange={() => toggleSelect(trx.id)}
                          aria-label={`Pilih transaksi ${trx.invoice_code}`}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-primary text-xs tracking-wider">{trx.invoice_code}</span>
                      </TableCell>
                      <TableCell onClick={(e) => { if (trx.clothes_photo) e.stopPropagation(); }}>
                        {trx.payment_method === 'transfer' ? (
                          trx.clothes_photo ? (
                            <div 
                              onClick={() => handleViewDetail(trx)}
                              className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-muted relative group cursor-pointer"
                            >
                              <img 
                                src={`${STORAGE_URL}${trx.clothes_photo}`} 
                                alt="Bukti Transfer" 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                              />
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-mono text-rose-500 bg-rose-500/10 border-rose-500/20 px-1.5 py-0.5 rounded-full font-bold">
                              Belum Upload
                            </Badge>
                          )
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic font-mono">Cash (Tunai)</span>
                        )}
                      </TableCell>
                      <TableCell>
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
                              <div onClick={(e) => e.stopPropagation()} className="absolute left-0 bottom-full mb-2.5 z-50 w-64 bg-card border border-border p-4 rounded-xl shadow-xl text-left animate-in fade-in slide-in-from-bottom-2">
                                <div className="space-y-2.5">
                                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>Detail Kontak Pelanggan</span>
                                  </div>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <MessageSquare size={13} className="shrink-0" />
                                      <a href={formatWhatsAppLink(trx.customer?.phone)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono font-semibold">
                                        {trx.customer?.phone || '-'} ↗
                                      </a>
                                    </div>
                                    <div className="flex items-start gap-2 text-muted-foreground">
                                      <MapPin size={13} className="shrink-0 mt-0.5" />
                                      <span className="leading-relaxed">{trx.customer?.address || 'Tidak ada alamat'}</span>
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
                      {/* Kolom Indikator Keuangan UKK */}
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="font-mono font-bold text-foreground">
                            Rp {Number(trx.total_price || 0).toLocaleString('id-ID')}
                          </span>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className={`text-[9px] font-mono px-1.5 py-0 rounded-full uppercase shrink-0 ${trx.payment_method === 'transfer' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                              {trx.payment_method}
                            </Badge>
                            <Badge variant="outline" className={`text-[9px] font-mono px-1.5 py-0 rounded-full font-bold uppercase shrink-0 ${getPaymentStatusStyles(trx.payment_status)}`}>
                              {trx.payment_status}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={trx.status} 
                          onValueChange={(value) => handleStatusChange(trx.id, value)}
                        >
                          <SelectTrigger 
                            onClick={(e) => e.stopPropagation()}
                            className={`h-8 px-2.5 text-xs font-semibold font-mono rounded-lg transition-all duration-200 ${getStatusStyles(trx.status)}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper" className="bg-card border-border text-foreground">
                            <SelectItem value="antrian" className="text-blue-500 cursor-pointer">Antrian</SelectItem>
                            <SelectItem value="dicuci" className="text-blue-500 cursor-pointer">Dicuci</SelectItem>
                            <SelectItem value="disetrika" className="text-blue-500 cursor-pointer">Disetrika</SelectItem>
                            <SelectItem value="siap diambil" className="text-emerald-500 cursor-pointer">Siap Diambil</SelectItem>
                            <SelectItem value="diambil" className="text-muted-foreground cursor-pointer">Sudah Diambil</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="outline" size="icon" className="border-border text-primary hover:text-primary-foreground hover:bg-primary h-8 w-8 rounded-lg" onClick={(e) => { e.stopPropagation(); handleEditOpen(trx); }} >
                            <Edit size={14} />
                          </Button>
                          <Button variant="outline" size="icon" className="border-border text-destructive hover:text-destructive-foreground hover:bg-destructive h-8 w-8 rounded-lg" onClick={(e) => { e.stopPropagation(); handleDelete(trx.id); }} >
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
          {currentTransactions.map((trx, i) => {
            const name = trx.customer?.user?.name || 'Pelanggan';
            const avatarColor = avatarColors[i % avatarColors.length];
            return (
              <div 
                key={trx.id} 
                onClick={() => handleViewDetail(trx)}
                className="group bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col cursor-pointer"
              >
                <div className="h-48 w-full bg-muted relative overflow-hidden shrink-0 border-b border-border/50">
                  {trx.payment_method === 'transfer' ? (
                    trx.clothes_photo ? (
                      <img src={`${STORAGE_URL}${trx.clothes_photo}`} alt="Bukti Transfer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-rose-500 gap-2 bg-rose-50 dark:bg-rose-950/10">
                        <CreditCard size={32} className="stroke-[1.5]" />
                        <span className="text-[10px] font-mono font-bold tracking-wider">MENUNGGU BUKTI TRANSFER</span>
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-emerald-600 gap-2 bg-emerald-50 dark:bg-emerald-950/10">
                      <DollarSign size={32} className="stroke-[1.5]" />
                      <span className="text-[10px] font-mono font-bold tracking-wider">PEMBAYARAN TUNAI (CASH)</span>
                    </div>
                  )}
                  
                  {/* Checkbox Overlay */}
                  <div 
                    className="absolute top-3 left-3 z-10 bg-black/40 backdrop-blur-sm p-1.5 rounded-lg border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox 
                      checked={selectedIds.includes(Number(trx.id))}
                      onCheckedChange={() => toggleSelect(trx.id)}
                      className="border-white/60 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      aria-label={`Pilih transaksi ${trx.invoice_code}`}
                    />
                  </div>

                  <div className="absolute top-3 left-12 bg-neutral-900/80 dark:bg-black/75 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider">
                    {trx.invoice_code}
                  </div>
                  {/* Badge Status Finansial Overlay */}
                  <div className="absolute top-3 right-3 flex gap-1">
                    <Badge className={`text-[9px] font-mono font-bold uppercase border-none text-white ${trx.payment_status === 'paid' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                      {trx.payment_status}
                    </Badge>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
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

                    <div className="bg-muted/40 p-2.5 rounded-xl border border-border/60 flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kuantitas:</span>
                        <span className="font-semibold text-foreground font-mono">{trx.weight} {trx.service?.unit || 'Kg'}</span>
                      </div>
                      <div className="flex justify-between border-t border-border/40 pt-1.5">
                        <span className="text-muted-foreground">Total Tagihan:</span>
                        <span className="font-bold text-primary font-mono">Rp {Number(trx.total_price || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground font-mono uppercase font-bold">Status:</span>
                      <Select 
                        value={trx.status} 
                        onValueChange={(value) => handleStatusChange(trx.id, value)}
                      >
                        <SelectTrigger 
                          onClick={(e) => e.stopPropagation()}
                          className={`h-8 px-2 text-xs font-semibold font-mono rounded-lg transition-all duration-200 ${getStatusStyles(trx.status)}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper" className="bg-card border-border text-foreground">
                          <SelectItem value="antrian" className="text-blue-500 cursor-pointer">Antrian</SelectItem>
                          <SelectItem value="dicuci" className="text-blue-500 cursor-pointer">Dicuci</SelectItem>
                          <SelectItem value="disetrika" className="text-blue-500 cursor-pointer">Disetrika</SelectItem>
                          <SelectItem value="siap diambil" className="text-emerald-500 cursor-pointer">Siap Diambil</SelectItem>
                          <SelectItem value="diambil" className="text-muted-foreground cursor-pointer">Sudah Diambil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      <Button variant="outline" className="flex-1 border-border text-xs text-primary hover:text-primary-foreground hover:bg-primary h-9 rounded-xl gap-1.5" onClick={(e) => { e.stopPropagation(); handleEditOpen(trx); }} >
                        <Edit size={13} /> Edit
                      </Button>
                      <Button variant="outline" className="border-border text-destructive hover:text-destructive-foreground hover:bg-destructive h-9 w-9 p-0 rounded-xl" onClick={(e) => { e.stopPropagation(); handleDelete(trx.id); }} >
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm mt-4 print:hidden">
          <div className="text-xs text-muted-foreground font-mono">
            Menampilkan <span className="font-semibold text-foreground">{indexOfFirstItem + 1}</span> - <span className="font-semibold text-foreground">{Math.min(indexOfLastItem, filteredTransactions.length)}</span> dari <span className="font-semibold text-foreground">{filteredTransactions.length}</span> data
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border text-muted-foreground hover:text-foreground hover:bg-muted" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} >
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button key={page} variant={currentPage === page ? "default" : "outline"} className={`h-8 w-8 text-xs rounded-lg ${currentPage === page ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/10" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted font-medium"}`} onClick={() => setCurrentPage(page)} >
                {page}
              </Button>
            ))}
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border text-muted-foreground hover:text-foreground hover:bg-muted" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* FORM INPUT/EDIT SLIDE-OVER DRAWER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end print:hidden">
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 ease-in-out text-foreground">
            <div className="p-6 border-b border-border/60 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-foreground">{editId ? 'Ubah Nota Transaksi' : 'Buat Nota Transaksi Baru'}</h2>
                <p className="text-[11px] text-muted-foreground font-mono">{editId ? `Mengedit Transaksi #${editId}` : 'Isi detail operasional pakaian pelanggan'}</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
                {/* Pelanggan */}
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Pelanggan</Label>
                  <Select 
                    value={formData.customer_id} 
                    onValueChange={(val) => setFormData({ ...formData, customer_id: val })}
                  >
                    <SelectTrigger className="w-full h-11 bg-background border-border text-foreground rounded-xl text-sm focus:ring-1 focus:ring-primary">
                      <SelectValue placeholder="-- Pilih Pelanggan --" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="bg-card border-border text-foreground">
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()} className="cursor-pointer">
                          {c.user?.name} ({c.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
       
                {/* Layanan */}
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Layanan</Label>
                  <Select 
                    value={formData.service_id} 
                    onValueChange={(val) => setFormData({ ...formData, service_id: val })}
                  >
                    <SelectTrigger className="w-full h-11 bg-background border-border text-foreground rounded-xl text-sm focus:ring-1 focus:ring-primary">
                      <SelectValue placeholder="-- Pilih Layanan --" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="bg-card border-border text-foreground">
                      {services
                        .filter(service => service.is_active === true || service.is_active === 1 || (editId !== null && service.id.toString() === formData.service_id))
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()} className="cursor-pointer">
                            {s.service_name} ({s.unit})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Kuantitas */}
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Berat / Kuantitas</Label>
                  <div className="relative">
                    <Input type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="Misal: 2.5" className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm pr-12 font-mono h-11" required />
                    <div className="absolute right-3.5 top-3.5 text-xs text-muted-foreground font-mono">
                      {formData.service_id ? (services.find(s => s.id.toString() === formData.service_id)?.unit || 'Kg') : 'Kg'}
                    </div>
                  </div>
                </div>

                {/* Metode Pembayaran (UKK Mandate) */}
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Metode Pembayaran</Label>
                  <Select 
                    value={formData.payment_method} 
                    onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
                  >
                    <SelectTrigger className="w-full h-11 bg-background border-border text-foreground rounded-xl text-sm focus:ring-1 focus:ring-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="bg-card border-border text-foreground">
                      <SelectItem value="cash" className="cursor-pointer">Cash (Tunai)</SelectItem>
                      <SelectItem value="transfer" className="cursor-pointer">Transfer Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Pembayaran (UKK Mandate) */}
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Status Pembayaran</Label>
                  <Select 
                    value={formData.payment_status} 
                    onValueChange={(val) => setFormData({ ...formData, payment_status: val })}
                  >
                    <SelectTrigger className="w-full h-11 bg-background border-border text-foreground rounded-xl text-sm focus:ring-1 focus:ring-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="bg-card border-border text-foreground">
                      <SelectItem value="pending" className="cursor-pointer">Pending (Belum Bayar)</SelectItem>
                      <SelectItem value="paid" className="cursor-pointer">Paid (Lunas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Estimasi Harga */}
                {(() => {
                  const selectedService = services.find(s => s.id.toString() === formData.service_id);
                  if (!selectedService || !formData.weight) return null;
                  const estimated = Number(selectedService.price) * Number(formData.weight);
                  return (
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-1 animate-in fade-in slide-in-from-top-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest block font-mono">Estimasi Biaya</span>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-muted-foreground">
                          {formData.weight} {selectedService.unit} × Rp {Number(selectedService.price).toLocaleString('id-ID')}
                        </span>
                        <span className="text-sm font-extrabold text-foreground font-mono">Rp {estimated.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* LOGIKA KONDISIONAL: Form Upload Bukti Transfer Hanya Muncul Jika Pilih Transfer */}
                {formData.payment_method === 'transfer' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="text-primary text-xs font-semibold">Foto Bukti Transfer (Wajib Transfer)</Label>
                    <div className="border border-dashed border-primary/30 rounded-xl p-4 bg-primary/[0.02] flex flex-col items-center justify-center gap-2 hover:border-primary/60 transition-colors relative cursor-pointer group">
                      <input type="file" accept="image/*" onChange={handlePaymentProofChange} className="absolute inset-0 opacity-0 cursor-pointer" required={!editId} />
                      {proofPreview ? (
                        <div className="relative w-full max-h-[160px] flex items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
                          <img src={proofPreview} alt="Bukti Transfer Preview" className="h-full max-h-[140px] w-full object-contain" />
                        </div>
                      ) : (
                        <>
                          <CreditCard className="text-muted-foreground h-6 w-6 group-hover:text-primary transition-colors" />
                          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Klik untuk mengupload Bukti Transfer</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-border/60 bg-muted/20 flex gap-3 shrink-0">
                <Button type="button" variant="outline" className="flex-1 border-border text-foreground hover:bg-muted rounded-xl" onClick={() => setIsModalOpen(false)} >Batal</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl" >
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Simpan Transaksi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL / NOTA (Operational & Financial Integration) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card border-border text-foreground rounded-3xl p-6 no-scrollbar print:max-w-none print:max-h-none print:w-full print:h-full print:bg-white print:text-black print:p-0 print:border-none print:shadow-none print:absolute print:inset-0 print:z-[9999]">
          {selectedTrx && (
            <div className="space-y-6 print:hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">Detail Transaksi</h3>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{selectedTrx.invoice_code}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusStyles(selectedTrx.status)}`}>
                    {selectedTrx.status}
                  </Badge>
                  <Badge className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${getPaymentStatusStyles(selectedTrx.payment_status)}`}>
                    {selectedTrx.payment_status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                {/* Column 1: Stepper & Package Details (Span 7) */}
                <div className="md:col-span-7 space-y-6 flex flex-col justify-between">
                  {/* Progress Timeline */}
                  <div className="bg-muted/30 border border-border/80 p-5 rounded-2xl">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-mono mb-4">Progress Cucian</span>
                    {(() => {
                      const steps = ['antrian', 'dicuci', 'disetrika', 'siap diambil', 'diambil'];
                      const stepLabels: Record<string, string> = {
                        'antrian': 'Antrian', 'dicuci': 'Dicuci', 'disetrika': 'Setrika', 'siap diambil': 'Siap', 'diambil': 'Selesai'
                      };
                      const currentStepIdx = steps.indexOf(selectedTrx.status.toLowerCase());
                      return (
                        <div className="relative flex items-center justify-between w-full pt-1">
                          <div className="absolute left-6 right-6 top-4 h-[2px] bg-neutral-200 dark:bg-neutral-800 z-0" />
                          <div className="absolute left-6 top-4 h-[2px] bg-primary transition-all duration-500 z-0" style={{ width: `${(Math.max(0, currentStepIdx) / (steps.length - 1)) * 100}%` }} />
                          {steps.map((step, idx) => {
                            const isActive = idx <= currentStepIdx;
                            const isCurrent = idx === currentStepIdx;
                            return (
                              <div key={step} className="flex flex-col items-center z-10 relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                  isCurrent ? 'bg-primary border-primary text-white scale-110 shadow-md shadow-primary/20' : 
                                  isActive ? 'bg-foreground border-foreground text-background font-bold' : 
                                  'bg-card border-border text-muted-foreground'
                                }`}>
                                  <span className="text-[10px] font-bold">{idx + 1}</span>
                                </div>
                                <span className={`text-[9px] font-bold mt-2 tracking-tight ${isCurrent ? 'text-primary' : isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {stepLabels[step]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Package details */}
                  <div className="bg-card border border-border p-5 rounded-2xl space-y-4 flex-1 mt-4">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-mono border-b border-border/60 pb-2">Rincian Paket & Cucian</span>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">Layanan Paket:</span>
                        <span className="font-bold text-foreground text-sm">{selectedTrx.service?.service_name || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-t border-border/40">
                        <span className="text-muted-foreground">Kuantitas / Berat:</span>
                        <span className="font-semibold text-foreground font-mono">{selectedTrx.weight} {selectedTrx.service?.unit || 'Kg'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-t border-border/40">
                        <span className="text-muted-foreground">Tarif Satuan:</span>
                        <span className="font-medium text-foreground font-mono">Rp {Number(selectedTrx.service?.price || 0).toLocaleString('id-ID')} / {selectedTrx.service?.unit || 'Kg'}</span>
                      </div>
                      <div className="bg-primary/5 border border-primary/10 p-3.5 rounded-xl flex justify-between items-center mt-4">
                        <span className="text-xs font-semibold text-primary uppercase font-mono">Total Tagihan</span>
                        <span className="text-base font-extrabold text-foreground font-mono">Rp {Number(selectedTrx.total_price || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Customer info & payment proof (Span 5) */}
                <div className="md:col-span-5 space-y-6">
                  {/* Customer Card */}
                  <div className="bg-card border border-border p-5 rounded-2xl space-y-3">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-mono border-b border-border/60 pb-2">Pelanggan</span>
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-foreground">{selectedTrx.customer?.user?.name || 'Pelanggan'}</h4>
                      <p className="text-[10px] text-muted-foreground font-mono">ID Pelanggan: #CST-{selectedTrx.customer?.id}</p>
                    </div>
                    <div className="space-y-2 text-xs pt-1">
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase font-mono">No. WhatsApp</span>
                        <a href={formatWhatsAppLink(selectedTrx.customer?.phone)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono font-semibold block mt-0.5">
                          {selectedTrx.customer?.phone || '-'} ↗
                        </a>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase font-mono">Alamat</span>
                        <p className="text-foreground leading-normal mt-0.5 line-clamp-2 text-xs">{selectedTrx.customer?.address || 'Tidak ada alamat'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details & Proof */}
                  <div className="bg-card border border-border p-5 rounded-2xl space-y-3">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-mono border-b border-border/60 pb-2">Pembayaran</span>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Metode:</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold font-mono tracking-wider">{selectedTrx.payment_method}</Badge>
                    </div>
                    {selectedTrx.payment_method === 'transfer' && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[9px] text-muted-foreground block uppercase font-mono">Bukti Transfer</span>
                        <div className="border border-dashed border-border rounded-xl p-1 bg-muted/20 overflow-hidden h-28 flex items-center justify-center relative group">
                          {selectedTrx.clothes_photo ? (
                            <img src={`${STORAGE_URL}${selectedTrx.clothes_photo}`} alt="Bukti Transfer" className="h-full object-contain rounded-lg" />
                          ) : (
                            <span className="text-[9px] text-rose-500 italic font-mono">Belum Upload</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTrx && (
            <div id="print-receipt" className="hidden print:block w-full max-w-[80mm] mx-auto text-black bg-white p-4 font-mono text-[10pt] text-center leading-normal">
              {/* Style overrides just for printing */}
              <style>{`
                @media print {
                  @page {
                    margin: 0;
                    size: 80mm auto;
                  }
                  html, body {
                    background: #fff !important;
                    color: #000 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                  }
                  #print-receipt {
                    display: block !important;
                    width: 100% !important;
                    max-width: 80mm !important;
                    margin: 0 auto !important;
                    padding: 6mm 4mm !important;
                    font-family: 'Courier New', Courier, monospace !important;
                    font-size: 10pt !important;
                    line-height: 1.3 !important;
                    text-align: center !important;
                    background: #fff !important;
                    color: #000 !important;
                    box-sizing: border-box !important;
                  }
                }
              `}</style>
              
              <div className="text-center font-bold uppercase text-sm tracking-wider">
                {localStorage.getItem('shop_name') || 'CDC LAUNDRY'}
              </div>
              <div className="text-[10px] leading-snug">
                {localStorage.getItem('shop_address') || 'Jl. Raya Kampus Udayana No. 20, Bali'}
              </div>
              <div className="text-[10px] leading-snug">
                Telp/WA: {localStorage.getItem('shop_phone') || '081234567890'}
              </div>
              
              <div className="my-2 font-mono text-center select-none text-[10px]">--------------------------------</div>
              
              <div className="text-left space-y-0.5 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span>Invoice:</span>
                  <span className="font-bold">{selectedTrx.invoice_code}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{new Date(selectedTrx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{selectedTrx.customer?.user?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Telepon:</span>
                  <span>{selectedTrx.customer?.phone || '-'}</span>
                </div>
              </div>
              
              <div className="my-2 font-mono text-center select-none text-[10px]">--------------------------------</div>
              
              <div className="text-left text-[11px] font-mono space-y-1">
                <div className="font-bold">{selectedTrx.service?.service_name || 'Layanan Laundry'}</div>
                <div className="flex justify-between pl-2">
                  <span>{selectedTrx.weight} {selectedTrx.service?.unit || 'Kg'} x Rp {Number(selectedTrx.service?.price || 0).toLocaleString('id-ID')}</span>
                  <span>Rp {Number(selectedTrx.total_price || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>
              
              <div className="my-2 font-mono text-center select-none text-[10px]">--------------------------------</div>
              
              <div className="text-left space-y-0.5 text-[11px] font-mono">
                <div className="flex justify-between font-bold text-[12px]">
                  <span>TOTAL BIAYA:</span>
                  <span>Rp {Number(selectedTrx.total_price || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pembayaran:</span>
                  <span className="uppercase">{selectedTrx.payment_method} ({selectedTrx.payment_status})</span>
                </div>
                <div className="flex justify-between">
                  <span>Status Cucian:</span>
                  <span className="uppercase font-bold">{selectedTrx.status}</span>
                </div>
              </div>
              
              <div className="my-2 font-mono text-center select-none text-[10px]">--------------------------------</div>
              
              <div className="text-[10px] leading-relaxed text-center italic font-mono">
                <p className="font-bold">{localStorage.getItem('receipt_header') || 'Terima Kasih Atas Kepercayaan Anda'}</p>
                <p className="mt-1 text-[9px]">{localStorage.getItem('receipt_footer') || 'Mohon periksa cucian sebelum meninggalkan outlet. Komplain maksimal 24 jam setelah cucian diambil.'}</p>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2 print:hidden border-t border-border/60">
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all" onClick={() => window.print()} >
              Cetak Struk (Print)
            </Button>
            <Button variant="outline" className="flex-1 border-border text-foreground hover:bg-muted rounded-xl transition-all" onClick={() => setIsDetailOpen(false)} >
              Tutup Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}