'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { HiOutlineUserGroup, HiOutlineMail, HiOutlinePhone } from 'react-icons/hi';
import { FaInstagram } from 'react-icons/fa';
import api from '@/lib/api';

export default function OurCrew() {
  const [crew, setCrew] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrew = async () => {
      try {
        const data = await api.crew.getAll();
        setCrew(data);
      } catch (err) {
        console.error('Failed to load crew', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCrew();
  }, []);

  if (loading || crew.length === 0) return null;

  return (
    <section className="py-24 bg-[#030014] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6 backdrop-blur-sm"
          >
            <HiOutlineUserGroup className="w-5 h-5 text-primary-400" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary-300">The Dream Team</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black mb-6 tracking-tight font-outfit"
          >
            Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-400 to-pink-500">Crew</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/60 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-outfit"
          >
            The passionate explorers, seasoned field guides, and logistics coordinators who orchestrate and lead your legendary trips.
          </motion.p>
        </div>

        {/* Crew Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {crew.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -8 }}
              className="group relative flex flex-col justify-between h-[480px] rounded-3xl bg-white/[0.02] border border-white/[0.06] hover:border-primary-500/30 hover:bg-white/[0.04] overflow-hidden transition-all duration-500 backdrop-blur-xl shadow-xl hover:shadow-primary-500/5"
            >
              {/* Profile Image Container */}
              <div className="relative h-60 w-full overflow-hidden">
                {member.image ? (
                  <Image 
                    src={member.image} 
                    alt={member.name} 
                    fill 
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    priority={i < 4}
                  />
                ) : (
                  <div className="w-full h-full bg-white/[0.03] flex items-center justify-center text-white/10 font-bold">No Image</div>
                )}
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#030014] via-transparent to-transparent opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent opacity-40" />
              </div>

              {/* Info & Content */}
              <div className="p-6 flex-1 flex flex-col justify-between relative z-10">
                <div>
                  <h3 className="text-xl font-bold font-outfit text-white group-hover:text-primary-300 transition-colors duration-300 mb-1">{member.name}</h3>
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400 text-xs font-semibold uppercase tracking-widest mb-3">{member.role}</p>
                  
                  {/* Short Description */}
                  <p className="text-white/50 text-sm font-outfit line-clamp-3 leading-relaxed">
                    {member.description || "A professional guide committed to showing you the best views, secret paths, and local heritage."}
                  </p>
                </div>

                {/* Social media / contact icons */}
                {(member.contact || member.instagram) && (
                  <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center gap-3">
                    {member.contact && (
                      <a 
                        href={member.contact.includes('@') ? `mailto:${member.contact}` : `tel:${member.contact}`} 
                        className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/60 hover:text-white hover:bg-primary-600 hover:border-primary-500 transition-all duration-300"
                        title={member.contact}
                      >
                        {member.contact.includes('@') ? <HiOutlineMail className="w-4 h-4" /> : <HiOutlinePhone className="w-4 h-4" />}
                      </a>
                    )}
                    {member.instagram && (
                      <a 
                        href={`https://instagram.com/${member.instagram.replace('@', '')}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/60 hover:text-white hover:bg-pink-600 hover:border-pink-500 transition-all duration-300"
                        title="Instagram"
                      >
                        <FaInstagram className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Glowing Bottom Line on Hover */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
