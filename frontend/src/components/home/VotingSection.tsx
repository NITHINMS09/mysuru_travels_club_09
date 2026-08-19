'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineThumbUp, HiOutlineArrowRight } from 'react-icons/hi';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function VotingSection() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const data = await api.votes.getDestinations();
        setDestinations(Array.isArray(data) ? data.slice(0, 3) : (data.destinations || []).slice(0, 3));
      } catch (err) {
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    };
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

  if (!loading && destinations.length === 0) return null;

  return (
    <section className="section-padding bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/5 rounded-full blur-[100px]" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-primary-600 font-bold tracking-[0.3em] uppercase text-xs mb-4 block"
            >
              Community Choice
            </motion.span>
            <h2 className="section-title mb-0">Where to <span className="gradient-text">Next?</span></h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input 
              type="email" 
              placeholder="Your email to vote..." 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full sm:w-64 h-12"
            />
            <Link href="/vote" className="text-primary-600 hover:text-primary-500 font-bold text-sm flex items-center gap-2 transition-colors">
              View All <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {destinations.map((dest, i) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 hover:border-primary-500/35 hover:shadow-2xl hover:shadow-slate-200/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="text-3xl font-black gradient-text">{dest.voteCount}</div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Votes</div>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-3 font-outfit">{dest.name}</h3>
                <p className="text-slate-500 text-sm mb-8 line-clamp-3 leading-relaxed font-outfit">{dest.description}</p>
              </div>
              
              <button 
                onClick={() => handleVote(dest.id)}
                className="w-full py-3.5 px-4 rounded-xl bg-white/40 border border-slate-200/50 text-slate-700 flex items-center justify-center gap-2 font-bold hover:bg-gradient-to-r hover:from-primary-600 hover:to-purple-600 hover:text-white hover:border-transparent transition-all duration-300 group shadow-sm hover:shadow-md cursor-pointer"
              >
                <HiOutlineThumbUp className="w-5 h-5 text-primary-500 group-hover:text-white group-hover:scale-110 transition-all" />
                Vote Now
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
