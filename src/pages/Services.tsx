import React, { useState, useEffect } from 'react';
import apiClient from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, Image as ImageIcon, Eye, WashingMachine, Search, SlidersHorizontal, CheckSquare, Square, X } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_URL = 'http://127.0.0.1:8000/storage/';



export default function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection states for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

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
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredServices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredServices.map(s => s.id));
    }
  };

  // Bulk status update simulation
  const handleBulkStatusChange = async (status: number) => {
    toast.info(`Memperbarui status ${selectedIds.length} layanan...`);
    // Optimistic UI update
    setServices(services.map(s => selectedIds.includes(s.id) ? { ...s, is_active: status } : s));
    setSelectedIds([]);
    toast.success('Status layanan terpilih berhasil diperbarui.');
  };

  const filteredServices = services.filter(s => 
    s.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-2 bg-muted border border-primary/20 rounded-xl p-1 animate-fade-in">
              <span className="text-[11px] text-muted-foreground font-mono px-2">
                {selectedIds.length} Terpilih
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleBulkStatusChange(1)}
                className="h-8 border-emerald-500/20 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs rounded-lg font-medium"
              >
                Aktifkan
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleBulkStatusChange(0)}
                className="h-8 border-orange-500/20 text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 text-xs rounded-lg font-medium"
              >
                Nonaktifkan
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              className={`border-border rounded-xl gap-2 text-xs transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted bg-card'}`}
            >
              <SlidersHorizontal size={14} /> Tampilan: {viewMode === 'table' ? 'Tabel' : 'Card'}
            </Button>
          )}
        </div>
      </div>

      {/* VIEW CONDITIONAL */}
      {viewMode === 'table' ? (
        /* TABLE LIST DATA */
        <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-12 text-center">
                  <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground mt-1">
                    {selectedIds.length === filteredServices.length && filteredServices.length > 0 ? (
                      <CheckSquare size={16} className="text-primary" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
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
                filteredServices.map((s) => (
                  <TableRow key={s.id} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                    <TableCell className="text-center">
                      <button onClick={() => toggleSelect(s.id)} className="text-muted-foreground hover:text-foreground mt-1">
                        {selectedIds.includes(s.id) ? (
                          <CheckSquare size={16} className="text-primary" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
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
                          ? 'bg-emerald-55/10 text-emerald-500 border-emerald-55/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30' 
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
                          className="border-border text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 rounded-lg" 
                          onClick={() => handleViewDetail(s)}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="border-border text-primary hover:text-primary-foreground hover:bg-primary h-8 w-8 rounded-lg" 
                          onClick={() => handleEditOpen(s)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="border-border text-destructive hover:text-destructive-foreground hover:bg-destructive h-8 w-8 rounded-lg" 
                          onClick={() => handleDelete(s.id)}
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
            {filteredServices.map((s) => (
              <div 
                key={s.id} 
                onClick={() => handleViewDetail(s)}
                className="bg-card dark:bg-neutral-900/40 border border-border dark:border-neutral-800/80 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group relative flex flex-col"
              >
                {/* Cover Image */}
                <div className="w-full h-40 bg-muted overflow-hidden relative">
                  {s.service_photo ? (
                    <img 
                      src={`${STORAGE_URL}${s.service_photo}`} 
                      alt={s.service_name} 
                      className="w-full h-40 object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-40 flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/60 text-muted-foreground">
                      <ImageIcon size={32} strokeWidth={1.5} />
                      <span className="text-[10px] font-mono mt-1.5 opacity-60">NO IMAGE</span>
                    </div>
                  )}
                </div>

                {/* Hover Action Buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg border-white/20 bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 hover:text-white"
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
                    className="h-8 w-8 rounded-lg border-white/20 bg-black/30 backdrop-blur-sm text-white hover:bg-red-500/80 hover:text-white hover:border-red-500/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(s.id);
                    }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-foreground tracking-tight leading-tight">{s.service_name}</h3>
                    <Badge variant="outline" className={`text-[9px] py-0 px-1.5 rounded-full font-semibold border ${
                      s.is_active 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30' 
                        : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20 dark:bg-neutral-900/40 dark:text-neutral-400 dark:border-neutral-800/30'
                    }`}>
                      {s.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>

                  {/* Hide description if empty or default */}
                  {s.description && !s.description.startsWith('Tidak ada deskripsi') && (
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2 line-clamp-2">{s.description}</p>
                  )}

                  {/* Price */}
                  <div className="mt-auto pt-4">
                    <div className="border-t border-border/40 pt-3">
                      <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block font-mono">TARIF</span>
                      <span className="text-lg font-extrabold text-foreground font-mono mt-0.5 block">
                        Rp {Number(s.price).toLocaleString('id-ID')} <span className="text-xs text-muted-foreground font-normal">/{s.unit.toLowerCase()}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
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
                    <select 
                      className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                      value={formData.unit} 
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="Kg" className="bg-card text-foreground">Per Kg</option>
                      <option value="Pcs" className="bg-card text-foreground">Per Pcs</option>
                      <option value="Meter" className="bg-card text-foreground">Per Meter</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Status Katalog</Label>
                  <select 
                    className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                    value={formData.is_active} 
                    onChange={(e) => setFormData({ ...formData, is_active: Number(e.target.value) })}
                  >
                    <option value={1} className="bg-card text-foreground">Katalog Aktif</option>
                    <option value={0} className="bg-card text-foreground">Nonaktif / Ditangguhkan</option>
                  </select>
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
        <DialogContent showCloseButton={false} className="sm:max-w-[480px] bg-card border-border text-foreground rounded-2xl p-0 overflow-hidden gap-0">
          
          {selectedService && (
            <>
              {/* Hero Image - Bleed to edge */}
              <div className="w-full h-56 bg-muted overflow-hidden relative">
                {selectedService.service_photo ? (
                  <img 
                    src={`${STORAGE_URL}${selectedService.service_photo}`} 
                    alt={selectedService.service_name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/60 text-muted-foreground">
                    <ImageIcon size={40} strokeWidth={1.5} />
                    <span className="text-xs font-mono mt-2 opacity-60">Tidak Ada Gambar Brosur</span>
                  </div>
                )}

                {/* Floating Close Button */}
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Service Info */}
              <div className="p-6 space-y-5">
                <DialogTitle className="text-lg font-bold text-foreground tracking-tight p-0 m-0">
                  {selectedService.service_name}
                </DialogTitle>
                
                {selectedService.description && (
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold font-mono uppercase tracking-wider">Keterangan</p>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-xl border border-border/50 mt-1.5">
                      {selectedService.description}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-5 border-t border-border/60 pt-5">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold font-mono uppercase tracking-wider">Tarif Biaya</p>
                    <p className="font-bold text-lg text-primary font-mono mt-1">
                      Rp {Number(selectedService.price).toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">per {selectedService.unit}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold font-mono uppercase tracking-wider">Status Katalog</p>
                    <Badge variant="outline" className={`mt-1.5 text-[9px] uppercase font-bold tracking-wider rounded-md font-mono ${
                      selectedService.is_active 
                        ? 'bg-emerald-50/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30' 
                        : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {selectedService.is_active ? 'Katalog Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                </div>

                <Button 
                  className="w-full bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl mt-1" 
                  onClick={() => setIsDetailOpen(false)}
                >
                  Tutup Brosur
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
    </div>
  );
}