'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiOutlineSearch, HiOutlineTicket, HiOutlineCalendar, HiOutlineLocationMarker, HiArrowRight } from 'react-icons/hi';
import api from '@/lib/api';
import OptimizedImage from '@/components/shared/OptimizedImage';

export default function BookingPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingRef, setBookingRef] = useState('');
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    async function loadTrips() {
      try {
        const data = await api.trips.getAll({ upcomingOnly: 'true', limit: '6' });
        setTrips(data.trips || []);
      } catch (err) {
        console.error('Failed to load trips:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTrips();
  }, []);

  const handleTrackStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingRef.trim()) {
      setStatusError('Please enter a booking reference ID.');
      return;
    }
    setStatusError('');
    router.push(`/booking/status?ref=${bookingRef.trim().toUpperCase()}`);
  };

  return (
    <div className="pt-24 sm:pt-28 pb-16 sm:pb-24 bg-[#0B0F19] text-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-purple-500 font-bold text-sm tracking-widest uppercase mb-3 block">
            Start Your Journey
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-outfit leading-tight mb-6">
            Book Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">Adventure</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Choose from our premium curated upcoming tours below, or enter your booking reference to track an existing reservation status.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Upcoming Trips List (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-black font-outfit flex items-center gap-3">
              <HiOutlineCalendar className="text-purple-500 w-7 h-7" />
              Available Upcoming Expeditions
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-44 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : trips.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex flex-col sm:flex-row gap-6 p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-purple-500/30 transition-all duration-300 backdrop-blur-sm group"
                  >
                    {/* Thumbnail */}
                    <div className="w-full sm:w-44 h-32 relative rounded-xl overflow-hidden flex-shrink-0 bg-slate-900">
                      <OptimizedImage
                        src={trip.coverImage || '/images/trips/kottiyoor.png'}
                        alt={trip.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold uppercase tracking-wider">
                            {trip.category}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <HiOutlineLocationMarker className="w-3.5 h-3.5" />
                            {trip.destination}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold font-outfit text-white mb-2 line-clamp-1 group-hover:text-purple-400 transition-colors">
                          {trip.title}
                        </h3>
                        <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                          {trip.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div>
                          <span className="text-xs text-slate-500 block">Seat Price</span>
                          <span className="text-2xl font-black text-white">₹{trip.price}</span>
                        </div>
                        
                        <Link
                          href={`/trips/${trip.id}`}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/10 hover:shadow-purple-500/20 transition-all duration-200 cursor-pointer text-sm"
                        >
                          Book Now
                          <HiArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 p-8 rounded-2xl bg-slate-900/20 border border-slate-800/80">
                <p className="text-slate-500">No upcoming expeditions found at the moment.</p>
              </div>
            )}
          </div>

          {/* Booking Tracking Widget (Right 1 col) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800/60 backdrop-blur-md sticky top-28 shadow-2xl shadow-purple-950/10">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
              <HiOutlineTicket className="text-purple-500 w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black font-outfit text-white mb-3">
              Track Your Status
            </h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Enter the unique reference ID provided in your booking confirmation message (e.g., TN-XXXX-XXXX) to check payment approvals.
            </p>

            <form onSubmit={handleTrackStatus} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                  Reference ID
                </label>
                <input
                  type="text"
                  placeholder="TN-XXXXX-XXXX"
                  value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none transition-colors uppercase font-mono font-bold"
                />
              </div>

              {statusError && (
                <p className="text-red-500 text-xs font-semibold">{statusError}</p>
              )}

              <button
                type="submit"
                className="w-full h-12 bg-white text-slate-950 hover:bg-slate-100 font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                Track Status
                <HiArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
