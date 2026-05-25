import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, DollarSign, Wallet, ArrowUpRight } from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-6 bg-background font-sans antialiased text-foreground">
      {/* Header */}
      <div>
        <h1 className="text-sm font-bold tracking-tight text-foreground uppercase">Rekap Keuangan</h1>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
          Laporan pemasukan, omzet kotor, dan proyeksi laba toko laundry Anda.
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-900 bg-card p-5">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Omzet Harian</span>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold mt-2">Rp 450.000</div>
          <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <ArrowUpRight size={10} /> +8.3% dari kemarin
          </p>
        </Card>

        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-900 bg-card p-5">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Total Bulanan</span>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold mt-2">Rp 12.890.000</div>
          <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <ArrowUpRight size={10} /> +12.4% dari bulan lalu
          </p>
        </Card>

        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-900 bg-card p-5">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Proyeksi Laba</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold mt-2">Rp 8.420.000</div>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
            Margin bersih berjalan: ~65%
          </p>
        </Card>
      </div>

      {/* Placeholder Chart/Image */}
      <Card className="rounded-3xl border-neutral-200 dark:border-neutral-900 bg-card p-6 h-80 flex flex-col justify-center items-center text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
          <BarChart3 size={20} />
        </div>
        <h3 className="text-sm font-semibold">Grafik Analitik Keuangan</h3>
        <p className="text-xs text-neutral-500 max-w-sm mt-1">
          Modul grafik detail sedang disinkronisasikan dengan pembukuan kasir.
        </p>
      </Card>
    </div>
  );
}
