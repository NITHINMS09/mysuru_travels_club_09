'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineThumbUp, HiOutlineChatAlt, HiOutlinePlus, HiX } from 'react-icons/hi';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ImageUploader from '@/components/shared/ImageUploader';

export default function VotePage() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestForm, setSuggestForm] = useState({
    name: '',
    description: '',
    suggestedBy: '',
    imageUrl: ''
  });

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const data = await api.votes.getDestinations();
      setDestinations(Array.isArray(data) ? data : data.destinations || []);
    } catch (err) {
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const handleVote = async (id: string) => {
    if (!email) {
      toast.error('Please enter your email to vote');
      return;
    }
    try {
      await api.votes.vote(id, email);
      toast.success('Vote recorded!');
      setDestinations(prev => prev.map(d => d.id === id ? { ...d, voteCount: d.voteCount + 1 } : d));
    } catch (err: any) {
      toast.error(err.message || 'Failed to vote');
    }
  };

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.votes.suggest(suggestForm);
      toast.success('Destination suggested!');
      setIsSuggesting(false);
      setSuggestForm({ name: '', description: '', suggestedBy: '', imageUrl: '' });
      fetchDestinations();
    } catch (err) {
      toast.error('Failed to suggest destination');
    }
  };

  return (
    <div className="pt-20 sm:pt-24 pb-12 sm:pb-20 bg-[#f8fafc] min-h-screen text-slate-900">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Suggest Modal */}
        <AnimatePresence>
          {isSuggesting && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setIsSuggesting(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 shadow-2xl text-slate-900"
              >
                <button onClick={() => setIsSuggesting(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 cursor-pointer"><HiX className="w-6 h-6"/></button>
                <h3 className="text-2xl font-black mb-6 font-outfit">Suggest Destination</h3>
                <form onSubmit={handleSuggest} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Name</label>
                    <input 
                      required
                      type="text" 
                      className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" 
                      value={suggestForm.suggestedBy}
                      onChange={e => setSuggestForm({...suggestForm, suggestedBy: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Destination Name</label>
                    <input 
                      required
                      type="text" 
                      className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" 
                      value={suggestForm.name}
                      onChange={e => setSuggestForm({...suggestForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</label>
                    <textarea 
                      required
                      className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 h-24 resize-none" 
                      value={suggestForm.description}
                      onChange={e => setSuggestForm({...suggestForm, description: e.target.value})}
                    />
                  </div>
                  <div className="py-2">
                    <ImageUploader
                      value={suggestForm.imageUrl}
                      onChange={url => setSuggestForm({...suggestForm, imageUrl: url})}
                      label="Upload Destination Photo (Optional)"
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full py-4 mt-4 cursor-pointer">Submit Suggestion</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-16 gap-6 sm:gap-8">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 mb-4 font-outfit">
              Where to <span className="gradient-text">Next?</span>
            </h1>
            <p className="text-slate-500 max-w-xl">
              Tell us where you want TripNova to go next. Suggest destinations and vote for your favorites. 
              The most voted destination wins an upcoming expedition!
            </p>
          </div>
          
          <div className="glass-card p-6 flex flex-col sm:flex-row gap-4 items-center bg-white border border-slate-200/60 shadow-md">
            <input 
              type="email" 
              placeholder="Your email to vote..." 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full sm:w-64 h-12 bg-white border border-slate-200"
            />
            <button 
              onClick={() => setIsSuggesting(true)}
              className="btn-primary h-12 whitespace-nowrap cursor-pointer"
            >
              <HiOutlinePlus className="w-5 h-5 text-white" />
              Suggest New
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {destinations.sort((a, b) => b.voteCount - a.voteCount).map((dest, i) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card bg-white border border-slate-100 shadow-md hover:shadow-xl hover:shadow-slate-200/50 p-5 sm:p-8 flex flex-col group rounded-3xl overflow-hidden"
              >
                {dest.imageUrl && (
                  <div className="relative aspect-video w-full mb-6 overflow-hidden rounded-2xl border border-slate-200/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover" />
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600 shadow-sm">
                    {i + 1}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black gradient-text">{dest.voteCount}</div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Votes</div>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-3 font-outfit">{dest.name}</h3>
                <p className="text-slate-500 text-sm mb-8 flex-1 leading-relaxed">{dest.description}</p>
                
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 sm:pt-6 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">By {dest.suggestedBy}</span>
                  <div className="flex gap-2">
                    <button className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-primary-600 hover:bg-slate-100/50 transition-colors cursor-pointer">
                      <HiOutlineChatAlt className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleVote(dest.id)}
                      className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white text-sm sm:text-base font-bold hover:from-primary-500 hover:to-purple-500 shadow-glow transition-all cursor-pointer"
                    >
                      <HiOutlineThumbUp className="w-5 h-5 text-white" />
                      Vote
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
