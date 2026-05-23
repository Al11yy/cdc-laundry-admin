import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/axios';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen w-full bg-[#150a33] flex items-center justify-center p-4 md:p-8 font-sans selection:bg-[#5b3bf5]/30">
      
      {/* Main Board Container */}
      <div className="relative w-full max-w-[1280px] bg-[#1d1145] rounded-[2.5rem] border border-white/10 shadow-2xl p-6 md:p-12 overflow-hidden flex flex-col justify-between min-h-[90vh]">
        
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full border-[30px] border-white/5 -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full border-[40px] border-white/5 -ml-24 -mb-24 pointer-events-none" />

        {/* TOP BAR / NAVBAR */}
        <header className="flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center shadow-inner border border-white/10 overflow-hidden">
              <img 
                src={logoCdc} 
                alt="CDC Laundry Logo" 
                className="h-full w-full object-cover" 
              />
            </div>
            <span className="text-lg font-extrabold tracking-wider text-white uppercase font-poppins">
              CDC Laundry
            </span>
          </div>
        </header>

        {/* MIDDLE SECTION - TWO COLUMNS */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-8 z-10">
          
          {/* Left Column: Laundry Vector Illustration */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center text-center">
            <div className="w-full max-w-[500px] lg:max-w-[550px] aspect-[4/3] rounded-3xl overflow-hidden bg-[#241753]/40 border border-white/5 p-4 flex items-center justify-center shadow-inner group">
              <img 
                src={loginIllustration} 
                alt="CDC Laundry Workspace" 
                className="max-h-full max-w-full object-contain rounded-2xl group-hover:scale-[1.02] transition-transform duration-500 ease-out" 
              />
            </div>
          </div>

          {/* Right Column: Premium White Login Card */}
          <div className="lg:col-span-5 flex justify-end">
            <div className="w-full max-w-[420px] bg-white rounded-[2rem] p-8 md:p-10 shadow-2xl flex flex-col justify-center text-slate-800 animate-fade-in">
              
              <div className="mb-6">
                <h2 className="text-3xl font-extrabold text-[#1d1145] tracking-tight font-poppins">
                  Welcome Back...
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-medium">
                  Please enter your email and password
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 font-semibold font-mono">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Address */}
                <div className="space-y-1">
                  <div className="relative flex items-center bg-slate-50 border border-slate-200/80 rounded-2xl focus-within:ring-2 focus-within:ring-[#5b3bf5]/50 focus-within:border-transparent transition-all overflow-hidden h-12">
                    <input 
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full h-full px-5 bg-transparent text-slate-800 text-sm font-medium focus:outline-none placeholder-slate-400"
                      required
                    />
                    <div className="pr-4 text-slate-400 shrink-0">
                      <span className="font-mono text-sm">@</span>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="relative flex items-center bg-slate-50 border border-slate-200/80 rounded-2xl focus-within:ring-2 focus-within:ring-[#5b3bf5]/50 focus-within:border-transparent transition-all overflow-hidden h-12">
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full h-full pl-5 pr-12 bg-transparent text-slate-800 text-sm font-medium focus:outline-none placeholder-slate-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Terms and Conditions Note */}
                <p className="text-[10px] text-slate-400 font-medium leading-normal text-left">
                  By login, you agree to our <span className="text-[#5b3bf5] hover:underline cursor-pointer">Terms & Conditions</span>
                </p>

                {/* Login Button & Forgot Password row */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-12 bg-[#5b3bf5] hover:bg-[#492cd9] disabled:bg-slate-300 text-white font-semibold rounded-2xl shadow-lg shadow-[#5b3bf5]/20 flex items-center justify-between px-5 transition-all duration-300 active:scale-[0.98] focus:outline-none"
                  >
                    <span className="text-sm">
                      {loading ? 'login...' : 'login...'}
                    </span>
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ArrowRight size={16} />
                    )}
                  </button>

                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); }} 
                    className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer shrink-0"
                  >
                    Forget Password
                  </a>
                </div>
              </form>

            </div>
          </div>

        </main>

        {/* FOOTER AREA */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-6 shrink-0 z-10">
          {/* Support Agent Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-white/15 bg-white/5 p-0.5 overflow-hidden shrink-0">
              <img 
                src={logoCdc} 
                alt="Support Agent" 
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-white tracking-wide leading-tight">CDC Laundry Support</h4>
              <p className="text-[10px] text-white/50 leading-none mt-0.5">Hey there, How can we help you....?</p>
            </div>
          </div>

          {/* Social and Copyright Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/40">
            <div className="flex items-center gap-4 font-medium">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <span>-</span>
              <a href="#" className="hover:text-white transition-colors">instagram</a>
            </div>
            <span className="hidden sm:inline text-white/10">|</span>
            <p className="font-mono text-center sm:text-right">
              ©2026 All Rights Reserved CDC Laundry. 
              <span className="mx-2">·</span> 
              <a href="#" className="hover:text-white transition-colors">Privacy</a> 
              <span className="mx-2">·</span> 
              <a href="#" className="hover:text-white transition-colors">Terms of Service.</a>
            </p>
          </div>
        </footer>

      </div>

    </div>
  );
}