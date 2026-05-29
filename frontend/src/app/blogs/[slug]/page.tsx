'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { HiOutlineCalendar, HiOutlineEye, HiOutlineArrowLeft, HiOutlineTag } from 'react-icons/hi';
import api from '@/lib/api';

export default function BlogDetails() {
  const { slug } = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const data = await api.blogs.getBySlug(slug as string);
        setBlog(data);
      } catch (error) {
        console.error('Failed to load blog:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-24 min-h-screen bg-[#fafafa] flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="pt-24 min-h-screen bg-[#fafafa] flex flex-col justify-center items-center text-center px-4">
        <h1 className="text-3xl font-black text-slate-900 mb-4 font-outfit">Story Not Found</h1>
        <p className="text-slate-500 mb-8">The story you are looking for does not exist or has been removed.</p>
        <button onClick={() => router.push('/blogs')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2">
          <HiOutlineArrowLeft /> Back to Journal
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#fafafa] min-h-screen pb-20">
      
      {/* Hero Header */}
      <div className="relative h-[50vh] md:h-[70vh] w-full">
        <Image src={blog.coverImage || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1'} alt={blog.title} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-16">
          <div className="max-w-4xl mx-auto">
            <button onClick={() => router.push('/blogs')} className="mb-6 px-4 py-2 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white/20 transition-all w-fit">
              <HiOutlineArrowLeft /> Back
            </button>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-wrap gap-2 mb-4">
                {blog.tags?.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-primary-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight font-outfit">
                {blog.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-xs md:text-sm font-bold text-white/80 uppercase tracking-widest">
                <span className="flex items-center gap-2"><HiOutlineCalendar className="w-4 h-4 text-primary-400" /> {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span className="flex items-center gap-2"><HiOutlineEye className="w-4 h-4 text-primary-400" /> {blog.views} Views</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="bg-white rounded-3xl p-6 md:p-12 shadow-sm border border-slate-200">
          <div 
            className="prose prose-lg md:prose-xl max-w-none prose-headings:font-outfit prose-headings:font-black prose-a:text-primary-600 prose-img:rounded-2xl"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>
        
        <div className="mt-12 flex flex-wrap gap-3">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mr-4 flex items-center gap-2"><HiOutlineTag className="w-5 h-5"/> Tags:</span>
          {blog.tags?.map((tag: string) => (
            <span key={tag} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-widest">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
