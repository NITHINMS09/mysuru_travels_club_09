'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi';
import TripCard from '../shared/TripCard';
import api from '@/lib/api';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function UpcomingTrips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const data = await api.trips.getAll({ upcomingOnly: 'true', limit: '6' });
        setTrips(data.trips || []);
      } catch (error) {
        console.error('Failed to fetch trips:', error);
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  return (
    <section className="pt-12 pb-24 md:pb-36 bg-[#030014] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-[450px] h-[450px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-[450px] h-[450px] bg-accent-cyan/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-accent-gold font-bold tracking-[0.25em] uppercase text-xs mb-4 block"
            >
              Don't Miss Out
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-black mb-0 font-outfit text-white"
            >
              Upcoming <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-400 to-pink-500">Adventures</span>
            </motion.h2>
          </div>

          <div className="flex gap-4">
            <button className="swiper-prev w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15] active:scale-95 transition-all duration-300">
              <HiOutlineArrowLeft className="w-5 h-5" />
            </button>
            <button className="swiper-next w-12 h-12 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-cyan flex items-center justify-center text-white hover:from-primary-600 hover:to-accent-cyan/90 shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] active:scale-95 transition-all duration-300">
              <HiOutlineArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-white/[0.02] border border-white/[0.06] shimmer" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.01] rounded-3xl border border-dashed border-white/[0.06]">
            <p className="text-white/20 font-bold uppercase tracking-widest text-sm">No upcoming adventures found</p>
          </div>
        ) : (
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={30}
            slidesPerView={1}
            navigation={{
              prevEl: '.swiper-prev',
              nextEl: '.swiper-next',
            }}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="pb-16 pt-4 px-4 -mx-4 overflow-visible"
          >
            {trips.map((trip, i) => (
              <SwiperSlide key={trip.id} className="h-auto">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                  className="h-full"
                >
                  <TripCard trip={trip} />
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
}
