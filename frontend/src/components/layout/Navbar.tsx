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

  // Hide the global public navbar on admin pages since they have their own dashboard layout
  if (pathname?.startsWith('/admin')) {
    return null;
  }

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
              ? 'bg-white/80 backdrop-blur-2xl border border-slate-900/10 rounded-2xl shadow-xl shadow-slate-200/50 h-[4.5rem] flex items-center justify-between'
              : 'bg-transparent border-b border-transparent h-24 flex items-center justify-between'
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
              <img 
                src="/logo.png" 
                alt="Mysuru Travel Club Logo" 
                className="h-10 md:h-12 w-auto object-contain drop-shadow-md"
              />
            </div>
            <span className="text-lg md:text-xl font-outfit font-black tracking-tight text-slate-900 group-hover:text-primary-600 transition-colors duration-300 drop-shadow-sm">
              MYSURU TRAVEL CLUB
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100/50 border border-slate-200/50 p-1.5 rounded-2xl backdrop-blur-md shadow-inner">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`relative px-5 py-2 text-sm font-semibold tracking-wide transition-all duration-300 rounded-xl group overflow-hidden ${
                    isActive 
                      ? 'text-primary-700 bg-white shadow-sm border border-slate-200/60' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <span className="flex items-center gap-2 relative z-10">
                    <link.icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-primary-500 transition-colors'}`} />
                    {link.label}
                  </span>
                  
                  {/* Subtle hover neon bar */}
                  {!isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[3px] bg-gradient-to-r from-primary-500 to-accent-cyan group-hover:w-1/2 transition-all duration-300 rounded-t-full opacity-70" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action Button */}
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="hidden sm:flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 group"
            >
              <HiOutlineUser className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
              Admin Portal
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2.5 text-slate-600 hover:text-slate-900 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors shadow-sm"
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
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative pt-24 px-6 pb-8 space-y-3 border-b border-slate-200 bg-white/95 backdrop-blur-2xl shadow-2xl"
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
                      className={`flex items-center gap-4 px-6 py-4 text-base font-bold rounded-2xl border transition-all ${
                        isActive 
                          ? 'text-primary-700 bg-primary-50 border-primary-200 shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900 bg-slate-50 border-slate-100 hover:bg-slate-100'
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
                  className="flex items-center justify-center gap-2 mt-8 px-6 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-primary-600 transition-colors"
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
