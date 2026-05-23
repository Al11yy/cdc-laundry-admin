import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as Store, User, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const [user, setUser] = useState<any>({});
  const [shopName, setShopName] = useState('CDC Laundry');
  const [shopPhone, setShopPhone] = useState('081234567890');
  const [shopAddress, setShopAddress] = useState('Jl. Raya Kampus Udayana No. 20, Jimbaran, Bali');
  const [receiptHeader, setReceiptHeader] = useState('Terima Kasih Atas Kepercayaan Anda');
  const [receiptFooter, setReceiptFooter] = useState('Mohon periksa cucian sebelum meninggalkan outlet. Komplain maksimal 24 jam setelah cucian diambil.');
  
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingShop, setIsSavingShop] = useState(false);

  useEffect(() => {
    // Load admin user info
    const userString = localStorage.getItem('user');
    if (userString) {
      const u = JSON.parse(userString);
      setUser(u);
      setUserName(u.name || '');
      setUserEmail(u.email || '');
    }

    // Load shop configuration
    const cachedShopName = localStorage.getItem('shop_name');
    const cachedShopPhone = localStorage.getItem('shop_phone');
    const cachedShopAddress = localStorage.getItem('shop_address');
    const cachedReceiptHeader = localStorage.getItem('receipt_header');
    const cachedReceiptFooter = localStorage.getItem('receipt_footer');

    if (cachedShopName) setShopName(cachedShopName);
    if (cachedShopPhone) setShopPhone(cachedShopPhone);
    if (cachedShopAddress) setShopAddress(cachedShopAddress);
    if (cachedReceiptHeader) setReceiptHeader(cachedReceiptHeader);
    if (cachedReceiptFooter) setReceiptFooter(cachedReceiptFooter);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setTimeout(() => {
      const updatedUser = { ...user, name: userName, email: userEmail };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // Reload event to sync sidebar name
      window.dispatchEvent(new Event('storage'));
      toast.success('Profil admin berhasil diperbarui.');
      setIsSavingProfile(false);
    }, 800);
  };

  const handleSaveShop = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingShop(true);
    setTimeout(() => {
      localStorage.setItem('shop_name', shopName);
      localStorage.setItem('shop_phone', shopPhone);
      localStorage.setItem('shop_address', shopAddress);
      localStorage.setItem('receipt_header', receiptHeader);
      localStorage.setItem('receipt_footer', receiptFooter);
      toast.success('Pengaturan toko laundry berhasil disimpan.');
      setIsSavingShop(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER PAGE */}
      <div className="border-b border-border/60 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pengaturan Sistem</h1>
        <p className="text-xs text-muted-foreground mt-1 font-mono">
          Konfigurasi profile administrator dan parameter cetak struk operasional outlet laundry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Column Left: Profile settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <User size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Profil Admin</h2>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Kelola data administrator Anda</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs font-semibold">Nama Administrator</Label>
                <Input 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)} 
                  placeholder="Nama Lengkap Admin"
                  className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm"
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs font-semibold">Alamat Email</Label>
                <Input 
                  type="email" 
                  value={userEmail} 
                  onChange={(e) => setUserEmail(e.target.value)} 
                  placeholder="admin@cdclaundry.com"
                  className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm"
                  required 
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSavingProfile}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl h-10 font-semibold"
              >
                {isSavingProfile ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={15} />}
                Simpan Profil
              </Button>
            </form>
          </div>
        </div>

        {/* Column Right: Shop settings */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Store size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Pengaturan Toko & Receipt</h2>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Parameter struk dan identitas laundry</p>
              </div>
            </div>

            <form onSubmit={handleSaveShop} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Nama Outlet / Toko</Label>
                  <Input 
                    value={shopName} 
                    onChange={(e) => setShopName(e.target.value)} 
                    placeholder="CDC Laundry"
                    className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm"
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-semibold">Nomor WhatsApp Toko</Label>
                  <Input 
                    value={shopPhone} 
                    onChange={(e) => setShopPhone(e.target.value)} 
                    placeholder="081234567890"
                    className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm font-mono"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs font-semibold">Alamat Outlet</Label>
                <Input 
                  value={shopAddress} 
                  onChange={(e) => setShopAddress(e.target.value)} 
                  placeholder="Jl. Kampus Udayana No. 20, Bali"
                  className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm"
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs font-semibold">Pesan Header Struk (Print)</Label>
                <Input 
                  value={receiptHeader} 
                  onChange={(e) => setReceiptHeader(e.target.value)} 
                  placeholder="Terima Kasih Atas Kepercayaan Anda"
                  className="bg-background border-border text-foreground focus-visible:ring-primary rounded-xl text-sm"
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs font-semibold">Pesan Footer Struk (Print)</Label>
                <textarea 
                  value={receiptFooter} 
                  onChange={(e) => setReceiptFooter(e.target.value)} 
                  placeholder="Syarat & ketentuan komplain..."
                  className="flex min-h-[80px] w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
                  required 
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSavingShop}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl h-10 font-semibold"
              >
                {isSavingShop ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={15} />}
                Simpan Konfigurasi Toko
              </Button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
