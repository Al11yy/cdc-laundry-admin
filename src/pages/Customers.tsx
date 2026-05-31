import React, { useState, useEffect, useRef } from 'react';
import apiClient from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, Phone, Users, Mail, MapPin, Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Activity, Trophy } from 'lucide-react';
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

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { searchQuery, setSearchQuery } = useSearch();
  const [activityFilter, setActivityFilter] = useState('all');
  const [nameSort, setNameSort] = useState('default');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activityFilter, nameSort]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const [custRes, trxRes] = await Promise.all([
        apiClient.get('/customers'),
        apiClient.get('/transactions')
      ]);
      setCustomers(custRes.data?.data || custRes.data || []);
      setTransactions(trxRes.data?.data || trxRes.data || []);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchCustomers(); 
  }, []);

  const handleEditOpen = (customer: any) => {
    setEditId(customer.id);
    setFormData({
      name: customer.user?.name || '',
      email: customer.user?.email || '',
      phone: customer.phone,
      address: customer.address,
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleAddOpen = () => {
    setEditId(null);
    setFormData({ name: '', email: '', phone: '', address: '', password: '' });
    setIsModalOpen(true);
  };

  const handleViewDetail = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Buat payload bersih: jika edit & password kosong, jangan kirim password
      const payload = { ...formData };
      if (editId && !payload.password) {
        delete (payload as any).password;
      }

      if (editId) {
        await apiClient.put(`/customers/${editId}`, payload);
        toast.success('Data pelanggan berhasil diperbarui!');
      } else {
        await apiClient.post('/customers', payload);
        toast.success('Akun pelanggan berhasil dibuat.');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error: any) {
      toast.error('Gagal menyimpan data', { 
        description: error.response?.data?.message || 'Pastikan isian form valid.' 
      });
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus data pelanggan ini?')) return;
    
    const backupCustomers = [...customers];
    setCustomers(customers.filter(c => c.id !== id));
    setSelectedIds(prev => prev.filter(item => item !== id));

    try {
      await apiClient.delete(`/customers/${id}`);
      toast.success('Pelanggan telah berhasil dihapus.');
    } catch (error) { 
      setCustomers(backupCustomers);
      toast.error('Gagal menghapus data!', {
        description: 'Kemungkinan pelanggan sudah terikat dengan transaksi aktif.'
      }); 
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const currentIds = currentCustomers.map(c => c.id);
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
    if (!window.confirm(`Yakin ingin menghapus ${selectedIds.length} pelanggan terpilih?`)) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => apiClient.delete(`/customers/${id}`)));
      toast.success('Pelanggan terpilih berhasil dihapus.');
      setSelectedIds([]);
      fetchCustomers();
    } catch (error) {
      toast.error('Gagal menghapus beberapa pelanggan! Kemungkinan sudah terikat dengan transaksi aktif.');
      fetchCustomers();
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'C';
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

  const filteredCustomers = customers
    .filter(c => {
      const name = c.user?.name || '';
      const email = c.user?.email || '';
      const phone = c.phone || '';
      const address = c.address || '';
      
      const matchesSearch = 
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery) ||
        address.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Calculate activity/loyalty metrics for this customer
      const customerTrxs = transactions.filter(t => Number(t.customer_id) === Number(c.id));
      const hasActive = customerTrxs.some(t => t.status.toLowerCase() !== 'diambil');
      const orderCount = customerTrxs.length;
      const totalWeight = customerTrxs.reduce((sum, t) => sum + Number(t.weight || 0), 0);
      
      let latestDate: Date | null = null;
      if (customerTrxs.length > 0) {
        const dates = customerTrxs.map(t => new Date(t.created_at).getTime());
        latestDate = new Date(Math.max(...dates));
      }
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const isPassive = !latestDate || latestDate < thirtyDaysAgo;

      let matchesActivity = true;
      if (activityFilter === 'active') {
        matchesActivity = hasActive;
      } else if (activityFilter === 'loyal') {
        matchesActivity = orderCount >= 5 || totalWeight > 10;
      } else if (activityFilter === 'passive') {
        matchesActivity = isPassive;
      }
      
      return matchesSearch && matchesActivity;
    })
    .sort((a, b) => {
      const nameA = a.user?.name || '';
      const nameB = b.user?.name || '';
      if (nameSort === 'asc') {
        return nameA.localeCompare(nameB);
      } else if (nameSort === 'desc') {
        return nameB.localeCompare(nameA);
      }
      return 0; 
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const avatarColors = [
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/40',
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/40',
    'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/40',
  ];

  // Hitung data statistik riil berdasarkan transaksi
  const totalCust = customers.length;
  
  const activeCust = customers.filter(c => {
    const custTrxs = transactions.filter(t => Number(t.customer_id) === Number(c.id));
    return custTrxs.some(t => t.status.toLowerCase() !== 'diambil');
  }).length;
  
  const loyalCust = customers.filter(c => {
    const custTrxs = transactions.filter(t => Number(t.customer_id) === Number(c.id));
    const orderCount = custTrxs.length;
    const totalWeight = custTrxs.reduce((sum, t) => sum + Number(t.weight || 0), 0);
    return orderCount >= 5 || totalWeight > 10;
  }).length;

  return (
    <div className="space-y-6">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Pelanggan</h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Kelola kontak, alamat pengiriman, dan kredensial login mobile pelanggan.
          </p>
        </div>
        <Button onClick={handleAddOpen} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl px-4 py-2 font-medium">
          <Plus size={16} /> Tambah Pelanggan
        </Button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pelanggan */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">Total Pelanggan</span>
            <span className="text-2xl font-black tracking-tight text-foreground font-mono">{totalCust}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Users size={20} />
          </div>
        </div>

        {/* Pelanggan Aktif */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">Pelanggan Aktif</span>
            <span className="text-2xl font-black tracking-tight text-emerald-500 font-mono">{activeCust}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Activity size={20} />
          </div>
        </div>

        {/* Pelanggan Loyal */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">Pelanggan Loyal</span>
            <span className="text-2xl font-black tracking-tight text-amber-500 font-mono">{loyalCust}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Trophy size={20} />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3 justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nama, email, atau hp..." 
              className="pl-9 bg-background border-border text-foreground focus-visible:ring-primary rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-95 cursor-pointer ${
              showFilters 
                ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20' 
                : 'bg-background border-border text-foreground hover:bg-muted'
            }`}
          >
            <SlidersHorizontal size={14} /> 
            <span>Filter {activityFilter !== 'all' || nameSort !== 'default' ? '(Aktif)' : ''}</span>
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-border/60 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status Aktivitas Filter */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Status Aktivitas</Label>
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="w-full h-10 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary cursor-pointer transition-all">
                    <SelectValue placeholder="Semua Pelanggan" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="bg-card border-border text-foreground">
                    <SelectItem value="all" className="cursor-pointer">Semua Pelanggan</SelectItem>
                    <SelectItem value="active" className="cursor-pointer">Sedang Mencuci</SelectItem>
                    <SelectItem value="loyal" className="cursor-pointer">Pelanggan Loyal</SelectItem>
                    <SelectItem value="passive" className="cursor-pointer">Pelanggan Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Name Filter */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Urutkan Nama</Label>
                <Select value={nameSort} onValueChange={setNameSort}>
                  <SelectTrigger className="w-full h-10 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary cursor-pointer transition-all">
                    <SelectValue placeholder="Default (Terbaru)" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="bg-card border-border text-foreground">
                    <SelectItem value="default" className="cursor-pointer">Default (Terbaru)</SelectItem>
                    <SelectItem value="asc" className="cursor-pointer">Nama Pelanggan (A-Z)</SelectItem>
                    <SelectItem value="desc" className="cursor-pointer">Nama Pelanggan (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reset Button */}
            {(activityFilter !== 'all' || nameSort !== 'default') && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setActivityFilter('all');
                    setNameSort('default');
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
              {selectedIds.length} Pelanggan Terpilih
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={handleBulkDelete}
              className="h-9 text-xs rounded-xl font-medium cursor-pointer gap-1.5"
            >
              <Trash2 size={14} />
              <span>Hapus Terpilih</span>
            </Button>
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

      {/* CUSTOMER LIST TABLE */}
      <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-12 pl-6">
                <Checkbox 
                  checked={
                    currentCustomers.length > 0 && 
                    currentCustomers.every(c => selectedIds.includes(c.id))
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Pilih semua pelanggan"
                />
              </TableHead>
              <TableHead className="w-16 text-muted-foreground font-mono text-xs">No</TableHead>
              <TableHead className="text-muted-foreground font-mono text-xs">Profil Pelanggan</TableHead>
              <TableHead className="text-muted-foreground font-mono text-xs">Telepon</TableHead>
              <TableHead className="text-muted-foreground font-mono text-xs">Alamat</TableHead>
              <TableHead className="text-right text-muted-foreground font-mono text-xs pr-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="text-center h-32">
                  <Loader2 className="animate-spin text-primary mx-auto h-8 w-8" />
                  <p className="text-xs text-muted-foreground font-mono mt-2">MENGAMBIL PELANGGAN...</p>
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted/65 flex items-center justify-center text-muted-foreground mb-4 border border-border/60 shadow-sm">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Tidak Ada Pelanggan</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                      {searchQuery || activityFilter !== 'all' || nameSort !== 'default' 
                        ? 'Tidak ada pelanggan yang cocok dengan kriteria filter.' 
                        : 'Belum ada data pelanggan yang terdaftar di sistem.'}
                    </p>
                    {!(searchQuery || activityFilter !== 'all' || nameSort !== 'default') && (
                      <Button onClick={handleAddOpen} variant="outline" className="mt-4 border-border text-xs rounded-xl gap-2 hover:bg-muted text-foreground">
                        <Plus size={14} /> Tambah Pelanggan
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentCustomers.map((c, i) => {
                const name = c.user?.name || 'Pelanggan';
                const email = c.user?.email || 'N/A';
                const avatarColor = avatarColors[i % avatarColors.length];

                return (
                  <TableRow 
                    key={c.id} 
                    onClick={() => handleViewDetail(c)}
                    className="border-b border-border/60 cursor-pointer hover:bg-muted/70 dark:hover:bg-neutral-900/50 transition-colors"
                  >
                    <TableCell className="pl-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedIds.includes(c.id)}
                        onCheckedChange={() => toggleSelect(c.id)}
                        aria-label={`Pilih pelanggan ${name}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{indexOfFirstItem + i + 1}</TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold font-mono ${avatarColor}`}>
                          {getInitials(name)}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground text-sm">{name}</span>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground">
                      {c.phone ? (
                        <a 
                          href={formatWhatsAppLink(c.phone)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1.5 text-primary hover:underline hover:text-primary/80 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone size={13} className="text-muted-foreground" />
                          {c.phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{c.address || '-'}</TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1.5">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="border-border text-primary hover:text-primary-foreground hover:bg-primary h-8 w-8 rounded-lg" 
                          onClick={(e) => { e.stopPropagation(); handleEditOpen(c); }}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="border-border text-destructive hover:text-destructive-foreground hover:bg-destructive h-8 w-8 rounded-lg" 
                          onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
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

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm font-sans mt-4">
          <div className="text-xs text-muted-foreground font-mono">
            Menampilkan <span className="font-semibold text-foreground">{indexOfFirstItem + 1}</span> - <span className="font-semibold text-foreground">{Math.min(indexOfLastItem, filteredCustomers.length)}</span> dari <span className="font-semibold text-foreground">{filteredCustomers.length}</span> data
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
                  {editId ? 'Ubah Data Pelanggan' : 'Daftarkan Akun Pelanggan Baru'}
                </h2>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {editId ? `Mengedit Pelanggan #${editId}` : 'Isi detail data pelanggan baru'}
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
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Nama Lengkap</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter') { 
                        e.preventDefault(); 
                        emailRef.current?.focus(); 
                      } 
                    }} 
                    placeholder="Misal: Sophie Laurent"
                    className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm"
                    required 
                    autoFocus 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Alamat Email</Label>
                  <Input 
                    type="email" 
                    value={formData.email} 
                    ref={emailRef} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter') { 
                        e.preventDefault(); 
                        editId ? passRef.current?.focus() : passRef.current?.focus(); 
                      } 
                    }} 
                    placeholder="sophie@example.com"
                    className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm"
                    required 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Password Login Mobile {editId && '(Opsional)'}
                  </Label>
                  <Input 
                    type="password" 
                    placeholder={editId ? "Kosongkan jika tidak diubah" : "Min 6 karakter"} 
                    value={formData.password} 
                    ref={passRef} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter') { 
                        e.preventDefault(); 
                        phoneRef.current?.focus(); 
                      } 
                    }} 
                    className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm"
                    required={!editId} 
                    minLength={6} 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Nomor Telepon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="tel" 
                      className="pl-9 bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm font-mono" 
                      placeholder="08123456789" 
                      value={formData.phone} 
                      ref={phoneRef} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} 
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter') { 
                          e.preventDefault(); 
                          addressRef.current?.focus(); 
                        } 
                      }} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Alamat Rumah</Label>
                  <Input 
                    value={formData.address} 
                    ref={addressRef} 
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                    placeholder="Jl. Merdeka Raya No. 12"
                    className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm"
                    required 
                  />
                </div>
              </div>
              
              {/* Sticky Drawer Footer */}
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
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Simpan Pelanggan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAIL PROFIL MODAL */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[420px] bg-card border border-border text-foreground rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
          {selectedCustomer && (() => {
            const customerTrxs = transactions.filter(t => Number(t.customer_id) === Number(selectedCustomer.id));
            const customerTrxsCount = customerTrxs.length;
            const customerWeightCount = customerTrxs.reduce((sum, t) => sum + Number(t.weight || 0), 0);
            return (
              <div className="space-y-6">
                {/* Header with Avatar */}
                <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-border/50">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-black text-xl font-mono shadow-inner">
                    {getInitials(selectedCustomer.user?.name || '')}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-foreground leading-tight">{selectedCustomer.user?.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono mt-1">CUSTOMER ID: #CST-{selectedCustomer.id}</p>
                  </div>
                </div>

                {/* Contact / Profile Info List */}
                <div className="space-y-4 text-xs">
                  {/* Email */}
                  <div className="flex items-center justify-between p-3.5 bg-muted/30 border border-border/60 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background border border-border rounded-xl text-muted-foreground">
                        <Mail size={14} />
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground font-bold font-mono uppercase tracking-wider block">Email Sistem</span>
                        <span className="font-medium text-foreground mt-0.5 block truncate max-w-[180px]">{selectedCustomer.user?.email || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex items-center justify-between p-3.5 bg-muted/30 border border-border/60 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background border border-border rounded-xl text-muted-foreground">
                        <Phone size={14} />
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground font-bold font-mono uppercase tracking-wider block">WhatsApp / HP</span>
                        {selectedCustomer.phone ? (
                          <a 
                            href={formatWhatsAppLink(selectedCustomer.phone)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="font-semibold text-primary hover:underline mt-0.5 block font-mono"
                          >
                            {selectedCustomer.phone} ↗
                          </a>
                        ) : (
                          <span className="font-medium text-muted-foreground mt-0.5 block">-</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="p-3.5 bg-muted/30 border border-border/60 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-background border border-border rounded-xl text-muted-foreground">
                        <MapPin size={14} />
                      </div>
                      <span className="text-[9px] text-muted-foreground font-bold font-mono uppercase tracking-wider">Alamat Rumah</span>
                    </div>
                    <p className="text-foreground leading-relaxed pl-1 text-xs whitespace-pre-wrap">
                      {selectedCustomer.address || 'Tidak ada info alamat.'}
                    </p>
                  </div>

                  {/* Activity Summary Stats */}
                  <div className="p-3.5 bg-muted/30 border border-border/60 rounded-2xl space-y-3">
                    <span className="text-[9px] text-muted-foreground font-bold font-mono uppercase tracking-wider block">Ringkasan Aktivitas Toko</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-background border border-border/60 p-2.5 rounded-xl text-center shadow-sm">
                        <span className="text-[9px] text-muted-foreground font-mono block">Total Order</span>
                        <span className="font-extrabold text-xs text-primary font-mono mt-0.5 block">{customerTrxsCount} Kali</span>
                      </div>
                      <div className="bg-background border border-border/60 p-2.5 rounded-xl text-center shadow-sm">
                        <span className="text-[9px] text-muted-foreground font-mono block">Total Berat</span>
                        <span className="font-extrabold text-xs text-emerald-500 font-mono mt-0.5 block">{customerWeightCount} Kg</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="pt-2">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 rounded-2xl shadow-md transition-all active:scale-[0.99] text-xs" 
                    onClick={() => setIsDetailOpen(false)}
                  >
                    Tutup Profil Pelanggan
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
      
    </div>
  );
}