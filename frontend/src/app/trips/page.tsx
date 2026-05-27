'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineFilter, HiOutlineSearch, HiX } from 'react-icons/hi';
import TripCard from '@/components/shared/TripCard';
import api from '@/lib/api';

export default function TripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['All', 'Adventure', 'Leisure', 'Biking', 'Relaxation', 'Cultural'];

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const data = await api.trips.getAll();
        setTrips(data.trips || []);
        setFilteredTrips(data.trips || []);
      } catch (error) {
        console.error('Failed to fetch trips:', error);
        // Fallback demo data
        const demoTrips = [
          {
            id: '1',
            title: 'Spiti Valley Winter Expedition',
            slug: 'spiti-winter',
            coverImage: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80&w=1000',
            destination: 'Himachal Pradesh',
            price: 18500,
            originalPrice: 22000,
            startDate: new Date(Date.now() + 86400000 * 10).toISOString(),
            availableSeats: 8,
            totalSeats: 12,
            category: 'Adventure',
            difficulty: 'Hard'
          },
          {
            id: '2',
            title: 'Bali Island Hopping Retreat',
            slug: 'bali-retreat',
            coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=1000',
            destination: 'Indonesia',
            price: 45000,
            originalPrice: 55000,
            startDate: new Date(Date.now() + 86400000 * 25).toISOString(),
            availableSeats: 5,
            totalSeats: 10,
            category: 'Leisure',
            difficulty: 'Easy'
          },
          {
            id: '3',
            title: 'Ladakh Bike Trip 2024',
            slug: 'ladakh-bike',
            coverImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1000',
            destination: 'Ladakh',
            price: 32000,
            originalPrice: 38000,
            startDate: new Date(Date.now() + 86400000 * 40).toISOString(),
            availableSeats: 12,
            totalSeats: 20,
            category: 'Biking',
            difficulty: 'Moderate'
          }
        ];
        setTrips(demoTrips);
        setFilteredTrips(demoTrips);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  useEffect(() => {
    let result = trips;
    
    if (activeCategory !== 'All') {
      result = result.filter(t => t.category === activeCategory);
    }
    
    if (search) {
      result = result.filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.destination.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setFilteredTrips(result);
  }, [search, activeCategory, trips]);

  return (
    <div className="pt-20 sm:pt-24 pb-12 sm:pb-20 bg-[#f8fafc] min-h-screen text-slate-900">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 sm:mb-12 gap-6 sm:gap-8">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 font-outfit">
              Explore Our <span className="gradient-text">Trips</span>
            </h1>
            <p className="text-slate-500 max-w-xl font-inter">
              From the highest peaks to the deepest oceans, find your next unforgettable journey here.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="relative w-full sm:w-80">
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-12 h-12 bg-white border border-slate-200"
              />
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 h-12 rounded-xl border font-bold transition-all cursor-pointer ${
                showFilters 
                  ? 'bg-primary-600 border-primary-500 text-white shadow-md' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <HiOutlineFilter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-12"
            >
              <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200/60 shadow-lg flex flex-wrap gap-2 sm:gap-4">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest w-full mb-2">Category</span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      activeCategory === cat 
                        ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-glow' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100/50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trips Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[500px] rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredTrips.map((trip) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
              >
                <TripCard trip={trip} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
              <HiX className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No trips found</h3>
            <p className="text-slate-500">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}
