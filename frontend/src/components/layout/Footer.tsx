'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from 'react-icons/hi';
import { RiInstagramLine, RiTwitterXLine, RiFacebookCircleLine, RiYoutubeLine } from 'react-icons/ri';
import api from '@/lib/api';

const footerLinks = {
  explore: [
    { label: 'Upcoming Trips', href: '/trips' },
    { label: 'Destinations', href: '/trips' },
    { label: 'Travel Blog', href: '/blogs' },
    { label: 'Vote Next Trip', href: '/vote' },
  ],
  company: [
    { label: 'About Us', href: '#' },
    { label: 'Our Team', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  support: [
    { label: 'FAQ', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Refund Policy', href: '#' },
  ],
};

export default function Footer() {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    api.settings.getAll().then(setSettings).catch(console.error);
  }, []);

  const email = settings.contactEmail || 'hello@mysurutravelclub.com';
  const phone = settings.contactPhone || '+91 98765 43210';
  const address = settings.contactAddress || 'Mysuru, Karnataka, India';
  const siteName = settings.siteName || 'MYSURU TRAVEL CLUB';

  return (
    <footer className="bg-white border-t border-slate-200/60 pt-12 sm:pt-24 pb-8 sm:pb-12 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-600/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent-cyan/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8 mb-12 sm:mb-20">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-purple-500 to-accent-cyan flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                <span className="text-white font-outfit font-black text-xl">{siteName.charAt(0)}</span>
              </div>
              <span className="text-xl font-outfit font-black tracking-tight text-slate-900 group-hover:text-primary-600 transition-colors">{siteName}</span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-sm font-outfit">
              {settings.footerDescription || `AI-powered travel experiences that transform ordinary trips into extraordinary adventures. Discover, book, and explore with ${siteName}.`}
            </p>
            <div className="space-y-3.5">
              <a href={`mailto:${email}`} className="flex items-center gap-2.5 text-sm text-slate-500 hover:text-slate-900 transition-colors duration-300">
                <HiOutlineMail className="w-4 h-4 text-primary-500" />
                {email}
              </a>
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className="flex items-center gap-2.5 text-sm text-slate-500 hover:text-slate-900 transition-colors duration-300">
                <HiOutlinePhone className="w-4 h-4 text-primary-500" />
                {phone}
              </a>
              <p className="flex items-center gap-2.5 text-sm text-slate-500">
                <HiOutlineLocationMarker className="w-4 h-4 text-primary-500" />
                {address}
              </p>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-outfit font-black text-slate-900 uppercase tracking-[0.2em] mb-6">
                {title}
              </h4>
              <ul className="space-y-3.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      href={link.href} 
                      className="text-sm text-slate-500 hover:text-primary-600 transition-all duration-300 hover:translate-x-1.5 inline-block font-outfit"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-slate-100 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs md:text-sm text-slate-400 font-outfit">
            © {new Date().getFullYear()} {siteName}. All rights reserved. Made with ❤️ in India.
          </p>
          
          {/* Social Icons with colorful glows on hover */}
          <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
            {[
              { icon: RiInstagramLine, href: settings.socialInstagram || 'https://instagram.com', label: 'Instagram', hoverGlow: 'hover:bg-gradient-to-tr hover:from-purple-500 hover:to-pink-500 hover:border-transparent hover:text-white' },
              { icon: RiTwitterXLine, href: settings.socialTwitter || 'https://twitter.com', label: 'Twitter', hoverGlow: 'hover:bg-black hover:text-white hover:border-transparent' },
              { icon: RiFacebookCircleLine, href: settings.socialFacebook || 'https://facebook.com', label: 'Facebook', hoverGlow: 'hover:bg-blue-600 hover:text-white hover:border-transparent' },
              { icon: RiYoutubeLine, href: settings.socialYoutube || 'https://youtube.com', label: 'Youtube', hoverGlow: 'hover:bg-red-600 hover:text-white hover:border-transparent' }
            ].map((social, idx) => (
              <a
                key={idx}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className={`w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 hover:shadow-md transition-all duration-300 active:scale-95 ${social.hoverGlow}`}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
