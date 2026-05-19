import React, { useState, useEffect, useRef } from 'react';
import apiClient from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/customers'); 
      setCustomers(response.data.data || response.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/customers', formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', address: '', password: '' }); 
      fetchCustomers();
      toast.success('Mantap!', { description: 'Akun pelanggan berhasil dibuat.' });
    } catch (error: any) {
      toast.error('Gagal', { description: error.response?.data?.message || 'Cek lagi isian form lo.' });
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin mau hapus data pelanggan ini?')) return;
    try {
      await apiClient.delete(`/customers/${id}`);
      fetchCustomers();
      toast.success('Dihapus', { description: 'Data pelanggan telah dilenyapkan.' });
    } catch (error) { toast.error('Gagal menghapus data!'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Pelanggan</h1>
          <p className="text-sm text-muted-foreground">Kelola data kontak dan akun pelanggan lo.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild><Button className="gap-2 shadow-sm"><Plus size={16} /> Tambah Pelanggan</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><DialogTitle>Tambah Akun Pelanggan</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); emailRef.current?.focus(); } }} required autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Email (Untuk Login)</Label>
                <Input type="email" value={formData.email} ref={emailRef} onChange={(e) => setFormData({ ...formData, email: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); passRef.current?.focus(); } }} required />
              </div>
              <div className="space-y-2">
                <Label>Password (Untuk Login)</Label>
                <Input type="password" placeholder="Minimal 6 karakter" value={formData.password} ref={passRef} onChange={(e) => setFormData({ ...formData, password: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); phoneRef.current?.focus(); } }} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>Nomor Telepon/WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="tel" className="pl-9" placeholder="Hanya Angka (Misal: 0812345)" value={formData.phone} ref={phoneRef} 
                    // Mencegah spasi dan huruf biar sesuai validasi 'numeric' Laravel
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} 
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addressRef.current?.focus(); } }} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Alamat Lengkap</Label>
                <Input value={formData.address} ref={addressRef} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Buat Akun'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow><TableHead>No</TableHead><TableHead>Nama</TableHead><TableHead>Email</TableHead><TableHead>Telepon</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> : 
              customers.map((c, i) => (
              <TableRow key={c.id}>
                <TableCell>{i + 1}</TableCell><TableCell className="font-semibold">{c.user?.name}</TableCell><TableCell>{c.user?.email}</TableCell><TableCell>{c.phone}</TableCell>
                <TableCell className="text-right"><Button variant="outline" size="icon" className="text-red-600" onClick={() => handleDelete(c.id)}><Trash2 size={16}/></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}