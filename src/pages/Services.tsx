import React, { useState, useEffect } from 'react';
import apiClient from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

// URL akses folder gambar dari Laravel lo
const STORAGE_URL = 'http://127.0.0.1:8000/storage/';

export default function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({ service_name: '', description: '', price: '', unit: 'Kg', is_active: 1 });
  const [servicePhoto, setServicePhoto] = useState<File | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/services'); 
      setServices(response.data.data || response.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchServices(); }, []);

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
      if (servicePhoto) { submitData.append('service_photo', servicePhoto); }

      // Harus pakai POST untuk upload file baru
      await apiClient.post('/services', submitData, { headers: { 'Content-Type': 'multipart/form-data' }});
      
      setIsModalOpen(false);
      setFormData({ service_name: '', description: '', price: '', unit: 'Kg', is_active: 1 });
      setServicePhoto(null);
      fetchServices(); 
      toast.success('Sukses', { description: 'Layanan baru dan foto berhasil ditambahkan.' });
    } catch (error: any) { 
      toast.error('Gagal menyimpan layanan!', { description: error.response?.data?.message }); 
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin mau hapus layanan ini?')) return;
    try { await apiClient.delete(`/services/${id}`); fetchServices(); toast.success('Dihapus!'); } catch (error) { toast.error('Gagal menghapus!'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Manajemen Layanan</h1><p className="text-muted-foreground text-sm">Tambahkan katalog layanan beserta fotonya.</p></div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus size={16} /> Tambah Layanan</Button></DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader><DialogTitle>Katalog Layanan Baru</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nama Layanan</Label>
                <Input value={formData.service_name} onChange={(e) => setFormData({ ...formData, service_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi Layanan</Label>
                <Input placeholder="Contoh: Cuci bersih, wangi, anti luntur" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Harga (Rp)</Label>
                  <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Satuan</Label>
                  <select className="flex h-10 w-full rounded-md border bg-background px-3" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}>
                    <option value="Kg">Per Kg</option><option value="Pcs">Per Pcs</option><option value="Meter">Per Meter</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Upload Foto Layanan</Label>
                <div className="flex items-center gap-2">
                  <ImageIcon className="text-muted-foreground h-5 w-5" />
                  <Input type="file" accept="image/*" onChange={(e) => setServicePhoto(e.target.files?.[0] || null)} />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? <Loader2 className="animate-spin" /> : 'Simpan Katalog'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Foto</TableHead><TableHead>Layanan</TableHead><TableHead>Harga</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> : services.map((s) => (
              <TableRow key={s.id}>
                {/* INI BAGIAN NAMPILIN FOTO LAYANAN */}
                <TableCell>
                  {s.service_photo ? (
                    <img src={`${STORAGE_URL}${s.service_photo}`} alt="Foto" className="w-14 h-14 object-cover rounded-md border shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 bg-slate-100 rounded-md border flex items-center justify-center text-xs text-muted-foreground text-center">No Image</div>
                  )}
                </TableCell>
                <TableCell className="font-semibold">{s.service_name} <br/><span className="font-normal text-xs text-muted-foreground">{s.description}</span></TableCell>
                <TableCell>Rp {Number(s.price).toLocaleString('id-ID')} / {s.unit}</TableCell>
                <TableCell><Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? 'Aktif' : 'Nonaktif'}</Badge></TableCell>
                <TableCell className="text-right"><Button variant="outline" size="icon" className="text-red-600" onClick={() => handleDelete(s.id)}><Trash2 size={16} /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}