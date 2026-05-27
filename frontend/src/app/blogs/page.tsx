'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { HiOutlineCalendar, HiOutlineEye, HiOutlineSearch } from 'react-icons/hi';
import api from '@/lib/api';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await api.blogs.getAll();
        setBlogs(data.blogs);
      } catch (err) {
        // Fallback demo
        setBlogs([
          {
            id: '1',
            title: '10 Essential Items for Your Next Trek',
            excerpt: 'Packing for a trek can be tricky. We’ve rounded up the must-haves for your safety and comfort.',
            image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&q=80&w=1000',
            date: 'May 12, 2024',
            views: '1.2k',
            slug: 'essential-trek-items',
            tags: ['Trekking', 'Gear', 'Guide']
          },
          {
            id: '2',
            title: 'Why Group Travel is the New Luxury',
            excerpt: 'Discover why more people are choosing curated group experiences over solo luxury travel.',
            image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80&w=1000',
            date: 'May 08, 2024',
            views: '850',
            slug: 'group-travel-luxury',
            tags: ['Lifestyle', 'Community']
          },
          {
            id: '3',
            title: 'Sustainable Travel: A Beginners Guide',
            excerpt: 'How to reduce your carbon footprint while exploring the worlds most beautiful destinations.',
            image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1000',
            date: 'May 05, 2024',
            views: '2.1k',
            slug: 'sustainable-travel-guide',
            tags: ['Eco', 'Sustainability']
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="pt-20 sm:pt-24 pb-12 sm:pb-20 bg-[#f8fafc] min-h-screen text-slate-900">
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="text-center mb-10 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 mb-4 sm:mb-6 font-outfit">
            Travel <span className="gradient-text">Journal</span>
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Discover stories, tips, and insights from our team of global explorers. 
            Your guide to the extraordinary.
          </p>
        </div>

        {/* Featured Post */}
        {!loading && blogs[0] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card bg-white border border-slate-100 shadow-lg mb-10 sm:mb-16 overflow-hidden flex flex-col lg:flex-row group cursor-pointer"
          >
            <div className="relative w-full lg:w-3/5 h-56 sm:h-80 lg:h-[500px]">
              <Image src={blogs[0].image} alt={blogs[0].title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="p-5 sm:p-8 lg:p-16 lg:w-2/5 flex flex-col justify-center bg-white border-l border-slate-50">
              <div className="flex gap-2 mb-6">
                {blogs[0].tags?.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-4 sm:mb-6 group-hover:text-primary-600 transition-colors font-outfit">
                {blogs[0].title}
              </h2>
              <p className="text-slate-500 mb-10 leading-relaxed">
                {blogs[0].excerpt}
              </p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><HiOutlineCalendar className="w-4 h-4 text-primary-500" /> {blogs[0].date}</span>
                  <span className="flex items-center gap-1.5"><HiOutlineEye className="w-4 h-4 text-primary-500" /> {blogs[0].views}</span>
                </div>
                <Link href={`/blogs/${blogs[0].slug}`} className="text-accent-gold font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                  Read More →
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {blogs.slice(1).map((blog, i) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card bg-white border border-slate-100 shadow-md hover:shadow-xl hover:shadow-slate-200/50 flex flex-col group cursor-pointer"
            >
              <div className="relative h-64 overflow-hidden">
                <Image src={blog.image} alt={blog.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="p-5 sm:p-8 flex flex-col flex-1">
                <div className="flex gap-2 mb-4">
                  {blog.tags?.map((tag: string) => (
                    <span key={tag} className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{tag}</span>
                  ))}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-primary-600 transition-colors line-clamp-2 font-outfit">{blog.title}</h3>
                <p className="text-slate-500 text-sm mb-8 line-clamp-3">{blog.excerpt}</p>
                <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{blog.date}</span>
                   <Link href={`/blogs/${blog.slug}`} className="text-accent-gold font-bold uppercase tracking-widest text-[10px]">
                    Read Article →
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
