import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/axios';
import { Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen w-full bg-background flex flex-col justify-center items-center p-4 font-sans text-foreground">
      
      <div className="w-full max-w-[360px] space-y-6">
        
        {/* Login Card */}
        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-lg space-y-5">
          
          {/* Logo and Brand Title */}
          <div className="flex flex-col items-center space-y-2 text-center pb-2 border-b border-border/60">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-border shadow-sm">
              <img src={logoCdc} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-foreground font-poppins">CDC Laundry</h1>
              <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest mt-0.5">Admin Access</p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium flex items-start gap-2.5">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 font-mono">
                Email
              </label>
              <input 
                type="email"
                placeholder="admin@cdclaundry.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full h-10 px-3.5 bg-background border border-border focus:border-primary/60 text-foreground text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/60"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1 font-mono">
                Password
              </label>
              <div className="relative flex items-center">
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full h-10 pl-3.5 pr-10 bg-background border border-border focus:border-primary/60 text-foreground text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/60"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground disabled:text-muted-foreground font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] focus:outline-none cursor-pointer text-xs"
            >
              {loading ? (
                <>
                  <span>Memproses...</span>
                  <Loader2 size={13} className="animate-spin" />
                </>
              ) : (
                <>
                  <span>Masuk Dashboard</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-[9px] text-center text-muted-foreground font-mono select-none">
          ©2026 CDC Laundry. All Rights Reserved.
        </p>

      </div>
    </div>
  );
}