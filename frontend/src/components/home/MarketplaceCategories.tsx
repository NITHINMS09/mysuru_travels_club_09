'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { 
  HiOutlineHome, HiOutlineKey, HiOutlineOfficeBuilding, 
  HiOutlineFire, HiOutlineGlobeAlt, HiOutlineLightningBolt,
  HiOutlineMap, HiOutlineColorSwatch, HiOutlineLibrary,
  HiOutlineStar, HiOutlineTicket, HiOutlineCamera, HiOutlinePaperAirplane
} from 'react-icons/hi';
import { RiShipLine, RiCarLine, RiMotorbikeLine } from 'react-icons/ri';
import { BiBuildingHouse, BiCalendarStar } from 'react-icons/bi';
import { FaCampground } from 'react-icons/fa';

const categories = [
  { id: 'RESORT', title: 'Resorts', icon: HiOutlineOfficeBuilding, color: 'from-blue-500 to-cyan-400', desc: 'Luxury getaways' },
  { id: 'CAR_RENTAL', title: 'Car Rentals', icon: RiCarLine, color: 'from-orange-500 to-amber-400', desc: 'Self-drive freedom' },
  { id: 'HOTEL', title: 'Hotels', icon: BiBuildingHouse, color: 'from-purple-500 to-pink-400', desc: 'Premium stays' },
  { id: 'ROOM', title: 'Rooms', icon: HiOutlineHome, color: 'from-green-500 to-emerald-400', desc: 'Cozy accommodations' },
  { id: 'VILLA', title: 'Villas', icon: HiOutlineLibrary, color: 'from-rose-500 to-red-400', desc: 'Private estates' },
  { id: 'ADVENTURE', title: 'Adventures', icon: HiOutlineFire, color: 'from-red-500 to-orange-400', desc: 'Thrilling experiences' },
  { id: 'TOUR_GUIDE', title: 'Tour Guides', icon: HiOutlineMap, color: 'from-indigo-500 to-blue-400', desc: 'Local experts' },
  { id: 'BIKE_RENTAL', title: 'Bike Rentals', icon: RiMotorbikeLine, color: 'from-zinc-500 to-gray-400', desc: 'Two-wheel exploration' },
  { id: 'HOMESTAY', title: 'Homestays', icon: FaCampground, color: 'from-amber-500 to-yellow-400', desc: 'Authentic living' },
  { id: 'LUXURY_STAY', title: 'Luxury Stays', icon: HiOutlineStar, color: 'from-yellow-400 to-amber-600', desc: '5-star opulence' },
  { id: 'TRAVEL_PACKAGE', title: 'Packages', icon: HiOutlineGlobeAlt, color: 'from-teal-500 to-emerald-400', desc: 'Curated itineraries' },
  { id: 'CRUISE', title: 'Cruises', icon: RiShipLine, color: 'from-cyan-500 to-blue-500', desc: 'Ocean voyages' },
  { id: 'EVENT', title: 'Events', icon: BiCalendarStar, color: 'from-fuchsia-500 to-purple-500', desc: 'Exclusive bookings' }
];

export default function MarketplaceCategories() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section ref={containerRef} className="pt-20 pb-8 bg-[#050816] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <motion.div style={{ y }} className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-accent-gold mb-4 block">Premium Marketplace</span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter">
            Curate Your Perfect <span className="gradient-text">Experience</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
            From luxury resorts to exotic car rentals, browse our exclusive collection of verified premium services.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((cat, i) => (
            <Link key={cat.id} href={`/marketplace?category=${cat.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.05] transition-all overflow-hidden h-full flex flex-col items-center text-center shadow-lg cursor-pointer"
              >
                {/* Hover Glow Background */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${cat.color} transition-opacity duration-500`} />
                
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br ${cat.color} shadow-glow group-hover:scale-110 transition-transform duration-300`}>
                  <cat.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1">{cat.title}</h3>
                <p className="text-xs text-white/40 font-medium">{cat.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
