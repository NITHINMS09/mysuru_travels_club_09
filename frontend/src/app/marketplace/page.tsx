'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { HiOutlineSearch, HiOutlineLocationMarker, HiOutlineStar, HiOutlineInformationCircle } from 'react-icons/hi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const data = await api.marketplace.getAll({ category, query });
        setListings(data.listings);
      } catch (error) {
        toast.error('Failed to load marketplace listings');
      } finally {
        setLoading(false);
      }
    };
    
    // Add a slight debounce
    const timeout = setTimeout(fetchListings, 300);
    return () => clearTimeout(timeout);
  }, [category, query]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-20 sm:pt-28 pb-12 sm:pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header & Filters */}
        <div className="mb-8 sm:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 font-outfit">Premium <span className="gradient-text">Marketplace</span></h1>
            <p className="text-slate-500 text-lg">Discover exclusive stays, rides, and experiences.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search location or name..." 
                className="input-field pl-12 w-full sm:min-w-[250px] bg-white border border-slate-200"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select 
              className="input-field w-full sm:min-w-[200px] bg-white border border-slate-200 font-semibold text-slate-700"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="RESORT">Resorts</option>
              <option value="CAR_RENTAL">Car Rentals</option>
              <option value="HOTEL">Hotels</option>
              <option value="ROOM">Rooms</option>
              <option value="VILLA">Villas</option>
              <option value="ADVENTURE">Adventures</option>
              <option value="TOUR_GUIDE">Tour Guides</option>
              <option value="BIKE_RENTAL">Bike Rentals</option>
              <option value="HOMESTAY">Homestays</option>
              <option value="LUXURY_STAY">Luxury Stays</option>
              <option value="TRAVEL_PACKAGE">Travel Packages</option>
              <option value="CRUISE">Cruises</option>
              <option value="EVENT">Events</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200/60 rounded-3xl shadow-sm">
            <HiOutlineInformationCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2 font-outfit">No listings found</h3>
            <p className="text-slate-500">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {listings.map((listing, i) => (
              <motion.div 
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden border border-slate-100 group hover:border-primary-500/20 shadow-md hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
              >
                <div className="relative h-64 overflow-hidden">
                  <div className="absolute top-4 left-4 z-10 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white border border-white/10 shadow-sm">
                    {listing.category.replace('_', ' ')}
                  </div>
                  <div className="absolute top-4 right-4 z-10 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 text-accent-gold border border-white/10 shadow-sm">
                    <HiOutlineStar className="w-4 h-4 text-accent-gold" /> {listing.rating}
                  </div>
                  <img 
                    src={listing.coverImage || '/images/placeholder.jpg'} 
                    alt={listing.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                </div>
                
                <div className="p-4 sm:p-6 relative bg-white">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1 font-outfit">{listing.title}</h3>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
                    <HiOutlineLocationMarker className="w-4 h-4 text-primary-600" />
                    <span>{listing.location}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(listing.amenities || []).slice(0, 3).map((amenity: string, idx: number) => (
                      <span key={idx} className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md text-slate-600 font-semibold">
                        {amenity}
                      </span>
                    ))}
                    {listing.amenities?.length > 3 && (
                      <span className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md text-slate-600 font-semibold">
                        +{listing.amenities.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 mt-auto pt-4 border-t border-slate-100">
                    <div>
                      <span className="text-xl sm:text-2xl font-black text-slate-900">₹{listing.price.toLocaleString()}</span>
                      <span className="text-slate-400 text-sm ml-1">/{listing.priceUnit}</span>
                    </div>
                    <button 
                      onClick={() => toast.success('Booking feature coming soon!')}
                      className="btn-primary py-2 px-6 cursor-pointer"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex justify-center items-center"><div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <MarketplaceContent />
    </Suspense>
  );
}
