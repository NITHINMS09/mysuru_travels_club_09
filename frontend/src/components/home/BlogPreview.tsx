'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { HiOutlineArrowRight, HiOutlineCalendar, HiOutlineEye } from 'react-icons/hi';

const blogs = [
  {
    title: '10 Essential Items for Your Next Trek',
    excerpt: 'Packing for a trek can be tricky. We’ve rounded up the must-haves for your safety and comfort.',
    image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&q=80&w=1000',
    date: 'May 12, 2024',
    views: '1.2k',
    slug: 'essential-trek-items'
  },
  {
    title: 'Why Group Travel is the New Luxury',
    excerpt: 'Discover why more people are choosing curated group experiences over solo luxury travel.',
    image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&q=80&w=1000',
    date: 'May 08, 2024',
    views: '850',
    slug: 'group-travel-luxury'
  }
];

export default function BlogPreview() {
  return (
    <section className="section-padding bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-title mb-0"
            >
              Travel <span className="gradient-text">Insights</span>
            </motion.h2>
            <p className="section-subtitle mt-4">
              Tips, guides, and stories from our expert travelers.
            </p>
          </div>
          
          <Link href="/blogs">
            <motion.button
              whileHover={{ x: 5 }}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
            >
              View All Posts
              <HiOutlineArrowRight className="w-5 h-5 text-primary-600" />
            </motion.button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogs.map((blog, i) => (
            <motion.div
              key={blog.title}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass-card flex flex-col lg:flex-row group bg-white border border-slate-100 hover:border-primary-500/20"
            >
              <div className="relative w-full lg:w-2/5 h-64 lg:h-auto overflow-hidden">
                <Image
                  src={blog.image}
                  alt={blog.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              
              <div className="p-8 lg:w-3/5 flex flex-col">
                <div className="flex items-center gap-4 mb-4 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <HiOutlineCalendar className="w-3.5 h-3.5 text-primary-500" />
                    {blog.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <HiOutlineEye className="w-3.5 h-3.5 text-primary-500" />
                    {blog.views}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-primary-600 transition-colors">
                  {blog.title}
                </h3>
                
                <p className="text-slate-500 text-sm mb-6 line-clamp-2">
                  {blog.excerpt}
                </p>
                
                <Link href={`/blogs/${blog.slug}`} className="mt-auto">
                  <motion.div
                    whileHover={{ gap: '12px' }}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent-gold"
                  >
                    Read More
                    <HiOutlineArrowRight className="w-4 h-4" />
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
