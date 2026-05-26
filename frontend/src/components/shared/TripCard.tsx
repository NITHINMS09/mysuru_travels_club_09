'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiOutlineCalendar, HiOutlineClock, HiOutlineUserGroup, HiOutlineLocationMarker, HiOutlineArrowRight } from 'react-icons/hi';

interface TripCardProps {
  trip: {
    id: string;
    title: string;
    slug: string;
    coverImage: string;
    destination: string;
    price: number;
    originalPrice?: number;
    startDate: string;
    availableSeats: number;
    totalSeats: number;
    category: string;
    difficulty: string;
  };
}

export default function TripCard({ trip }: TripCardProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date(trip.startDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [trip.startDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card group h-full flex flex-col"
    >
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src={trip.coverImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1000'}
          alt={trip.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-wider text-white">
          {trip.category}
        </div>

        {/* Countdown */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
          <div className="flex gap-2">
            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-black/40 backdrop-blur-md border border-white/10">
              <span className="text-xs font-bold leading-none">{timeLeft.days}</span>
              <span className="text-[8px] uppercase opacity-60">Days</span>
            </div>
            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-black/40 backdrop-blur-md border border-white/10">
              <span className="text-xs font-bold leading-none">{timeLeft.hours}</span>
              <span className="text-[8px] uppercase opacity-60">Hrs</span>
            </div>
            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-black/40 backdrop-blur-md border border-white/10">
              <span className="text-xs font-bold leading-none">{timeLeft.minutes}</span>
              <span className="text-[8px] uppercase opacity-60">Min</span>
            </div>
          </div>
          
          <div className="px-3 py-1.5 rounded-lg bg-accent-gold/20 backdrop-blur-md border border-accent-gold/30 text-accent-gold text-[10px] font-bold flex items-center gap-1">
            <HiOutlineClock className="w-3 h-3" />
            Limited Seats
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-accent-cyan text-[10px] font-bold uppercase tracking-widest mb-2">
          <HiOutlineLocationMarker className="w-3 h-3" />
          {trip.destination}
        </div>
        
        <h3 className="text-xl font-bold mb-3 group-hover:text-primary-400 transition-colors">
          {trip.title}
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <HiOutlineCalendar className="w-4 h-4 text-primary-400" />
            {new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <HiOutlineUserGroup className="w-4 h-4 text-primary-400" />
            {trip.availableSeats} / {trip.totalSeats} Seats
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div>
            <div className="text-[10px] text-white/40 line-through">₹{trip.originalPrice || (trip.price * 1.2).toFixed(0)}</div>
            <div className="text-2xl font-black gradient-text">₹{trip.price}</div>
          </div>
          
          <Link href={`/trips/${trip.id}`}>
            <motion.button
              whileHover={{ x: 5 }}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary-500/20 hover:border-primary-500/50 transition-all"
            >
              <HiOutlineArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}


