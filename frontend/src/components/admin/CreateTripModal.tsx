'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineX, HiOutlinePlus, HiOutlineTrash, HiOutlineClock, HiOutlineLocationMarker } from 'react-icons/hi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface CreateTripModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTripModal({ onClose, onSuccess }: CreateTripModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    description: '',
    price: '',
    originalPrice: '',
    startDate: '',
    endDate: '',
    totalSeats: '',
    coverImage: '',
    category: 'Adventure',
    difficulty: 'Moderate',
    latitude: '',
    longitude: ''
  });

  const [pickupPoints, setPickupPoints] = useState<{ location: string; time: string }[]>([
    { location: '', time: '' }
  ]);

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
    if (!token) return;

    try {
      setLoading(true);
      const submissionData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        totalSeats: parseInt(formData.totalSeats),
        availableSeats: parseInt(formData.totalSeats),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        itinerary: [],
        pickupPoints: pickupPoints.filter(p => p.location && p.time),
        images: [],
        included: [],
        excluded: []
      };

      await api.trips.create(submissionData, token);
      toast.success('Trip created successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-3xl bg-[#0a0e27] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-black">Create Trip & Define Logistics</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg"><HiOutlineX className="w-6 h-6 text-white/40" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input required placeholder="Trip Title" className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input required placeholder="Destination Name" className="input-field" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} />
          </div>

          {/* Pricing & Seats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input required type="number" placeholder="Price (₹)" className="input-field" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            <input required type="number" placeholder="Seats" className="input-field" value={formData.totalSeats} onChange={e => setFormData({...formData, totalSeats: e.target.value})} />
            <input type="text" placeholder="Category" className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
          </div>

          {/* Pickup Points & Timings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-primary-400">Boarding Stops & Arrival Times</label>
              <button type="button" onClick={addPickupPoint} className="flex items-center gap-1 text-[10px] uppercase font-bold text-white/40 hover:text-white transition-colors">
                <HiOutlinePlus className="w-3 h-3" /> Add Stop
              </button>
            </div>
            <div className="space-y-3">
              {pickupPoints.map((point, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
                  <div className="flex-1 relative">
                    <HiOutlineLocationMarker className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input placeholder="Location (e.g. Borivali Station)" className="input-field pl-10 text-sm" value={point.location} onChange={e => updatePickupPoint(index, 'location', e.target.value)} />
                  </div>
                  <div className="w-40 relative">
                    <HiOutlineClock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input placeholder="Time (e.g. 05:30 AM)" className="input-field pl-10 text-sm" value={point.time} onChange={e => updatePickupPoint(index, 'time', e.target.value)} />
                  </div>
                  {pickupPoints.length > 1 && (
                    <button type="button" onClick={() => removePickupPoint(index)} className="p-3 text-red-400/50 hover:text-red-400"><HiOutlineTrash className="w-5 h-5" /></button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Map Coordinates (Optional for Map Preview) */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-white/40">Destination Coordinates (for Google Maps)</label>
            <div className="grid grid-cols-2 gap-6">
              <input type="number" step="any" placeholder="Latitude" className="input-field text-sm" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} />
              <input type="number" step="any" placeholder="Longitude" className="input-field text-sm" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input required type="date" className="input-field" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            <input required type="date" className="input-field" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
          </div>

          <input required placeholder="Cover Image URL" className="input-field" value={formData.coverImage} onChange={e => setFormData({...formData, coverImage: e.target.value})} />

          <div className="flex justify-end gap-4 pt-6">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-bold text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary px-12">{loading ? 'Creating...' : 'Launch Trip'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
