import React, { useState, useEffect, useRef } from 'react';
import apiClient from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, Phone, Eye, User, Users, Mail, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
      const response = await apiClient.get('/customers'); 
      setCustomers(response.data?.data || response.data || []);
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
      if (editId) {
        await apiClient.put(`/customers/${editId}`, formData);
        toast.success('Data pelanggan berhasil diperbarui!');
      } else {
        await apiClient.post('/customers', formData);
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
    
    // OPTIMISTIC UI: Hapus dari local state langsung
    const backupCustomers = [...customers];
    setCustomers(customers.filter(c => c.id !== id));

    try {
      await apiClient.delete(`/customers/${id}`);
      toast.success('Pelanggan telah berhasil dihapus.');
    } catch (error) { 
      // Rollback jika gagal
      setCustomers(backupCustomers);
      toast.error('Gagal menghapus data!', {
        description: 'Kemungkinan pelanggan sudah terikat dengan transaksi aktif.'
      }); 
    }
  };

  // Mendapatkan inisial nama untuk avatar
  const getInitials = (name: string) => {
    if (!name) return 'C';
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

  const filteredCustomers = customers.filter(c => {
    const name = c.user?.name || '';
    const email = c.user?.email || '';
    const phone = c.phone || '';
    const address = c.address || '';
    
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      address.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const avatarColors = [
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800/40',
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/40',
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/40',
    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800/40',
    'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/40',
  ];

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

      {/* FILTER & SEARCH */}
      <div className="flex items-center gap-3 justify-between bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari nama, email, atau hp..." 
            className="pl-9 bg-background border-border text-foreground focus-visible:ring-primary rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted rounded-xl gap-2 text-xs">
          <SlidersHorizontal size={14} /> Filter
        </Button>
      </div>

      {/* CUSTOMER LIST TABLE */}
      <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-16 text-muted-foreground font-mono text-xs pl-6">No</TableHead>
              <TableHead className="text-muted-foreground font-mono text-xs">Profil Pelanggan</TableHead>
              <TableHead className="text-muted-foreground font-mono text-xs">Telepon</TableHead>
              <TableHead className="text-muted-foreground font-mono text-xs">Alamat</TableHead>
              <TableHead className="text-right text-muted-foreground font-mono text-xs pr-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="text-center h-32">
                  <Loader2 className="animate-spin text-primary mx-auto h-8 w-8" />
                  <p className="text-xs text-muted-foreground font-mono mt-2">MENGAMBIL PELANGGAN...</p>
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted/65 flex items-center justify-center text-muted-foreground mb-4 border border-border/60 shadow-sm">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Tidak Ada Pelanggan</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                      {searchQuery ? 'Tidak ada pelanggan yang cocok dengan pencarian Anda.' : 'Belum ada data pelanggan yang terdaftar di sistem.'}
                    </p>
                    {!searchQuery && (
                      <Button onClick={handleAddOpen} variant="outline" className="mt-4 border-border text-xs rounded-xl gap-2 hover:bg-muted text-foreground">
                        <Plus size={14} /> Tambah Pelanggan
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((c, i) => {
                const name = c.user?.name || 'Pelanggan';
                const email = c.user?.email || 'N/A';
                const avatarColor = avatarColors[i % avatarColors.length];

                return (
                  <TableRow key={c.id} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground pl-6">{i + 1}</TableCell>
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
                          className="border-border text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 rounded-lg" 
                          onClick={() => handleViewDetail(c)}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="border-border text-primary hover:text-primary-foreground hover:bg-primary h-8 w-8 rounded-lg" 
                          onClick={() => handleEditOpen(c)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="border-border text-destructive hover:text-destructive-foreground hover:bg-destructive h-8 w-8 rounded-lg" 
                          onClick={() => handleDelete(c.id)}
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
                        editId ? addressRef.current?.focus() : passRef.current?.focus(); 
                      } 
                    }} 
                    placeholder="sophie@example.com"
                    className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm"
                    required 
                  />
                </div>
                
                {!editId && (
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs font-semibold">Password Login Mobile</Label>
                    <Input 
                      type="password" 
                      placeholder="Min 6 karakter" 
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
                      required 
                      minLength={6} 
                    />
                  </div>
                )}
                
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
        <DialogContent className="sm:max-w-[400px] bg-card border-border text-foreground rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground border-b border-border/60 pb-3">
              <User className="text-primary"/> Profil Lengkap Pelanggan
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4 py-3 text-sm my-2 border-b border-border/60">
              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-muted border border-border rounded-xl text-primary shrink-0">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold font-mono uppercase tracking-wider">Nama Lengkap</p>
                  <p className="font-semibold text-foreground text-sm mt-0.5">{selectedCustomer.user?.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-muted border border-border rounded-xl text-muted-foreground shrink-0">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold font-mono uppercase tracking-wider">Email Sistem</p>
                  <p className="font-medium text-foreground mt-0.5">{selectedCustomer.user?.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-muted border border-border rounded-xl text-muted-foreground shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold font-mono uppercase tracking-wider">Nomor Telepon</p>
                  <p className="font-medium text-foreground mt-0.5 font-mono">
                    {selectedCustomer.phone ? (
                      <a 
                        href={formatWhatsAppLink(selectedCustomer.phone)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1.5 text-primary hover:underline hover:text-primary/80 transition-colors"
                      >
                        <Phone size={13} className="text-muted-foreground" />
                        {selectedCustomer.phone}
                      </a>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-muted border border-border rounded-xl text-muted-foreground shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold font-mono uppercase tracking-wider">Alamat Laundry</p>
                  <p className="font-medium text-foreground mt-0.5 leading-relaxed">{selectedCustomer.address}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="pt-2">
            <Button className="w-full bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl" onClick={() => setIsDetailOpen(false)}>
              Tutup Profil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}