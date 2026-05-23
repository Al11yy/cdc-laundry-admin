import { useState, useEffect } from 'react';
import apiClient from '@/api/axios';
import { Badge } from '@/components/ui/badge';
import { Loader2, WashingMachine, RefreshCw } from 'lucide-react';

export default function Queue() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/transactions');
      const list = res.data?.data || res.data || [];
      // Filter transactions that are active in queue (not 'diambil' status)
      setTransactions(list.filter((t: any) => t.status !== 'diambil'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const getStatusBadgeStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'antrian':
        return 'bg-amber-500/10 text-amber-505 border-amber-500/20';
      case 'dicuci':
        return 'bg-blue-500/10 text-blue-505 border-blue-500/20';
      case 'disetrika':
        return 'bg-purple-500/10 text-purple-505 border-purple-500/20';
      case 'siap diambil':
        return 'bg-emerald-500/10 text-emerald-505 border-emerald-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
    }
  };

  return (
    <div className="space-y-6 bg-background font-sans antialiased text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-6">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground uppercase">Antrian Cucian Aktif</h1>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            Monitoring reaktif alur cucian dari masuk hingga siap diambil pelanggan.
          </p>
        </div>
        <button 
          onClick={fetchQueue} 
          className="p-2 border border-border bg-card rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          title="Refresh Antrian"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Simple List of queue items */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-20 text-center space-y-4 border border-dashed border-border rounded-3xl bg-card">
          <WashingMachine className="mx-auto h-10 w-10 text-neutral-400" />
          <p className="text-xs text-neutral-500">Semua cucian telah diambil oleh pelanggan. Antrian kosong!</p>
        </div>
      ) : (
        <div className="border border-border/80 rounded-2xl bg-card overflow-hidden shadow-sm divide-y divide-border/60">
          {transactions.map((t) => (
            <div key={t.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
              {/* Left Side: Invoice Icon and Details */}
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                  <WashingMachine size={18} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary tracking-wider">{t.invoice_code}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">• Masuk: {new Date(t.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground leading-tight mt-1">{t.customer?.user?.name || 'Pelanggan'}</h3>
                </div>
              </div>
              
              {/* Right Side: Operational Metrics & Progress */}
              <div className="flex flex-wrap items-center gap-6 text-xs md:text-right">
                <div className="min-w-[120px]">
                  <span className="text-muted-foreground block text-[9px] uppercase font-mono tracking-wider">Layanan</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{t.service?.service_name || '-'}</span>
                </div>
                <div className="min-w-[80px]">
                  <span className="text-muted-foreground block text-[9px] uppercase font-mono tracking-wider">Kuantitas</span>
                  <span className="font-semibold text-foreground font-mono mt-0.5 block">{t.weight} {t.service?.unit || 'Kg'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase font-mono tracking-wider mb-0.5">Status</span>
                  <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyles(t.status)}`}>
                    {t.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
