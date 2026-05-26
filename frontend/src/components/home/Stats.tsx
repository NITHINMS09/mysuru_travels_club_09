'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { HiOutlineUserGroup, HiOutlineGlobe, HiOutlineStar, HiOutlinePhotograph } from 'react-icons/hi';

const stats = [
  { label: 'Happy Travelers', value: 15000, suffix: '+', icon: HiOutlineUserGroup, color: 'text-purple-500' },
  { label: 'Destinations', value: 120, suffix: '+', icon: HiOutlineGlobe, color: 'text-cyan-500' },
  { label: 'Positive Reviews', value: 98, suffix: '%', icon: HiOutlineStar, color: 'text-gold-500' },
  { label: 'Photos Shared', value: 50, suffix: 'K+', icon: HiOutlinePhotograph, color: 'text-pink-500' },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2000;
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function Stats() {
  return (
    <section className="section-padding bg-black relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-gold/5 rounded-full blur-[100px] mix-blend-screen animate-float pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] mix-blend-screen animate-float-slow pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="mb-4 flex justify-center">
                <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${stat.color}`}>
                  <stat.icon className="w-7 h-7" />
                </div>
              </div>
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10, delay: index * 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 font-outfit"
              >
                <Counter value={stat.value} suffix={stat.suffix} />
              </motion.div>
              <div className="text-sm md:text-base text-white/50 font-medium uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
