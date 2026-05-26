'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineX, HiOutlinePlus, HiOutlineTrash, HiOutlineClock, HiOutlineLocationMarker } from 'react-icons/hi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface CreateTripModalProps {
  onClose: () => void;
  onSuccess: () => void;
  trip?: any;
}

export default function CreateTripModal({ onClose, onSuccess, trip }: CreateTripModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: trip?.title || '',
    destination: trip?.destination || '',
    description: trip?.description || '',
    price: trip?.price?.toString() || '',
    originalPrice: trip?.originalPrice?.toString() || '',
    startDate: trip?.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : '',
    endDate: trip?.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : '',
    totalSeats: trip?.totalSeats?.toString() || '',
    coverImage: trip?.coverImage || '',
    category: trip?.category || 'Adventure',
    difficulty: trip?.difficulty || 'Easy',
    latitude: trip?.latitude?.toString() || '',
    longitude: trip?.longitude?.toString() || ''
  });

  const [pickupPoints, setPickupPoints] = useState<{ location: string; time: string }[]>(
    trip?.pickupPoints && Array.isArray(trip.pickupPoints) && trip.pickupPoints.length > 0
      ? trip.pickupPoints
      : [{ location: '', time: '' }]
  );

  const addPickupPoint = () => setPickupPoints([...pickupPoints, { location: '', time: '' }]);
  const removePickupPoint = (index: number) => setPickupPoints(pickupPoints.filter((_, i) => i !== index));
  const updatePickupPoint = (index: number, field: 'location' | 'time', value: string) => {
    const newPoints = [...pickupPoints];
    newPoints[index][field] = value;
    setPickupPoints(newPoints);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) {
      toast.error('Admin token missing. Please log in again.');
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.destination.trim()) {
      toast.error('Destination is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Price must be a valid number greater than 0');
      return;
    }
    const seatsNum = parseInt(formData.totalSeats);
    if (isNaN(seatsNum) || seatsNum <= 0) {
      toast.error('Seats must be a valid number greater than 0');
      return;
    }
    if (!formData.startDate) {
      toast.error('Start date is required');
      return;
    }
    if (!formData.endDate) {
      toast.error('End date is required');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date cannot be before start date');
      return;
    }
    if (!formData.coverImage.trim()) {
      toast.error('Cover image URL is required');
      return;
    }

    try {
      setLoading(true);

      const submissionData: any = {
        title: formData.title.trim(),
        destination: formData.destination.trim(),
        description: formData.description.trim(),
        price: priceNum,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        totalSeats: seatsNum,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        category: formData.category,
        difficulty: formData.difficulty,
        coverImage: formData.coverImage.trim(),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        pickupPoints: pickupPoints.filter(p => p.location.trim() && p.time.trim()),
      };

      if (trip) {
        // Keep existing fields on update so they don't get cleared
        submissionData.itinerary = trip.itinerary || [];
        submissionData.images = trip.images || [];
        submissionData.included = trip.included || [];
        submissionData.excluded = trip.excluded || [];
        
        await api.trips.update(trip.id, submissionData, token);
        toast.success('Trip updated successfully!');
      } else {
        // Initialize fields for new trip
        submissionData.availableSeats = seatsNum;
        submissionData.itinerary = [];
        submissionData.images = [];
        submissionData.included = [];
        submissionData.excluded = [];

        await api.trips.create(submissionData, token);
        toast.success('Trip created successfully!');
      }
      
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-3xl bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xl text-slate-800">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-800">{trip ? 'Edit Trip & Define Logistics' : 'Create Trip & Define Logistics'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><HiOutlineX className="w-6 h-6 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Trip Title</label>
              <input required placeholder="Trip Title" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Destination Name</label>
              <input required placeholder="Destination Name" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Trip Description</label>
            <textarea required placeholder="Write a detailed trip description..." rows={4} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 py-3 min-h-[100px] resize-y" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          {/* Pricing & Seats & Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Price (₹)</label>
              <input required type="number" placeholder="Price" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Original Price (₹)</label>
              <input type="number" placeholder="Original Price" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Seats</label>
              <input required type="number" placeholder="Seats" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={formData.totalSeats} onChange={e => setFormData({...formData, totalSeats: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Difficulty</label>
              <select className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})}>
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Difficult">Difficult</option>
                <option value="Extreme">Extreme</option>
              </select>
            </div>
          </div>

          {/* Category & Cover Image */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Category</label>
              <input type="text" placeholder="Category" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Cover Image URL</label>
              <input required placeholder="Cover Image URL" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={formData.coverImage} onChange={e => setFormData({...formData, coverImage: e.target.value})} />
            </div>
          </div>

          {/* Pickup Points & Timings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-violet-600">Boarding Stops & Arrival Times</label>
              <button type="button" onClick={addPickupPoint} className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 hover:text-slate-900 transition-colors">
                <HiOutlinePlus className="w-3 h-3" /> Add Stop
              </button>
            </div>
            <div className="space-y-3">
              {pickupPoints.map((point, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
                  <div className="flex-1 relative">
                    <HiOutlineLocationMarker className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input placeholder="Boarding Stop" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 pl-10 text-sm" value={point.location} onChange={e => updatePickupPoint(index, 'location', e.target.value)} />
                  </div>
                  <div className="w-40 relative">
                    <HiOutlineClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input placeholder="Time" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 pl-10 text-sm" value={point.time} onChange={e => updatePickupPoint(index, 'time', e.target.value)} />
                  </div>
                  {pickupPoints.length > 1 && (
                    <button type="button" onClick={() => removePickupPoint(index)} className="p-3 text-red-500/70 hover:text-red-600"><HiOutlineTrash className="w-5 h-5" /></button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Map Coordinates (Optional for Map Preview) */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Destination Coordinates (for Google Maps)</label>
            <div className="grid grid-cols-2 gap-6">
              <input type="number" step="any" placeholder="Latitude" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-sm" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} />
              <input type="number" step="any" placeholder="Longitude" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-sm" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Start Date</label>
              <input required type="date" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">End Date</label>
              <input required type="date" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-bold text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary px-12">{loading ? (trip ? 'Updating...' : 'Launching...') : (trip ? 'Save Changes' : 'Launch Trip')}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
