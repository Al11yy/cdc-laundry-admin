import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Shield, ShieldCheck } from 'lucide-react';

export default function Staff() {
  const staffMembers = [
    { name: 'Admin Utama', initials: 'AD', role: 'Administrator', email: 'admin@cdclaundry.com', onDuty: true },
    { name: 'Kasir Roni', initials: 'KR', role: 'Kasir Toko', email: 'roni@cdclaundry.com', onDuty: true },
    { name: 'Admin Siti', initials: 'AS', role: 'Supervisor', email: 'siti@cdclaundry.com', onDuty: true },
    { name: 'Kasir Linda', initials: 'KL', role: 'Kasir Toko', email: 'linda@cdclaundry.com', onDuty: false }
  ];

  return (
    <div className="space-y-6 bg-background font-sans antialiased text-foreground">
      {/* Header */}
      <div className="border-b border-border/60 pb-6">
        <h1 className="text-sm font-bold tracking-tight text-foreground uppercase">Database Manajemen Staff</h1>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
          Kelola hak akses kasir dan karyawan aktif yang bertugas di toko laundry.
        </p>
      </div>

      {/* Staff Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {staffMembers.map((staff, idx) => (
          <Card key={idx} className="rounded-2xl border-neutral-200 dark:border-neutral-900 bg-card p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-900 text-xs text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-bold relative border border-neutral-250 dark:border-neutral-800">
                  {staff.initials}
                  {staff.onDuty && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                  )}
                </div>
                <Badge variant="outline" className={`text-[9px] uppercase font-bold tracking-wider rounded-md font-mono ${
                  staff.onDuty 
                    ? 'bg-emerald-50/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-900 dark:text-neutral-500 border-transparent'
                }`}>
                  {staff.onDuty ? 'On Duty' : 'Offline'}
                </Badge>
              </div>

              <div>
                <h3 className="font-bold text-sm text-foreground leading-tight">{staff.name}</h3>
                <p className="text-[11px] text-neutral-500 font-medium mt-1 flex items-center gap-1">
                  {staff.role === 'Administrator' ? <ShieldCheck size={12} className="text-primary" /> : <Shield size={12} className="text-neutral-400" />}
                  {staff.role}
                </p>
                <p className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1 font-mono">
                  <Mail size={10} /> {staff.email}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
