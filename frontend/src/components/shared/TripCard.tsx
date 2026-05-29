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
    <div
      className="glass-card group flex flex-col h-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-lg"
    >
      {/* Image Section */}
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
        {trip.coverImage ? (
          <Image
            src={trip.coverImage}
            alt={trip.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">No Cover Image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent opacity-90" />
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-slate-800 backdrop-blur-md border border-white/[0.1] text-[9px] font-extrabold uppercase tracking-wider text-white shadow-md">
          {trip.category}
        </div>

        {/* Countdown */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div className="flex gap-1.5">
            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-slate-950/60 backdrop-blur-md border border-white/[0.08]">
              <span className="text-[11px] font-black leading-none text-white">{timeLeft.days}</span>
              <span className="text-[6.5px] font-bold uppercase text-white/50 tracking-wider">Days</span>
            </div>
            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-slate-950/60 backdrop-blur-md border border-white/[0.08]">
              <span className="text-[11px] font-black leading-none text-white">{timeLeft.hours}</span>
              <span className="text-[6.5px] font-bold uppercase text-white/50 tracking-wider">Hrs</span>
            </div>
            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-slate-950/60 backdrop-blur-md border border-white/[0.08]">
              <span className="text-[11px] font-black leading-none text-white">{timeLeft.minutes}</span>
              <span className="text-[6.5px] font-bold uppercase text-white/50 tracking-wider">Min</span>
            </div>
          </div>
          
          <div className="px-3 py-1.5 rounded-xl bg-accent-gold/15 backdrop-blur-md border border-accent-gold/30 text-accent-gold text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            <HiOutlineClock className="w-3.5 h-3.5" />
            Limited Seats
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-6 flex flex-col flex-1 relative z-10 bg-slate-900">
        <div className="flex items-center gap-1.5 text-[#FFFFFF] text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          <HiOutlineLocationMarker className="w-3.5 h-3.5 text-[#FFFFFF]" />
          {trip.destination}
        </div>
        
        <h3 className="text-base sm:text-xl font-bold font-outfit text-[#FFFFFF] mb-3.5 line-clamp-2 sm:line-clamp-1 leading-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {trip.title}
        </h3>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6 pt-1 border-t border-slate-800">
          <div className="flex items-center gap-2 text-slate-300 text-xs font-outfit">
            <HiOutlineCalendar className="w-4 h-4 text-primary-400" />
            {new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-xs font-outfit">
            <HiOutlineUserGroup className="w-4 h-4 text-primary-400" />
            {trip.availableSeats} / {trip.totalSeats} Seats
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 line-through">₹{trip.originalPrice || (trip.price * 1.2).toFixed(0)}</div>
            <div className="text-xl sm:text-2xl font-black text-[#00C853] font-outfit">₹{trip.price}</div>
          </div>
          
          <Link href={`/trips/${trip.id}`}>
            <button
              className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300"
            >
              <HiOutlineArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
