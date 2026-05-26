'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineLocationMarker, HiOutlineStar } from 'react-icons/hi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function MarketplaceManager() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const data = await api.marketplace.getAll();
      setListings(data.listings);
    } catch (error) {
      toast.error('Failed to load marketplace listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    try {
      await api.marketplace.delete(id, token);
      setListings(listings.filter(l => l.id !== id));
      toast.success('Listing deleted');
    } catch (err) {
      toast.error('Failed to delete listing');
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      category: formData.get('category'),
      title: formData.get('title'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price') as string),
      priceUnit: formData.get('priceUnit'),
      location: formData.get('location'),
      coverImage: formData.get('coverImage'),
      isAvailable: formData.get('isAvailable') === 'on'
    };
    try {
      const newListing = await api.marketplace.create(data, token);
      setListings([newListing, ...listings]);
      setIsModalOpen(false);
      toast.success('Marketplace listing created');
    } catch (err) {
      toast.error('Failed to create listing');
    }
  };

  if (loading) return <div className="text-slate-500 text-center py-20 animate-pulse">Loading Marketplace...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Premium Marketplace</h2>
          <p className="text-slate-500">Manage dynamic categories like Resorts, Car Rentals, Villas, and more.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus /> Add Listing
        </button>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50 text-slate-500 text-sm">
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-slate-700">
                  <td className="p-4">
                    <span className="px-3 py-1 bg-violet-50 text-violet-600 border border-violet-100 rounded-full text-xs font-bold uppercase">
                      {l.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-800">{l.title}</td>
                  <td className="p-4 text-slate-500 flex items-center gap-1"><HiOutlineLocationMarker /> {l.location}</td>
                  <td className="p-4 text-amber-700 font-mono font-bold">₹{l.price}/{l.priceUnit}</td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><HiOutlinePencil /></button>
                    <button onClick={() => handleDelete(l.id)} className="p-2 text-red-500/70 hover:text-red-600 transition-colors"><HiOutlineTrash /></button>
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No listings found. Add one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200/80 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-800">
            <h3 className="text-xl font-bold mb-6 text-slate-800">Create Marketplace Listing</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 mb-2">Category</label>
                  <select name="category" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" required>
                    <option value="RESORT">Resort</option>
                    <option value="CAR_RENTAL">Car Rental</option>
                    <option value="HOTEL">Hotel</option>
                    <option value="VILLA">Villa</option>
                    <option value="ROOM">Room</option>
                    <option value="ADVENTURE">Adventure</option>
                    <option value="TOUR_GUIDE">Tour Guide</option>
                    <option value="BIKE_RENTAL">Bike Rental</option>
                    <option value="HOMESTAY">Homestay</option>
                    <option value="LUXURY_STAY">Luxury Stay</option>
                    <option value="TRAVEL_PACKAGE">Travel Package</option>
                    <option value="CRUISE">Cruise</option>
                    <option value="EVENT">Event</option>
                  </select>
                </div>
                <div><label className="block text-sm text-slate-500 mb-2">Title</label><input name="title" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" required /></div>
                <div><label className="block text-sm text-slate-500 mb-2">Price (₹)</label><input name="price" type="number" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" required /></div>
                <div>
                  <label className="block text-sm text-slate-500 mb-2">Price Unit</label>
                  <select name="priceUnit" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" required>
                    <option value="per night">Per Night</option>
                    <option value="per day">Per Day</option>
                    <option value="per person">Per Person</option>
                    <option value="total">Total</option>
                  </select>
                </div>
                <div className="col-span-2"><label className="block text-sm text-slate-500 mb-2">Location</label><input name="location" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" required /></div>
                <div className="col-span-2"><label className="block text-sm text-slate-500 mb-2">Description</label><textarea name="description" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" rows={3} required /></div>
                <div className="col-span-2"><label className="block text-sm text-slate-500 mb-2">Cover Image URL</label><input name="coverImage" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" placeholder="https://..." required /></div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" name="isAvailable" id="isAvailable" defaultChecked className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                  <label htmlFor="isAvailable" className="text-sm text-slate-700">Available for Booking</label>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors font-medium text-slate-700">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Create Listing</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
