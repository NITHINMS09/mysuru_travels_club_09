'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { 
  HiOutlineOfficeBuilding as OfficeIcon, HiOutlineHome as HomeIcon, HiOutlineFire as FireIcon, 
  HiOutlineGlobeAlt as GlobeIcon, HiOutlineLibrary as LibraryIcon, HiOutlineStar as StarIcon, 
  HiOutlineMap as MapIcon 
} from 'react-icons/hi';
import { RiShipLine, RiCarLine, RiMotorbikeLine } from 'react-icons/ri';
import { BiBuildingHouse, BiCalendarStar } from 'react-icons/bi';
import { FaCampground } from 'react-icons/fa';

const categories = [
  { id: 'RESORT', title: 'Resorts', icon: OfficeIcon, color: 'from-blue-500 to-cyan-400', glow: 'rgba(59,130,246,0.2)', desc: 'Luxury getaways' },
  { id: 'CAR_RENTAL', title: 'Car Rentals', icon: RiCarLine, color: 'from-orange-500 to-amber-400', glow: 'rgba(249,115,22,0.2)', desc: 'Self-drive freedom' },
  { id: 'HOTEL', title: 'Hotels', icon: BiBuildingHouse, color: 'from-purple-500 to-pink-400', glow: 'rgba(168,85,247,0.2)', desc: 'Premium stays' },
  { id: 'ROOM', title: 'Rooms', icon: HomeIcon, color: 'from-green-500 to-emerald-400', glow: 'rgba(16,185,129,0.2)', desc: 'Cozy accommodations' },
  { id: 'VILLA', title: 'Villas', icon: LibraryIcon, color: 'from-rose-500 to-red-400', glow: 'rgba(244,63,94,0.2)', desc: 'Private estates' },
  { id: 'ADVENTURE', title: 'Adventures', icon: FireIcon, color: 'from-red-500 to-orange-400', glow: 'rgba(239,68,68,0.2)', desc: 'Thrilling experiences' },
  { id: 'TOUR_GUIDE', title: 'Tour Guides', icon: MapIcon, color: 'from-indigo-500 to-blue-400', glow: 'rgba(99,102,241,0.2)', desc: 'Local experts' },
  { id: 'BIKE_RENTAL', title: 'Bike Rentals', icon: RiMotorbikeLine, color: 'from-zinc-500 to-gray-400', glow: 'rgba(115,115,115,0.2)', desc: 'Two-wheel exploration' },
  { id: 'HOMESTAY', title: 'Homestays', icon: FaCampground, color: 'from-amber-500 to-yellow-400', glow: 'rgba(245,158,11,0.2)', desc: 'Authentic living' },
  { id: 'LUXURY_STAY', title: 'Luxury Stays', icon: StarIcon, color: 'from-yellow-400 to-amber-600', glow: 'rgba(234,179,8,0.2)', desc: '5-star opulence' },
  { id: 'TRAVEL_PACKAGE', title: 'Packages', icon: GlobeIcon, color: 'from-teal-500 to-emerald-400', glow: 'rgba(20,184,166,0.2)', desc: 'Curated itineraries' },
  { id: 'CRUISE', title: 'Cruises', icon: RiShipLine, color: 'from-cyan-500 to-blue-500', glow: 'rgba(6,182,212,0.2)', desc: 'Ocean voyages' },
  { id: 'EVENT', title: 'Events', icon: BiCalendarStar, color: 'from-fuchsia-500 to-purple-500', glow: 'rgba(217,70,239,0.2)', desc: 'Exclusive bookings' }
];

export default function MarketplaceCategories() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section ref={containerRef} className="pt-24 pb-12 bg-[#030014] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-accent-cyan/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div style={{ y }} className="text-center mb-20">
          <span className="text-xs font-bold tracking-[0.25em] uppercase text-accent-gold mb-4 block">Premium Marketplace</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight font-outfit">
            Curate Your Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-400 to-pink-500">Experience</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-outfit">
            From luxury resorts to exotic car rentals, browse our exclusive collection of verified premium services.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {categories.map((cat, i) => (
            <Link key={cat.id} href={`/marketplace?category=${cat.id}`} className="h-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#0c0a25] transition-all duration-300 overflow-hidden h-full flex flex-col items-center text-center shadow-lg cursor-pointer"
              >
                {/* Glow Behind on Hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                  style={{
                    background: `radial-gradient(circle at center, ${cat.glow} 0%, transparent 70%)`
                  }}
                />
                
                {/* Icon Container */}
                <div className={`w-14 h-14 rounded-2xl mb-5 flex items-center justify-center bg-gradient-to-br ${cat.color} shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <cat.icon className="w-6.5 h-6.5 text-white" />
                </div>
                
                <h3 className="text-base md:text-lg font-bold text-white group-hover:text-primary-300 transition-colors duration-300 mb-1.5 font-outfit">{cat.title}</h3>
                <p className="text-xs text-white/40 font-medium font-outfit tracking-wide">{cat.desc}</p>
                
                {/* Glowing bottom indicator */}
                <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${cat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
