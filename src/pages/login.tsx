import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import logoCdc from '@/assets/logo-cdc.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!email) {
      setError('Alamat email wajib diisi.');
      return;
    }
    if (!password) {
      setError('Password wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal harus 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post('/login', { email, password });
      
      if (response.data.success) {
        const validToken = response.data.token || response.data.access_token;
        localStorage.setItem('token', validToken);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Email atau password salah!');
      } else {
        setError('Tidak dapat terhubung ke server backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground font-sans">
      
      {/* SISI KIRI - Form Login (Lebar 45% di desktop) */}
      <div className="flex w-full flex-col justify-center px-6 sm:px-16 lg:w-[45%] xl:px-24">
        <div className="mx-auto w-full max-w-md">
          
          {/* Logo Brand Custom (Coinito hexagon style adaptation) */}
          <div className="mb-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 border border-primary/45 rounded-xl flex items-center justify-center shadow-sm">
              <img 
                src={logoCdc} 
                alt="CDC Laundry Logo" 
                className="h-6 w-6 object-contain rounded-md" 
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground font-mono">
              CDC Laundry
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[28px] font-bold tracking-tight mb-2 text-foreground">Log in to your account.</h1>
            <p className="text-muted-foreground text-sm font-light">Enter your email address and password to log in.</p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-destructive/10 p-3.5 text-xs text-destructive font-medium border border-destructive/20 font-mono">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-3.5">
              
              {/* Input Email */}
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-4.5 w-4.5 text-muted-foreground/75" />
                <input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  className="pl-12 bg-[#f8f9fa] dark:bg-[#161618] h-12 w-full rounded-xl border border-input/60 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Input Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4.5 w-4.5 text-muted-foreground/75" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="pl-12 pr-12 bg-[#f8f9fa] dark:bg-[#161618] h-12 w-full rounded-xl border border-input/60 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-1">
              <a href="#" className="text-xs font-semibold text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Tombol Login */}
            <Button 
              type="submit" 
              className="w-full h-12 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/10 transition-all active:scale-[0.99] gap-2 mt-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memverifikasi Akun...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          {/* OR DIVIDER */}
          <div className="relative my-7 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted/70"></div>
            </div>
            <span className="relative bg-background px-3 text-xs text-muted-foreground font-mono">or</span>
          </div>

          {/* SOCIAL LOGINS */}
          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              className="flex items-center justify-center h-11 border border-input/60 rounded-xl bg-card hover:bg-muted/40 text-xs font-medium transition-colors cursor-pointer text-foreground"
              onClick={() => toast.info('Integrasi Google Login sedang dipersiapkan.')}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.56h3.28c1.92,-1.77 3.03,-4.38 3.03,-7.41c0,-0.68 -0.06,-1.33 -0.32,-1.95z" fill="#4285F4" />
                <path d="M12,20.5c2.3,0 4.23,-0.76 5.64,-2.06l-2.04,-2.56c-0.62,0.41 -1.42,0.67 -2.32,0.67c-2.22,0 -4.1,-1.5 -4.77,-3.52H5.14v2.64c1.47,2.92 4.49,4.83 8.01,4.83z" fill="#34A853" />
                <path d="M7.23,13.03a5.1,5.1 0 0 1 0,-3.06V7.33H5.14a8.5,8.5 0 0 0 0,7.34z" fill="#FBBC05" />
                <path d="M12,7.5c1.25,0 2.37,0.43 3.25,1.27l2.43,-2.43C16.21,4.92 14.28,4 12,4c-3.52,0 -6.54,1.91 -8.01,4.83l2.64,2.05c0.67,-2.02 2.55,-3.52 4.77,-3.52z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center h-11 border border-input/60 rounded-xl bg-card hover:bg-muted/40 text-xs font-medium transition-colors cursor-pointer text-foreground"
              onClick={() => toast.info('Integrasi Facebook Login sedang dipersiapkan.')}
            >
              <svg className="h-4 w-4 mr-2" fill="#1877F2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground">
              Don't you have an account?{' '}
              <a href="#" className="font-semibold text-primary hover:underline">
                Sign Up
              </a>
            </p>
          </div>

        </div>
      </div>

      {/* SISI KANAN - Poster & Dashboard Mockup (Lebar 55% di desktop) */}
      <div className="hidden lg:block lg:w-[55%] p-6 lg:pl-0">
        <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] bg-[#1E5EF3] flex flex-col items-center justify-between p-12 text-white shadow-2xl">
          
          {/* Decorative rings */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full border-[30px] border-white/5 -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full border-[40px] border-white/5 -ml-24 -mb-24 pointer-events-none" />

          {/* Floating graphic elements */}
          <div className="w-full flex-1 flex items-center justify-center relative">
            
            {/* Browser Mockup Window */}
            <div className="w-[85%] bg-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden text-slate-800 scale-95 xl:scale-100 transition-all duration-300 relative">
              
              {/* Browser Header Bar */}
              <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 max-w-md bg-white border border-slate-200 h-6 rounded-md mx-6 flex items-center px-2">
                  <span className="text-[10px] text-slate-400 font-mono">localhost:62389/dashboard</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-slate-300 ml-auto" />
              </div>

              {/* Browser Dashboard Content Mock */}
              <div className="p-4 grid grid-cols-4 gap-3 bg-slate-50 min-h-[220px]">
                
                {/* Mock Sidebar inside Browser */}
                <div className="col-span-1 border-r border-slate-200 pr-2 space-y-2">
                  <div className="h-3 w-16 bg-slate-300 rounded" />
                  <div className="space-y-1.5 pt-2">
                    <div className="h-6 w-full bg-blue-100 border-l-2 border-blue-600 rounded-r px-1 flex items-center" />
                    <div className="h-5 w-[80%] bg-slate-200 rounded" />
                    <div className="h-5 w-[70%] bg-slate-200 rounded" />
                  </div>
                </div>

                {/* Mock Main Content Area inside Browser */}
                <div className="col-span-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="h-4 w-28 bg-slate-800/80 rounded" />
                      <div className="h-2.5 w-40 bg-slate-400 rounded" />
                    </div>
                    <div className="h-6 w-16 bg-blue-600 rounded-md" />
                  </div>

                  {/* Mock Charts */}
                  <div className="border border-slate-200 rounded-xl bg-white p-3 h-28 relative overflow-hidden flex flex-col justify-between">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Incoming Weight</span>
                      <span className="text-blue-600 font-bold">123.7 Kg</span>
                    </div>
                    {/* SVG Line Graph */}
                    <svg className="w-full h-12 stroke-blue-600 stroke-[2] fill-none mt-2" viewBox="0 0 200 50">
                      <path d="M0,40 Q25,10 50,30 T100,10 T150,35 T200,15" />
                    </svg>
                  </div>
                </div>

              </div>

            </div>

            {/* Floating Card 1: Orders (Bottom Left) */}
            <div className="absolute -left-2 bottom-12 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 text-slate-800 flex items-center gap-3 animate-bounce" style={{ animationDuration: '6s' }}>
              <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block font-bold uppercase tracking-wider">Antrian Aktif</span>
                <span className="text-sm font-bold text-slate-800 block">45 Transaksi</span>
              </div>
            </div>

            {/* Floating Card 2: Customer (Right side) */}
            <div className="absolute right-0 top-16 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 text-slate-800 w-52 flex flex-col gap-2.5 animate-bounce" style={{ animationDuration: '8s' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                  SL
                </div>
                <div>
                  <span className="text-xs font-bold block">Sophie Laurent</span>
                  <span className="text-[9px] font-mono text-slate-400 block">sophie@gmail.com</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-mono">Baju Masuk</span>
                <span className="font-bold text-blue-600 font-mono">4.8 Kg</span>
              </div>
              <button className="w-full py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold shadow-md shadow-blue-500/20">
                Sedang Diproses
              </button>
            </div>

            {/* Floating Hexagon 'C' (Top Right) */}
            <div className="absolute right-12 -top-4 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-blue-600 font-extrabold text-lg border border-slate-100">
              C
            </div>

          </div>

          {/* Text footer */}
          <div className="text-center z-10">
            <h2 className="text-2xl font-bold tracking-tight mb-2">The easiest way to manage your laundry business.</h2>
            <p className="text-white/70 text-xs font-light">Join the CDC Laundry community now!</p>
          </div>

        </div>
      </div>
      
    </div>
  );
}