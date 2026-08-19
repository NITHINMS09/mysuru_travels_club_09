'use client';

import { useMemo } from 'react';
import OptimizedImage from './OptimizedImage';
import Link from 'next/link';
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
  const tripTiming = useMemo(() => {
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const diffMs = startDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return {
        values: ['Live', '-', '-'],
        labels: ['Trip', '', ''],
        statusLabel: 'Open Now',
      };
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    return {
      values: [days.toString(), hours.toString(), minutes.toString()],
      labels: ['Days', 'Hrs', 'Min'],
      statusLabel: 'Limited Seats',
    };
  }, [trip.startDate]);

  return (
    <div
      className="glass-card-dark group flex flex-col h-full rounded-3xl overflow-hidden relative shadow-lg hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1.5 border border-white/5 hover:border-white/15 transition-all duration-500"
    >
      {/* Image Section */}
      <div className="relative h-48 sm:h-56 md:h-60 overflow-hidden">
        <OptimizedImage
          src={trip.coverImage}
          alt={trip.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/20 to-transparent opacity-90" />
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/10 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-md">
          {trip.category}
        </div>

        {/* Countdown */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div className="flex gap-1.5">
            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-slate-950/70 backdrop-blur-md border border-white/10 shadow-sm">
              <span className="text-[11px] font-black leading-none text-white">{tripTiming.values[0]}</span>
              <span className="text-[6.5px] font-bold uppercase text-white/50 tracking-wider">{tripTiming.labels[0]}</span>
            </div>
            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-slate-950/70 backdrop-blur-md border border-white/10 shadow-sm">
              <span className="text-[11px] font-black leading-none text-white">{tripTiming.values[1]}</span>
              <span className="text-[6.5px] font-bold uppercase text-white/50 tracking-wider">{tripTiming.labels[1]}</span>
            </div>
            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-slate-950/70 backdrop-blur-md border border-white/10 shadow-sm">
              <span className="text-[11px] font-black leading-none text-white">{tripTiming.values[2]}</span>
              <span className="text-[6.5px] font-bold uppercase text-white/50 tracking-wider">{tripTiming.labels[2]}</span>
            </div>
          </div>
          
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 backdrop-blur-md border border-amber-500/25 text-amber-500 text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
            <HiOutlineClock className="w-3.5 h-3.5" />
            {tripTiming.statusLabel}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 sm:p-6 flex flex-col flex-1 relative z-10 bg-transparent">
        <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-bold uppercase tracking-widest mb-2.5">
          <HiOutlineLocationMarker className="w-3.5 h-3.5 text-primary-400" />
          {trip.destination}
        </div>
        
        <h3 className="text-base sm:text-lg font-bold font-outfit text-white mb-3.5 line-clamp-2 leading-tight">
          {trip.title}
        </h3>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-slate-300 text-xs font-outfit">
            <HiOutlineCalendar className="w-4 h-4 text-primary-400" />
            {new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-xs font-outfit">
            <HiOutlineUserGroup className="w-4 h-4 text-primary-400" />
            {trip.availableSeats} / {trip.totalSeats} Seats
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <div className="text-[10px] text-slate-400 line-through">₹{trip.originalPrice || (trip.price * 1.2).toFixed(0)}</div>
            <div className="text-xl sm:text-2xl font-black text-[#00E676] font-outfit">₹{trip.price}</div>
          </div>
          
          <Link href={`/trips/${trip.id}`}>
            <button
              className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-primary-650 hover:border-primary-500 transition-all duration-300 shadow-md cursor-pointer"
            >
              <HiOutlineArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
