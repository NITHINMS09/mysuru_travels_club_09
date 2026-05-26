'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { HiOutlineUserGroup, HiOutlineGlobe, HiOutlineStar, HiOutlinePhotograph } from 'react-icons/hi';

const stats = [
  { label: 'Happy Travelers', value: 15000, suffix: '+', icon: HiOutlineUserGroup, color: 'text-purple-400', border: 'hover:border-purple-500/30', glow: 'from-purple-600 to-indigo-600' },
  { label: 'Destinations', value: 120, suffix: '+', icon: HiOutlineGlobe, color: 'text-cyan-400', border: 'hover:border-cyan-500/30', glow: 'from-cyan-500 to-blue-600' },
  { label: 'Positive Reviews', value: 98, suffix: '%', icon: HiOutlineStar, color: 'text-amber-400', border: 'hover:border-amber-500/30', glow: 'from-amber-500 to-yellow-500' },
  { label: 'Photos Shared', value: 50, suffix: 'K+', icon: HiOutlinePhotograph, color: 'text-pink-400', border: 'hover:border-pink-500/30', glow: 'from-pink-500 to-rose-500' },
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

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function Stats() {
  return (
    <section className="py-24 bg-[#030014] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-[450px] h-[450px] bg-accent-gold/5 rounded-full blur-[100px] pointer-events-none animate-float" />
      <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-primary-600/5 rounded-full blur-[100px] pointer-events-none animate-float-slow" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              viewport={{ once: true }}
              className={`glass-card p-8 flex flex-col items-center hover:bg-white/[0.03] transition-all duration-300 shadow-xl ${stat.border}`}
            >
              {/* Icon Container */}
              <div className="mb-5 flex justify-center">
                <div className={`w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center group-hover:scale-115 transition-transform duration-300 ${stat.color}`}>
                  <stat.icon className="w-6.5 h-6.5" />
                </div>
              </div>

              {/* Counter Number */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 180, damping: 12, delay: index * 0.08 }}
                className="text-4xl md:text-5xl font-black mb-3 font-outfit text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40"
              >
                <Counter value={stat.value} suffix={stat.suffix} />
              </motion.div>

              {/* Label */}
              <div className="text-xs md:text-sm text-white/50 font-bold uppercase tracking-widest font-outfit">
                {stat.label}
              </div>

              {/* Colorful gradient indicator at the bottom */}
              <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${stat.glow} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
