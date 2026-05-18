import React, { useState, useEffect } from 'react';
import apiClient from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';

// Interface disamakan persis dengan fillable Laravel lo
interface Service {
  id: number;
  service_name: string;
  price: number;
  unit: string;
  is_active: number | boolean;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State form disesuaikan dengan database
  const [formData, setFormData] = useState({ 
    service_name: '', 
    price: '', 
    unit: 'Kg', // Default value
    is_active: 1  // Default 1 (Aktif)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/services'); 
      setServices(response.data.data || response.data);
    } catch (error) {
      console.error('Gagal mengambil data layanan:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/services', formData);
      setIsModalOpen(false); 
      // Reset form ke default
      setFormData({ service_name: '', price: '', unit: 'Kg', is_active: 1 }); 
      fetchServices(); 
    } catch (error) {
      console.error('Gagal menyimpan layanan:', error);
      alert('Gagal menyimpan data! Cek console untuk detailnya.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Yakin mau hapus layanan ini?')) return;
    
    try {
      await apiClient.delete(`/services/${id}`);
      fetchServices(); 
    } catch (error) {
      console.error('Gagal menghapus layanan:', error);
      alert('Gagal menghapus data!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Layanan</h1>
          <p className="text-sm text-muted-foreground">Kelola daftar layanan, harga, dan satuan cucian.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm">
              <Plus size={16} /> Tambah Layanan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Layanan Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              
              <div className="space-y-2">
                <Label htmlFor="service_name">Nama Layanan</Label>
                <Input 
                  id="service_name" 
                  placeholder="Misal: Cuci Komplit, Setrika Saja" 
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Harga (Rp)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="7000" 
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Satuan</Label>
                  {/* Pakai select native yang di-style ala shadcn biar cepet */}
                  <select 
                    id="unit"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="Kg">Per Kg</option>
                    <option value="Pcs">Per Pcs</option>
                    <option value="Meter">Per Meter</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active">Status Layanan</Label>
                <select 
                  id="is_active"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: Number(e.target.value) })}
                >
                  <option value={1}>Aktif</option>
                  <option value={0}>Tidak Aktif</option>
                </select>
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Simpan Layanan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabel Data */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[80px]">No</TableHead>
              <TableHead>Nama Layanan</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Satuan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Belum ada data layanan.
                </TableCell>
              </TableRow>
            ) : (
              services.map((service, index) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-semibold">{service.service_name}</TableCell>
                  <TableCell>Rp {Number(service.price).toLocaleString('id-ID')}</TableCell>
                  <TableCell>{service.unit}</TableCell>
                  <TableCell>
                    {/* Badge Status Aktif/Tidak Aktif */}
                    <Badge variant={service.is_active ? 'default' : 'secondary'} className={service.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200' : ''}>
                      {service.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Edit size={16} />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(service.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}