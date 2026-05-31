import React, { useState, useEffect } from 'react';
import apiClient from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon, WashingMachine, Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
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

const STORAGE_URL = 'http://127.0.0.1:8000/storage/';



export default function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [loading, setLoading] = useState(false);
  const { searchQuery, setSearchQuery } = useSearch();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [sortBy, setSortBy] = useState('default');
  
  // Selection states for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ service_name: '', description: '', price: '', unit: 'Kg', is_active: 1 });
  const [servicePhoto, setServicePhoto] = useState<File | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/services'); 
      setServices(response.data?.data || response.data || []);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchServices(); 
  }, []);

  const handleEditOpen = (service: any) => {
    setEditId(service.id);
    setFormData({
      service_name: service.service_name,
      description: service.description || '',
      price: service.price.toString(),
      unit: service.unit,
      is_active: service.is_active ? 1 : 0
    });
    setServicePhoto(null);
    setIsModalOpen(true);
  };

  const handleAddOpen = () => {
    setEditId(null);
    setFormData({ service_name: '', description: '', price: '', unit: 'Kg', is_active: 1 });
    setServicePhoto(null);
    setIsModalOpen(true);
  };

  const handleViewDetail = (service: any) => {
    setSelectedService(service);
    setIsDetailOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('service_name', formData.service_name);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('unit', formData.unit);
      submitData.append('is_active', formData.is_active.toString());
      if (servicePhoto) { 
        submitData.append('service_photo', servicePhoto); 
      }

      if (editId) {
        submitData.append('_method', 'PUT');
        await apiClient.post(`/services/${editId}`, submitData);
        toast.success('Layanan berhasil diperbarui.');
      } else {
        await apiClient.post('/services', submitData);
        toast.success('Layanan baru berhasil ditambahkan.');
      }
      setIsModalOpen(false);
      fetchServices(); 
    } catch (error: any) { 
      toast.error('Gagal memproses data layanan.'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus layanan ini dari katalog?')) return;
    
    // OPTIMISTIC UI: Hapus dari local state langsung
    const backupServices = [...services];
    setServices(services.filter(s => s.id !== id));

    try { 
      await apiClient.delete(`/services/${id}`); 
      toast.success('Layanan berhasil dihapus.'); 
    } catch (error: any) { 
      // Rollback jika gagal
      setServices(backupServices);
      toast.error('Gagal menghapus!', { 
        description: error.response?.data?.message || 'Layanan sedang digunakan dalam transaksi aktif.' 
      }); 
    }
  };

  // Toggle selection for bulk actions
  const toggleSelect = (id: number) => {
    const numId = Number(id);
    setSelectedIds(prev => 
      prev.includes(numId) ? prev.filter(item => item !== numId) : [...prev, numId]
    );
  };

  const toggleSelectAll = () => {
    const currentIds = currentServices.map(s => Number(s.id));
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

  // Bulk status update API call
  const handleBulkStatusChange = async (status: number) => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(async (id) => {
        const service = services.find(s => s.id === id);
        if (!service) return;
        const submitData = new FormData();
        submitData.append('service_name', service.service_name);
        submitData.append('description', service.description || '');
        submitData.append('price', service.price.toString());
        submitData.append('unit', service.unit);
        submitData.append('is_active', status.toString());
        submitData.append('_method', 'PUT');
        await apiClient.post(`/services/${id}`, submitData);
      }));
      toast.success('Status layanan terpilih berhasil diperbarui.');
      setSelectedIds([]);
      fetchServices();
    } catch (error) {
      toast.error('Gagal memperbarui status beberapa layanan.');
    } finally {
      setLoading(false);
    }
  };

  // Bulk delete API call
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedIds.length} layanan terpilih dari katalog?`)) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => apiClient.delete(`/services/${id}`)));
      toast.success('Layanan terpilih berhasil dihapus.');
      setSelectedIds([]);
      fetchServices();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error('Gagal menghapus beberapa layanan! Mungkin sedang digunakan dalam transaksi.');
      setSelectedIds([]);
      fetchServices();
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services
    .filter(s => 
      s.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.created_at || b.id).getTime() - new Date(a.created_at || a.id).getTime();
      } else if (sortBy === 'date_asc') {
        return new Date(a.created_at || a.id).getTime() - new Date(b.created_at || b.id).getTime();
      } else if (sortBy === 'price_asc') {
        return Number(a.price) - Number(b.price);
      } else if (sortBy === 'price_desc') {
        return Number(b.price) - Number(a.price);
      }
      return 0;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentServices = filteredServices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Layanan</h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Kelola daftar jenis laundry, harga tarif, dan brosur katalog.
          </p>
        </div>
        <Button onClick={handleAddOpen} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl px-4 py-2 font-medium">
          <Plus size={16} /> Tambah Layanan
        </Button>
      </div>

      {/* FILTER & SEARCH BAR (Kangaroo Inc. Style) */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari katalog layanan..." 
            className="pl-9 bg-background border-border text-foreground focus-visible:ring-primary rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-muted-foreground hidden md:inline font-mono">Urutkan:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-[180px] rounded-xl border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary cursor-pointer">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-card border-border text-foreground">
                <SelectItem value="default" className="cursor-pointer">Default</SelectItem>
                <SelectItem value="date_desc" className="cursor-pointer">Terbaru</SelectItem>
                <SelectItem value="date_asc" className="cursor-pointer">Terlama</SelectItem>
                <SelectItem value="price_asc" className="cursor-pointer">Harga Termurah</SelectItem>
                <SelectItem value="price_desc" className="cursor-pointer">Harga Termahal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            variant="outline" 
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            className={`border-border rounded-xl h-9 gap-2 text-xs transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted bg-card'}`}
          >
            <SlidersHorizontal size={14} /> {viewMode === 'table' ? 'Grid' : 'Tabel'}
          </Button>
        </div>
      </div>

      {/* BULK ACTIONS BAR */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-primary/5 border border-primary/20 rounded-2xl p-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary font-mono bg-primary/10 px-2.5 py-1 rounded-lg">
              {selectedIds.length} Layanan Terpilih
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleBulkStatusChange(1)}
              className="h-9 border-emerald-500/20 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs rounded-xl font-medium cursor-pointer"
            >
              Aktifkan Terpilih
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleBulkStatusChange(0)}
              className="h-9 border-orange-500/20 text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 text-xs rounded-xl font-medium cursor-pointer"
            >
              Nonaktifkan Terpilih
            </Button>
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

      {/* VIEW CONDITIONAL */}
      {viewMode === 'table' ? (
        /* TABLE LIST DATA */
        <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-12 pl-6">
                  <Checkbox 
                    checked={
                      currentServices.length > 0 && 
                      currentServices.every(s => selectedIds.includes(Number(s.id)))
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Pilih semua layanan"
                  />
                </TableHead>
                <TableHead className="text-muted-foreground font-mono text-xs">Foto</TableHead>
                <TableHead className="text-muted-foreground font-mono text-xs">Nama Layanan</TableHead>
                <TableHead className="text-muted-foreground font-mono text-xs">Tarif Biaya</TableHead>
                <TableHead className="text-muted-foreground font-mono text-xs">Status Katalog</TableHead>
                <TableHead className="text-right text-muted-foreground font-mono text-xs pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center h-32">
                    <Loader2 className="animate-spin text-primary mx-auto h-8 w-8" />
                    <p className="text-xs text-muted-foreground font-mono mt-2">MENGAMBIL CATALOG...</p>
                  </TableCell>
                </TableRow>
              ) : filteredServices.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-muted/65 flex items-center justify-center text-muted-foreground mb-4 border border-border/60 shadow-sm">
                        <WashingMachine className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">Tidak Ada Katalog Layanan</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                        {searchQuery ? 'Tidak ada layanan yang cocok dengan pencarian Anda.' : 'Belum ada data layanan yang terdaftar di katalog.'}
                      </p>
                      {!searchQuery && (
                        <Button onClick={handleAddOpen} variant="outline" className="mt-4 border-border text-xs rounded-xl gap-2 hover:bg-muted text-foreground">
                          <Plus size={14} /> Tambah Layanan
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentServices.map((s) => (
                  <TableRow 
                    key={s.id} 
                    onClick={() => handleViewDetail(s)}
                    className="border-b border-border/60 cursor-pointer hover:bg-muted/70 dark:hover:bg-neutral-900/50 transition-colors"
                  >
                    <TableCell className="pl-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedIds.includes(Number(s.id))}
                        onCheckedChange={() => toggleSelect(s.id)}
                        aria-label={`Pilih layanan ${s.service_name}`}
                      />
                    </TableCell>
                    <TableCell>
                      {s.service_photo ? (
                        <img 
                          src={`${STORAGE_URL}${s.service_photo}`} 
                          alt={s.service_name} 
                          className="w-10 h-10 object-cover rounded-xl border border-border shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted border border-border rounded-xl flex items-center justify-center text-[10px] text-muted-foreground font-mono">
                          N/A
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="font-semibold text-foreground text-sm">{s.service_name}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {s.description || 'Tidak ada deskripsi detail penjelasan.'}
                      </p>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground font-medium">
                      Rp {Number(s.price).toLocaleString('id-ID')} / <span className="text-muted-foreground text-xs">{s.unit}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider rounded-md font-mono ${
                        s.is_active 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30' 
                          : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {s.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1.5">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="border-border text-primary hover:text-primary-foreground hover:bg-primary h-8 w-8 rounded-lg" 
                          onClick={(e) => { e.stopPropagation(); handleEditOpen(s); }}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="border-border text-destructive hover:text-destructive-foreground hover:bg-destructive h-8 w-8 rounded-lg" 
                          onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* GRID / CARD VIEW */
        loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-card border border-border rounded-2xl">
            <Loader2 className="animate-spin text-primary h-8 w-8" />
            <p className="text-xs text-muted-foreground font-mono mt-2">MENGAMBIL CATALOG...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 bg-card border border-border rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-muted/65 flex items-center justify-center text-muted-foreground mb-4 border border-border/60 shadow-sm">
              <WashingMachine className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Tidak Ada Katalog Layanan</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
              {searchQuery ? 'Tidak ada layanan yang cocok dengan pencarian Anda.' : 'Belum ada data layanan yang terdaftar di katalog.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentServices.map((s) => (
              <div 
                key={s.id} 
                onClick={() => handleViewDetail(s)}
                className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer group relative flex flex-col hover:scale-[1.01] hover:border-primary/40 dark:hover:border-cyan-500/40 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-cyan-500/5 transition-all duration-300"
              >
                {/* Cover Image */}
                <div className="w-full h-44 bg-muted overflow-hidden relative shrink-0">
                  {s.service_photo ? (
                    <img 
                      src={`${STORAGE_URL}${s.service_photo}`} 
                      alt={s.service_name} 
                      className="w-full h-44 object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-44 flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/60 text-muted-foreground rounded-t-xl">
                      <WashingMachine size={36} strokeWidth={1.5} className="text-muted-foreground/60 animate-pulse" />
                      <span className="text-[10px] font-mono mt-2 opacity-50">NO IMAGE</span>
                    </div>
                  )}

                  {/* Checkbox Overlay */}
                  <div 
                    className="absolute top-3 left-3 z-20 bg-black/40 backdrop-blur-sm p-1.5 rounded-lg border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox 
                      checked={selectedIds.includes(Number(s.id))}
                      onCheckedChange={() => toggleSelect(s.id)}
                      className="border-white/60 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      aria-label={`Pilih layanan ${s.service_name}`}
                    />
                  </div>

                  {/* Floating Status Badge */}
                  <div className="absolute top-3 left-12 z-10">
                    <Badge variant="outline" className={`text-[10px] py-0.5 px-2.5 rounded-full font-bold uppercase tracking-wider border backdrop-blur-md shadow-sm ${
                      s.is_active 
                        ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border-emerald-500/35' 
                        : 'bg-neutral-200/80 text-neutral-500 border-neutral-300/60 dark:bg-neutral-950/45 dark:text-neutral-300 dark:border-neutral-700/30'
                    }`}>
                      {s.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                </div>

                {/* Hover Action Buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg border-white/20 bg-black/35 backdrop-blur-sm text-white hover:bg-black/55 hover:text-white transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditOpen(s);
                    }}
                  >
                    <Edit size={13} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg border-white/20 bg-black/35 backdrop-blur-sm text-white hover:bg-red-500/80 hover:text-white hover:border-red-500/40 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(s.id);
                    }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-base text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors">
                      {s.service_name}
                    </h3>

                    {/* Hide description if empty or default */}
                    {s.description && !s.description.startsWith('Tidak ada deskripsi') && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{s.description}</p>
                    )}
                  </div>

                  {/* Premium Price Tag Container */}
                  <div className="p-3 bg-muted/50 rounded-xl border border-border/50 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">TARIF LAYANAN</span>
                      <span className="text-base font-black text-primary font-mono mt-0.5 block">
                        Rp {Number(s.price).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">SATUAN</span>
                      <span className="text-xs font-bold text-foreground font-mono mt-0.5 block bg-background px-2.5 py-0.5 rounded-md border border-border/60">
                        /{s.unit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm font-sans mt-4">
          <div className="text-xs text-muted-foreground font-mono">
            Menampilkan <span className="font-semibold text-foreground">{indexOfFirstItem + 1}</span> - <span className="font-semibold text-foreground">{Math.min(indexOfLastItem, filteredServices.length)}</span> dari <span className="font-semibold text-foreground">{filteredServices.length}</span> data
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
                  {editId ? 'Ubah Katalog Layanan' : 'Buat Katalog Layanan Baru'}
                </h2>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {editId ? `Mengedit Layanan #${editId}` : 'Isi detail data katalog layanan baru'}
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
                  <Label className="text-muted-foreground text-xs font-semibold">Nama Layanan</Label>
                  <Input 
                    value={formData.service_name} 
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })} 
                    placeholder="Misal: Cuci Basah + Lipat"
                    className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm"
                    required 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Deskripsi Layanan</Label>
                  <Input 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    placeholder="Penjelasan ringkas spesifikasi..."
                    className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">Harga Tarif (Rp)</Label>
                    <Input 
                      type="number" 
                      value={formData.price} 
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })} 
                      placeholder="7000"
                      className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm font-mono"
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">Satuan</Label>
                    <Select 
                      value={formData.unit} 
                      onValueChange={(val) => setFormData({ ...formData, unit: val })}
                    >
                      <SelectTrigger className="w-full h-10 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-1 focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="bg-card border-border text-foreground">
                        <SelectItem value="Kg" className="cursor-pointer">Per Kg</SelectItem>
                        <SelectItem value="Pcs" className="cursor-pointer">Per Pcs</SelectItem>
                        <SelectItem value="Meter" className="cursor-pointer">Per Meter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Status Katalog</Label>
                  <Select 
                    value={formData.is_active.toString()} 
                    onValueChange={(val) => setFormData({ ...formData, is_active: Number(val) })}
                  >
                    <SelectTrigger className="w-full h-10 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-1 focus:ring-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="bg-card border-border text-foreground">
                      <SelectItem value="1" className="cursor-pointer">Katalog Aktif</SelectItem>
                      <SelectItem value="0" className="cursor-pointer">Nonaktif / Ditangguhkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold flex items-center justify-between">
                    <span>Upload Foto Brosur</span>
                    {editId && <span className="text-[10px] text-muted-foreground font-normal">(Kosongkan jika tak diubah)</span>}
                  </Label>
                  <div className="flex items-center gap-3 bg-background border border-dashed border-border p-3 rounded-xl hover:border-primary/50 transition-colors">
                    <ImageIcon className="text-muted-foreground h-5 w-5 shrink-0" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setServicePhoto(e.target.files?.[0] || null)}
                      className="text-xs text-muted-foreground file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary/20 file:text-primary file:cursor-pointer"
                    />
                  </div>
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
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Simpan Katalog'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL (Brosur / Hero Image Layout) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[450px] bg-card border border-border text-foreground rounded-3xl p-0 overflow-hidden shadow-2xl gap-0 animate-in zoom-in-95 duration-200">
          {selectedService && (
            <>
              {/* Hero Image */}
              <div className="w-full h-52 bg-muted overflow-hidden relative border-b border-border/50">
                {selectedService.service_photo ? (
                  <img 
                    src={`${STORAGE_URL}${selectedService.service_photo}`} 
                    alt={selectedService.service_name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950 text-neutral-500">
                    <WashingMachine size={44} strokeWidth={1.5} className="text-primary/45" />
                    <span className="text-[10px] font-mono mt-2 uppercase tracking-widest opacity-60">Katalog CDC Laundry</span>
                  </div>
                )}

                {/* Floating Close Button */}
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-black/45 backdrop-blur-md text-white hover:bg-black/65 transition-colors border border-white/10"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Service Info Content */}
              <div className="p-6 space-y-6">
                <div className="space-y-1">
                  <span className="text-[9px] text-primary font-black font-mono uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-lg">
                    Detail Layanan
                  </span>
                  <DialogTitle className="text-lg font-black text-foreground tracking-tight pt-2">
                    {selectedService.service_name}
                  </DialogTitle>
                </div>
                
                {selectedService.description && (
                  <div className="space-y-2">
                    <p className="text-[9px] text-muted-foreground font-bold font-mono uppercase tracking-widest">Deskripsi Layanan</p>
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-2xl border border-border/60">
                      {selectedService.description}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 border border-border/60 p-4 rounded-2xl">
                    <p className="text-[9px] text-muted-foreground font-bold font-mono uppercase tracking-widest">Tarif Biaya</p>
                    <p className="font-extrabold text-base text-foreground font-mono mt-1">
                      Rp {Number(selectedService.price).toLocaleString('id-ID')}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">per {selectedService.unit}</p>
                  </div>
                  <div className="bg-muted/30 border border-border/60 p-4 rounded-2xl flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] text-muted-foreground font-bold font-mono uppercase tracking-widest">Status Katalog</p>
                      <Badge variant="outline" className={`mt-2.5 text-[9px] uppercase font-bold tracking-wider rounded-md px-2.5 py-0.5 border ${
                        selectedService.is_active 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'
                      }`}>
                        {selectedService.is_active ? 'AKTIF' : 'NONAKTIF'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-5 rounded-2xl shadow-md transition-all active:scale-[0.99] text-xs" 
                    onClick={() => setIsDetailOpen(false)}
                  >
                    Tutup Detail Layanan
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
    </div>
  );
}