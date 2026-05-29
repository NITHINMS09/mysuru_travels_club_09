'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { HiOutlineArrowRight } from 'react-icons/hi';
import api from '@/lib/api';
import Link from 'next/link';

export default function FeaturedDestinations() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const data = await api.trips.getAll();
        // Extract unique destinations from real trips
        const tripsArray = Array.isArray(data?.trips) ? data.trips : [];
        const uniqueDests = tripsArray.reduce((acc: any[], trip: any) => {
          if (!acc.find(d => d.name === trip.destination)) {
            acc.push({
              name: trip.destination,
              image: trip.coverImage,
              trips: 1,
              colSpan: 'lg:col-span-1',
              rowSpan: 'lg:row-span-1'
            });
          } else {
            const index = acc.findIndex(d => d.name === trip.destination);
            acc[index].trips += 1;
          }
          return acc;
        }, []);
        setDestinations(uniqueDests.slice(0, 4));
      } catch (error) {
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  if (!loading && destinations.length === 0) return null;

  return (
    <section className="section-padding bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-primary-600 font-bold tracking-[0.3em] uppercase text-xs mb-4 block"
          >
            Curated For You
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title animate-fade-in"
          >
            Featured <span className="gradient-text">Destinations</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[400px]">
          {destinations.map((dest, i) => (
            <motion.div
              key={dest.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={dest.colSpan + " " + dest.rowSpan}
            >
              <Link
                href={`/trips?search=${dest.name}`}
                className="relative block w-full h-full min-h-[300px] overflow-hidden rounded-3xl group cursor-pointer"
              >
                <Image
                  src={dest.image}
                  alt={dest.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 p-8 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-[#FFFFFF] mb-1" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{dest.name}</h3>
                      <p className="text-white/60 text-sm font-medium">{dest.trips} Upcoming Trips</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <HiOutlineArrowRight className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
