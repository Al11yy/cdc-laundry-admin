import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/axios';
import { Eye, EyeOff, Loader2, ArrowRight, WashingMachine, Droplets } from 'lucide-react';
import logoCdc from '@/assets/logo-cdc.jpg';
import loginIllustration from '@/assets/laundry-login-illustration.png';

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
    <div className="min-h-screen w-full bg-[#0a1628] flex items-center justify-center p-4 md:p-8 font-sans selection:bg-[#2196D3]/30 relative overflow-hidden">
      
      {/* Animated Background Gradient Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#2196D3]/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-[#7EC839]/10 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#2196D3]/8 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
        
        {/* Floating bubble particles */}
        <div className="absolute top-[15%] left-[10%] w-3 h-3 bg-[#2196D3]/25 rounded-full animate-bounce" style={{ animationDuration: '4s' }} />
        <div className="absolute top-[70%] left-[20%] w-2 h-2 bg-[#7EC839]/30 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-[25%] right-[15%] w-2.5 h-2.5 bg-[#2196D3]/20 rounded-full animate-bounce" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute bottom-[20%] right-[25%] w-2 h-2 bg-[#7EC839]/25 rounded-full animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '0.5s' }} />
        <div className="absolute top-[50%] left-[45%] w-1.5 h-1.5 bg-white/10 rounded-full animate-bounce" style={{ animationDuration: '5.5s', animationDelay: '3s' }} />
      </div>

      {/* Main Board Container */}
      <div className="relative w-full max-w-[1280px] bg-[#0e1f38]/80 backdrop-blur-xl rounded-[2.5rem] border border-white/[0.08] shadow-2xl shadow-black/30 p-6 md:p-12 overflow-hidden flex flex-col justify-between min-h-[90vh]">
        
        {/* Decorative geometric shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full border-[30px] border-[#2196D3]/[0.06] -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full border-[40px] border-[#7EC839]/[0.04] -ml-24 -mb-24 pointer-events-none" />
        
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.02]" 
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        {/* TOP BAR / NAVBAR */}
        <header className="flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner border border-white/10 overflow-hidden group-hover:border-[#2196D3]/40 transition-colors duration-300">
              <img 
                src={logoCdc} 
                alt="CDC Laundry Logo" 
                className="h-full w-full object-cover" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-wider text-white uppercase font-poppins leading-tight">
                CDC Laundry
              </span>
              <span className="text-[9px] font-medium text-[#2196D3]/60 tracking-[0.25em] uppercase font-mono">
                Admin Panel
              </span>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-2">
            <Droplets size={14} className="text-[#2196D3]/60" />
            <span className="text-[10px] text-white/40 font-mono font-medium tracking-wide">v2.0 ADMIN</span>
          </div>
        </header>

        {/* MIDDLE SECTION - TWO COLUMNS */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-8 z-10">
          
          {/* Left Column: Laundry Vector Illustration */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center text-center gap-6">
            <div className="w-full max-w-[500px] lg:max-w-[540px] aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-[#0e1f38]/60 to-[#112240]/40 border border-white/[0.06] p-5 flex items-center justify-center shadow-inner group relative">
              {/* Inner glow effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#2196D3]/5 to-transparent rounded-3xl pointer-events-none" />
              <img 
                src={loginIllustration} 
                alt="CDC Laundry Workspace" 
                className="max-h-full max-w-full object-contain rounded-2xl group-hover:scale-[1.03] transition-transform duration-700 ease-out relative z-10" 
              />
            </div>

            {/* Tagline below illustration */}
            <div className="hidden lg:block space-y-2 max-w-md">
              <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
                Kelola Bisnis Laundry <br/>
                <span className="bg-gradient-to-r from-[#2196D3] to-[#7EC839] bg-clip-text text-transparent">
                  Dengan Lebih Mudah.
                </span>
              </h1>
              <p className="text-xs text-white/35 leading-relaxed font-medium">
                Dashboard admin CDC Laundry — pantau transaksi, kelola pelanggan, dan atur layanan dari satu tempat.
              </p>
            </div>
          </div>

          {/* Right Column: Premium Login Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] bg-white rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-black/20 flex flex-col justify-center text-slate-800 relative overflow-hidden">
              
              {/* Card top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2196D3] via-[#2bb8e0] to-[#7EC839]" />
              
              {/* Brand icon */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-[#2196D3]/20 shadow-md shadow-[#2196D3]/10">
                  <img src={logoCdc} alt="CDC" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0a1628] tracking-tight">
                    Selamat Datang!
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Masuk ke akun admin Anda
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-100 p-3.5 text-xs text-rose-600 font-semibold flex items-center gap-2">
                  <div className="w-5 h-5 bg-rose-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-rose-500 text-[10px] font-black">!</span>
                  </div>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 font-mono">
                    Email
                  </label>
                  <div className="relative flex items-center bg-slate-50/80 border border-slate-200/80 rounded-2xl focus-within:ring-2 focus-within:ring-[#2196D3]/40 focus-within:border-[#2196D3]/50 focus-within:bg-white transition-all overflow-hidden h-12 group">
                    <input 
                      type="email"
                      placeholder="admin@cdclaundry.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full h-full px-5 bg-transparent text-slate-800 text-sm font-medium focus:outline-none placeholder-slate-300"
                      required
                    />
                    <div className="pr-4 text-slate-300 shrink-0 group-focus-within:text-[#2196D3]/60 transition-colors">
                      <span className="font-mono text-sm font-bold">@</span>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 font-mono">
                    Password
                  </label>
                  <div className="relative flex items-center bg-slate-50/80 border border-slate-200/80 rounded-2xl focus-within:ring-2 focus-within:ring-[#2196D3]/40 focus-within:border-[#2196D3]/50 focus-within:bg-white transition-all overflow-hidden h-12">
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password Anda"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full h-full pl-5 pr-12 bg-transparent text-slate-800 text-sm font-medium focus:outline-none placeholder-slate-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-slate-300 hover:text-[#2196D3] transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex items-center justify-end">
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); }} 
                    className="text-[11px] text-[#2196D3] hover:text-[#1a7ab5] font-semibold cursor-pointer transition-colors"
                  >
                    Lupa Password?
                  </a>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 bg-gradient-to-r from-[#2196D3] to-[#1E88C7] hover:from-[#1E88C7] hover:to-[#1a7ab5] disabled:from-slate-300 disabled:to-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-[#2196D3]/25 hover:shadow-xl hover:shadow-[#2196D3]/30 flex items-center justify-center gap-2.5 px-6 py-3.5 transition-all duration-300 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#2196D3]/50 focus:ring-offset-2 group"
                >
                  <WashingMachine size={17} className="opacity-80 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="text-sm tracking-wide">
                    {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
                  </span>
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  )}
                </button>

                {/* Terms Note */}
                <p className="text-[10px] text-slate-400/80 font-medium leading-normal text-center pt-1">
                  Dengan masuk, Anda menyetujui <span className="text-[#2196D3]/70 hover:text-[#2196D3] cursor-pointer transition-colors">Syarat & Ketentuan</span> CDC Laundry
                </p>
              </form>

            </div>
          </div>

        </main>

        {/* FOOTER AREA */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.06] pt-6 shrink-0 z-10">
          {/* Support Agent Info */}
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.04] p-0.5 overflow-hidden shrink-0 group-hover:border-[#2196D3]/30 transition-colors">
              <img 
                src={logoCdc} 
                alt="Support Agent" 
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-white/80 tracking-wide leading-tight">CDC Laundry Support</h4>
              <p className="text-[10px] text-white/30 leading-none mt-0.5">Butuh bantuan? Hubungi kami kapan saja</p>
            </div>
          </div>

          {/* Social and Copyright Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/30">
            <div className="flex items-center gap-4 font-medium">
              <a href="#" className="hover:text-[#2196D3] transition-colors">Twitter</a>
              <span className="text-white/10">·</span>
              <a href="#" className="hover:text-[#7EC839] transition-colors">Instagram</a>
            </div>
            <span className="hidden sm:inline text-white/10">|</span>
            <p className="font-mono text-center sm:text-right text-[10px]">
              ©2026 CDC Laundry. All Rights Reserved. 
              <span className="mx-1.5 text-white/10">·</span> 
              <a href="#" className="hover:text-white/60 transition-colors">Privacy</a> 
              <span className="mx-1.5 text-white/10">·</span> 
              <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
            </p>
          </div>
        </footer>

      </div>

    </div>
  );
}