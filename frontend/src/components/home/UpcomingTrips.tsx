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
        const data = await api.trips.getAll({ limit: '6' });
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
    <section className="pt-8 pb-20 md:pb-32 bg-[#050816] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="floating-orb w-96 h-96 bg-primary-600/20 top-0 -left-20" />
      <div className="floating-orb w-96 h-96 bg-accent-cyan/10 bottom-0 -right-20" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-accent-gold font-bold tracking-[0.3em] uppercase text-xs mb-4 block"
            >
              Don't Miss Out
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-title mb-0"
            >
              Upcoming <span className="gradient-text">Adventures</span>
            </motion.h2>
          </div>

          <div className="flex gap-4">
            <button className="swiper-prev w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all">
              <HiOutlineArrowLeft className="w-6 h-6" />
            </button>
            <button className="swiper-next w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center hover:bg-primary-500 shadow-glow transition-all">
              <HiOutlineArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border-2 border-dashed border-white/5">
            <p className="text-white/20 font-bold uppercase tracking-widest">No upcoming adventures found</p>
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
            className="pb-16 pt-8 px-4 -mx-4"
          >
            {trips.map((trip, i) => (
              <SwiperSlide key={trip.id}>
                <motion.div
                  initial={{ opacity: 0, y: 50, rotateX: 20 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                  whileHover={{ scale: 1.02, y: -10 }}
                  className="perspective-[1000px] h-full"
                >
                  <div className="shadow-card hover:shadow-card-hover transition-shadow duration-500 rounded-3xl h-full">
                    <TripCard trip={trip} />
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
}
