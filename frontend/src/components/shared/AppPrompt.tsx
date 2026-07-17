'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineDownload, HiOutlineX, HiOutlinePhone, HiOutlineArrowRight } from 'react-icons/hi';
import api from '@/lib/api';

export default function AppPrompt() {
  const [settings, setSettings] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deviceOS, setDeviceOS] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    // 1. Fetch site settings
    const fetchSettings = async () => {
      try {
        const data = await api.settings.getAll();
        setSettings(data);
      } catch (err) {
        console.error('Failed to fetch settings for app prompt:', err);
      }
    };
    fetchSettings();

    // 2. Detect OS
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent || navigator.vendor : '';
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setDeviceOS('ios');
    } else if (/android/i.test(userAgent)) {
      setDeviceOS('android');
    }

    // 3. Listen for browser PWA install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (!settings) return;

    // Check if prompt is globally enabled
    const isEnabled = settings.app_prompt_enabled === 'true';
    if (!isEnabled) return;

    // Check if user previously dismissed it permanently
    const permanentlyDismissed = localStorage.getItem('app_prompt_permanently_dismissed') === 'true';
    if (permanentlyDismissed) return;

    // Check if dismissed for this session
    const sessionDismissed = sessionStorage.getItem('app_prompt_session_dismissed') === 'true';
    if (sessionDismissed) return;

    // Show after 3 seconds delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [settings]);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsVisible(false);
    } else if (deviceOS === 'ios') {
      alert('To install, tap the Share icon at the bottom of your screen and select "Add to Home Screen".');
    }
  };

  const handleDismissSession = () => {
    sessionStorage.setItem('app_prompt_session_dismissed', 'true');
    setIsVisible(false);
  };

  const handleDismissPermanent = () => {
    localStorage.setItem('app_prompt_permanently_dismissed', 'true');
    setIsVisible(false);
  };

  if (!settings || !isVisible) return null;

  const title = settings.app_prompt_title || 'Experience Travels on the Go';
  const description = settings.app_prompt_description || 'Download our mobile app or add it to your home screen for real-time alerts and offline maps.';
  const playStoreLink = settings.app_prompt_play_store;
  const appStoreLink = settings.app_prompt_app_store;
  const apkLink = settings.app_prompt_apk_link;

  return (
    <AnimatePresence>
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 md:p-6 pointer-events-none flex justify-center">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="pointer-events-auto w-full max-w-xl bg-[#0f172a]/95 backdrop-blur-md text-white border border-slate-800 shadow-2xl rounded-3xl p-5 sm:p-6"
        >
          {/* Close button */}
          <button
            onClick={handleDismissSession}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>

          <div className="flex gap-4 items-start pr-6">
            {/* App Logo */}
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="App Logo" className="w-full h-full object-cover" />
            </div>

            {/* App Info */}
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm sm:text-base font-outfit uppercase tracking-tight text-white flex items-center gap-1.5">
                <HiOutlinePhone className="w-4 h-4 text-amber-500" /> Mysuru Travel Club App
              </h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{title}</p>
              <p className="text-[11px] text-slate-450 leading-relaxed font-medium">
                {description}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Primary Action: PWA Install or direct Play/App store */}
            {/* Prioritize Native App Links if they exist and match the user's OS */}
            {deviceOS === 'android' && playStoreLink ? (
              <a
                href={playStoreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                Get on Google Play
              </a>
            ) : deviceOS === 'ios' && appStoreLink ? (
              <a
                href={appStoreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                Get on App Store
              </a>
            ) : isInstallable || deviceOS === 'ios' ? (
              <button
                onClick={handleInstallPWA}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <HiOutlineDownload className="w-4.5 h-4.5" /> Install App / Add to Home
              </button>
            ) : (
              <button
                onClick={handleInstallPWA}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <HiOutlineDownload className="w-4.5 h-4.5" /> Install PWA App
              </button>
            )}

            {/* Secondary Actions (APK, App Store, or Play Store if not main device OS) */}
            <div className="flex gap-2.5">
              {apkLink && (
                <a
                  href={apkLink}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition-all border border-slate-700 text-center cursor-pointer flex items-center justify-center gap-1"
                >
                  Download APK
                </a>
              )}
              <button
                onClick={handleDismissSession}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-350 rounded-2xl text-xs font-bold transition-all border border-slate-800 cursor-pointer flex items-center justify-center gap-1"
              >
                Website <HiOutlineArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dismiss choices footer */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <button
              onClick={handleDismissPermanent}
              className="text-[10px] text-slate-500 hover:text-slate-400 font-bold uppercase tracking-wider cursor-pointer"
            >
              Don't show this prompt again
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
