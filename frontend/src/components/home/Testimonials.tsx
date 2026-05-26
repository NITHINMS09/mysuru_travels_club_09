'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { HiOutlineStar } from 'react-icons/hi';
import { RiDoubleQuotesL } from 'react-icons/ri';
import api from '@/lib/api';

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd fetch featured reviews
    // For now, we'll keep it empty as per user's request to remove "fake" data
    const fetchReviews = async () => {
      try {
        // You can fetch reviews for a specific trip or general reviews here
        // const data = await api.reviews.getAll(); 
        setTestimonials([]);
      } catch (error) {
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (!loading && testimonials.length === 0) return null;

  return (
    <section className="section-padding bg-black relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title"
          >
            What Our <span className="gradient-text">Explorers Say</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-8 flex flex-col"
            >
              <RiDoubleQuotesL className="text-primary-500 text-5xl mb-6 opacity-40" />

              <p className="text-white/80 italic mb-8 leading-relaxed">
                "{testi.comment}"
              </p>

              <div className="mt-auto flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary-500/30">
                  {testi.avatar ? (
                    <Image src={testi.avatar} alt={testi.userName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-600/20 flex items-center justify-center font-bold text-xs">
                      {testi.userName?.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{testi.userName}</h4>
                  <p className="text-white/40 text-xs">Explorer</p>
                </div>
                <div className="ml-auto flex gap-0.5 text-accent-gold">
                  {[...Array(5)].map((_, j) => (
                    <HiOutlineStar key={j} className={`w-3 h-3 ${j < testi.rating ? 'fill-current' : 'opacity-20'}`} />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
