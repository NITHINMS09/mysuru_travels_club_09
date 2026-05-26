'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineMenuAlt3, HiX, HiOutlineUser, HiOutlineChatAlt2, HiOutlineMap, HiOutlineThumbUp, HiOutlineNewspaper } from 'react-icons/hi';
import { RiSparklingLine } from 'react-icons/ri';

const navLinks = [
  { href: '/', label: 'Home', icon: HiOutlineMap },
  { href: '/trips', label: 'Trips', icon: HiOutlineMap },
  { href: '/vote', label: 'Vote', icon: HiOutlineThumbUp },
  { href: '/blogs', label: 'Blog', icon: HiOutlineNewspaper },
  { href: '/ai', label: 'AI Planner', icon: RiSparklingLine },
  { href: '/trips', label: 'Chat Hub', icon: HiOutlineChatAlt2 }, // Placeholder logic for hub
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
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
          scrolled
            ? 'bg-dark-500/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
                <span className="text-white font-outfit font-bold text-lg">T</span>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent-gold rounded-full animate-pulse" />
              </div>
              <span className="text-xl font-outfit font-bold tracking-tight">
                MYSURU TRAVEL CLUB
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="relative px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors duration-300 rounded-lg hover:bg-white/[0.05] group"
                >
                  <span className="flex items-center gap-1.5">
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </span>
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-cyan group-hover:w-3/4 transition-all duration-300 rounded-full" />
                </Link>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <Link
                href="/admin/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/80 border border-white/10 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] hover:border-primary-500/50 transition-all duration-300 backdrop-blur-sm"
              >
                <HiOutlineUser className="w-4 h-4" />
                Admin Login
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                {mobileOpen ? <HiX className="w-6 h-6" /> : <HiOutlineMenuAlt3 className="w-6 h-6" />}
              </button>
            </div>
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
            <div className="absolute inset-0 bg-dark-500/95 backdrop-blur-2xl" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative pt-24 px-6 pb-8 space-y-2"
            >
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-lg font-medium text-white/80 hover:text-white rounded-xl hover:bg-white/[0.05] transition-all"
                  >
                    <link.icon className="w-5 h-5 text-primary-400" />
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <Link
                  href="/admin/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-blue text-white font-semibold rounded-xl"
                >
                  <HiOutlineUser className="w-5 h-5" />
                  Admin Login
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
