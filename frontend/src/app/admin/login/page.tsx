'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineArrowRight } from 'react-icons/hi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('expired=true')) {
      toast.error('Session expired. Please log in again.');
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.auth.login(email, password);
      localStorage.setItem('tripnova_admin_token', data.token);
      localStorage.setItem('tripnova_admin_user', JSON.stringify(data.admin));
      toast.success('Welcome back, Admin!');
      router.push('/admin/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-violet-500/10 blur-[100px]" />
      <div className="absolute bottom-0 left-0 h-[500px] w-[500px] translate-y-1/2 -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-6 sm:mb-10 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500 shadow-lg shadow-violet-500/20">
            <span className="font-outfit text-2xl font-bold text-white">T</span>
          </div>
          <h1 className="mb-2 text-2xl sm:text-3xl font-black text-slate-900">Admin Portal</h1>
          <p className="text-sm text-slate-500">Secure access for TripNova administrators</p>
        </div>

        <div className="glass-card p-5 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Email Address</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12 border border-slate-200/80 bg-white/80 focus:bg-white text-slate-900"
                  placeholder="admin@tripnova.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12 border border-slate-200/80 bg-white/80 focus:bg-white text-slate-900"
                  placeholder="........"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex w-full items-center justify-center gap-2 py-4"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              <HiOutlineArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-slate-900"
          >
            Return to Website
          </button>
        </div>
      </motion.div>
    </div>
  );
}
