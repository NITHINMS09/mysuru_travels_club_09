'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

export default function LatestUpdates() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await api.updates.getAll();
        setVideos(data || []);
      } catch (err) {
        console.error('Failed to fetch latest updates', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  if (loading || videos.length === 0) return null;

  return (
    <section className="py-16 bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 font-outfit uppercase tracking-tight">Latest Updates</h2>
          <div className="w-24 h-1.5 bg-primary-600 mx-auto mt-6 rounded-full" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video, index) => (
            <motion.div 
              key={video.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
            >
              <div className="relative aspect-[9/16] w-full bg-slate-900 overflow-hidden">
                <video 
                  src={video.videoUrl}
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <h3 className="text-white font-bold text-xl mb-2 leading-tight">{video.title}</h3>
                  {video.description && (
                    <p className="text-white/80 text-sm line-clamp-2">{video.description}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
