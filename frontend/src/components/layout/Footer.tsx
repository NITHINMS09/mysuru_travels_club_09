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

const defaultSocials = [
  { icon: RiInstagramLine, href: '#' },
  { icon: RiTwitterXLine, href: '#' },
  { icon: RiFacebookCircleLine, href: '#' },
  { icon: RiYoutubeLine, href: '#' },
];

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
    <footer className="bg-black border-t border-white/[0.06] pt-20 pb-8 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent-cyan/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-cyan flex items-center justify-center">
                <span className="text-white font-outfit font-bold text-lg">{siteName.charAt(0)}</span>
              </div>
              <span className="text-xl font-outfit font-bold">{siteName}</span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-sm">
              {settings.footerDescription || `AI-powered travel experiences that transform ordinary trips into extraordinary adventures. Discover, book, and explore with ${siteName}.`}
            </p>
            <div className="space-y-2.5">
              <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                <HiOutlineMail className="w-4 h-4 text-primary-400" />
                {email}
              </a>
              <a href={`tel:${phone.replace(/\s+/g, '')}`} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                <HiOutlinePhone className="w-4 h-4 text-primary-400" />
                {phone}
              </a>
              <p className="flex items-center gap-2 text-sm text-white/50">
                <HiOutlineLocationMarker className="w-4 h-4 text-primary-400" />
                {address}
              </p>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-outfit font-semibold text-white uppercase tracking-wider mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} {siteName}. All rights reserved. Made with ❤️ in India.
          </p>
          <div className="flex items-center gap-3">
            {[
              { icon: RiInstagramLine, href: settings.socialInstagram || '#', label: 'Instagram' },
              { icon: RiTwitterXLine, href: settings.socialTwitter || '#', label: 'Twitter' },
              { icon: RiFacebookCircleLine, href: settings.socialFacebook || '#', label: 'Facebook' },
            ].map((social, idx) => (
              <a
                key={idx}
                href={social.href}
                aria-label={social.label}
                className="w-9 h-9 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/50 hover:text-white hover:border-primary-500/50 hover:bg-primary-500/10 transition-all duration-300"
              >
                <social.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
