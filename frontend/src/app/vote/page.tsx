'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineThumbUp, HiOutlineChatAlt, HiOutlinePlus, HiX } from 'react-icons/hi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function VotePage() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestForm, setSuggestForm] = useState({
    name: '',
    description: '',
    suggestedBy: ''
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
      setSuggestForm({ name: '', description: '', suggestedBy: '' });
      fetchDestinations();
    } catch (err) {
      toast.error('Failed to suggest destination');
    }
  };

  return (
    <div className="pt-24 pb-20 bg-[#050816] min-h-screen text-white">
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
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-[#0a0e27] border border-white/10 rounded-3xl p-8 shadow-2xl"
              >
                <button onClick={() => setIsSuggesting(false)} className="absolute top-4 right-4 p-2 text-white/40 hover:text-white"><HiX className="w-6 h-6"/></button>
                <h3 className="text-2xl font-black mb-6">Suggest Destination</h3>
                <form onSubmit={handleSuggest} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Your Name</label>
                    <input 
                      required
                      type="text" 
                      className="input-field" 
                      value={suggestForm.suggestedBy}
                      onChange={e => setSuggestForm({...suggestForm, suggestedBy: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Destination Name</label>
                    <input 
                      required
                      type="text" 
                      className="input-field" 
                      value={suggestForm.name}
                      onChange={e => setSuggestForm({...suggestForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Description</label>
                    <textarea 
                      required
                      className="input-field h-24 resize-none" 
                      value={suggestForm.description}
                      onChange={e => setSuggestForm({...suggestForm, description: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full py-4 mt-4">Submit Suggestion</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-black mb-4">
              Where to <span className="gradient-text">Next?</span>
            </h1>
            <p className="text-white/40 max-w-xl">
              Tell us where you want TripNova to go next. Suggest destinations and vote for your favorites. 
              The most voted destination wins an upcoming expedition!
            </p>
          </div>
          
          <div className="glass-card p-6 flex flex-col sm:flex-row gap-4 items-center border-primary-500/20">
            <input 
              type="email" 
              placeholder="Your email to vote..." 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full sm:w-64 h-12"
            />
            <button 
              onClick={() => setIsSuggesting(true)}
              className="btn-primary h-12 whitespace-nowrap"
            >
              <HiOutlinePlus className="w-5 h-5" />
              Suggest New
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.sort((a, b) => b.voteCount - a.voteCount).map((dest, i) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 flex flex-col group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center text-2xl font-bold text-primary-400">
                    {i + 1}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black gradient-text">{dest.voteCount}</div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-white/40">Total Votes</div>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-3">{dest.name}</h3>
                <p className="text-white/60 text-sm mb-8 flex-1">{dest.description}</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest">By {dest.suggestedBy}</span>
                  <div className="flex gap-2">
                    <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:text-primary-400 transition-colors">
                      <HiOutlineChatAlt className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleVote(dest.id)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-500 shadow-glow transition-all"
                    >
                      <HiOutlineThumbUp className="w-5 h-5" />
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
