import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

// Import aset gambar dan logo lo
import loginSideImg from '@/assets/login-img.png';
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
    setLoading(true);

    try {
      const response = await apiClient.post('/login', { email, password });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
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
    // Kontainer utama tanpa padding, biar kita bisa ngatur sisi kanan aja yang punya jarak
    <div className="flex min-h-screen w-full bg-background text-foreground font-sans">
      
      {/* SISI KIRI - Form Login (Lebar 40%) */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-16 lg:w-[40%] xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          
          {/* Logo Brand Custom - Dibuat sejajar secara vertikal (items-center) */}
          <div className="mb-12 flex items-center gap-3">
            <img 
              src={logoCdc} 
              alt="CDC Laundry Logo" 
              className="h-10 w-auto object-contain rounded-md shadow-sm" 
            />
            <span className="text-2xl font-extrabold tracking-tight text-foreground">
              CDC Laundry
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Log in to your account.</h1>
            <p className="text-muted-foreground text-sm">Enter your email address and password to log in.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-destructive/15 p-4 text-sm text-destructive font-semibold border border-destructive/20">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              
              {/* Input Email */}
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  className="pl-12 bg-background h-12 rounded-xl border-input text-foreground focus-visible:ring-primary shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Input Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="pl-12 pr-12 bg-background h-12 rounded-xl border-input text-foreground focus-visible:ring-primary shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <a href="#" className="text-sm font-semibold text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Tombol Login */}
            <Button type="submit" className="w-full h-12 text-base font-semibold rounded-xl shadow-md" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* SISI KANAN - Gambar Poster (Lebar 60%) */}
      {/* P-4 dan lg:p-6 memberikan margin luar, sementara konten gambarnya full h-full */}
      <div className="hidden lg:block lg:w-[60%] p-4 lg:p-6 lg:pl-0">
        <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] bg-muted shadow-2xl">
          <img 
            src={loginSideImg} 
            alt="CDC Laundry Dashboard" 
            // object-cover memastikan poster lo menutupi seluruh kotak tanpa gepeng!
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
          />
        </div>
      </div>
      
    </div>
  );
}