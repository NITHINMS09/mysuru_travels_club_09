'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineMenuAlt3, HiX, HiOutlineUser, HiOutlineChatAlt2, HiOutlineMap, HiOutlineThumbUp, HiOutlineNewspaper } from 'react-icons/hi';
import { RiSparklingLine } from 'react-icons/ri';

const navLinks = [
  { href: '/', label: 'Home', icon: HiOutlineMap },
  { href: '/trips', label: 'Trips', icon: HiOutlineMap },
  { href: '/vote', label: 'Vote', icon: HiOutlineThumbUp },
  { href: '/blogs', label: 'Blog', icon: HiOutlineNewspaper },
  { href: '/ai', label: 'AI Planner', icon: RiSparklingLine },
  { href: '/trips', label: 'Chat Hub', icon: HiOutlineChatAlt2 },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'py-4 px-4 md:px-8' : 'py-0 px-0'
        }`}
      >
        <div 
          className={`max-w-7xl mx-auto px-4 md:px-8 transition-all duration-500 ${
            scrolled
              ? 'bg-white/70 backdrop-blur-xl border border-slate-900/5 rounded-2xl shadow-xl shadow-slate-200/50 h-16 flex items-center justify-between'
              : 'bg-transparent border-b border-transparent h-20 flex items-center justify-between'
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-purple-500 to-accent-cyan flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] group-hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] group-hover:scale-105 transition-all duration-300">
              <span className="text-white font-outfit font-black text-xl">T</span>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent-gold rounded-full border border-white/20 animate-pulse" />
            </div>
            <span className="text-lg md:text-xl font-outfit font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-primary-600 group-hover:to-accent-cyan transition-all duration-300">
              MYSURU TRAVEL CLUB
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900/[0.02] border border-slate-900/5 p-1 rounded-xl backdrop-blur-sm">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`relative px-4.5 py-2 text-sm font-semibold tracking-wide transition-all duration-300 rounded-lg group ${
                    isActive 
                      ? 'text-slate-900 bg-slate-900/5 border border-slate-900/5' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-900/[0.02]'
                  }`}
                >
                  <span className="flex items-center gap-1.5 relative z-10">
                    <link.icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-primary-500 transition-colors'}`} />
                    {link.label}
                  </span>
                  
                  {/* Subtle hover neon bar */}
                  {!isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-primary-500 to-accent-cyan group-hover:w-1/2 transition-all duration-300 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl bg-white hover:text-primary-600 hover:border-primary-500/50 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300"
            >
              <HiOutlineUser className="w-4 h-4 text-primary-500" />
              Admin Portal
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl bg-slate-900/[0.02] border border-slate-900/5 hover:bg-slate-900/[0.04] transition-colors"
            >
              {mobileOpen ? <HiX className="w-6 h-6" /> : <HiOutlineMenuAlt3 className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative pt-24 px-6 pb-8 space-y-2 border-b border-slate-200 bg-white/95 backdrop-blur-2xl"
            >
              {navLinks.map((link, i) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3.5 px-5 py-4 text-base font-bold rounded-2xl border transition-all ${
                        isActive 
                          ? 'text-primary-600 bg-primary-50/50 border-primary-100' 
                          : 'text-slate-600 hover:text-slate-900 bg-slate-50/50 border-transparent hover:bg-slate-100/50'
                      }`}
                    >
                      <link.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <Link
                  href="/admin/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 mt-6 px-6 py-4 bg-gradient-to-r from-primary-500 to-purple-600 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                  <HiOutlineUser className="w-5 h-5" />
                  Admin Portal Login
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
