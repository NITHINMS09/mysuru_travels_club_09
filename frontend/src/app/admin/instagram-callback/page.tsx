'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'exchanging' | 'success' | 'error'>('exchanging');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      setStatus('error');
      setErrorMessage('No authorization code was returned from Instagram.');
      return;
    }

    const exchangeCode = async () => {
      const token = localStorage.getItem('tripnova_admin_token');
      if (!token) {
        setStatus('error');
        setErrorMessage('Admin session expired. Please log in again.');
        return;
      }

      try {
        const redirectUri = window.location.origin + '/admin/instagram-callback';
        const res = await api.instagram.connectReal(code, redirectUri, token);
        
        if (res.success) {
          setStatus('success');
          toast.success('Successfully linked live Instagram account!');
          setTimeout(() => {
            router.push('/admin/dashboard');
          }, 2000);
        } else {
          throw new Error(res.error || 'Failed to exchange authorization tokens.');
        }
      } catch (err: any) {
        console.error('OAuth Callback exchange failure:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Meta API credentials check failed. Make sure Client Secret and Redirect URIs match.');
      }
    };

    exchangeCode();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        {status === 'exchanging' && (
          <div className="space-y-4 animate-pulse">
            <HiOutlineClock className="w-16 h-16 text-amber-500 mx-auto animate-spin" />
            <h2 className="text-xl font-bold font-outfit uppercase tracking-tight">Exchanging Security Codes</h2>
            <p className="text-xs text-slate-400">Verifying authorization parameters and exchanging tokens with Meta...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <HiOutlineCheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold font-outfit uppercase tracking-tight text-green-400">Connection Successful!</h2>
            <p className="text-xs text-slate-400">Your Instagram account is now linked. Redirecting to dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <HiOutlineXCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold font-outfit uppercase tracking-tight text-rose-450">Connection Failed</h2>
              <p className="text-xs text-slate-350 bg-slate-950/50 p-4 border border-slate-800 rounded-2xl text-left leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InstagramCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
