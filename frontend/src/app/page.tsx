'use client';

import dynamic from 'next/dynamic';
import Hero from '@/components/home/Hero';

const LatestUpdates = dynamic(() => import('@/components/home/LatestUpdates'), { ssr: false });
const LatestUpdatesFeed = dynamic(() => import('@/components/home/LatestUpdatesFeed'), { ssr: false });
const OurCrew = dynamic(() => import('@/components/home/OurCrew'), { ssr: false });
const MarketplaceCategories = dynamic(() => import('@/components/home/MarketplaceCategories'), { ssr: false });
const UpcomingTrips = dynamic(() => import('@/components/home/UpcomingTrips'), { ssr: false });
const Stats = dynamic(() => import('@/components/home/Stats'), { ssr: false });
const FeaturedDestinations = dynamic(() => import('@/components/home/FeaturedDestinations'), { ssr: false });
const Testimonials = dynamic(() => import('@/components/home/Testimonials'), { ssr: false });
const BlogPreview = dynamic(() => import('@/components/home/BlogPreview'), { ssr: false });
const VotingSection = dynamic(() => import('@/components/home/VotingSection'), { ssr: false });

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <UpcomingTrips />
      <LatestUpdates />
      <LatestUpdatesFeed />
      <MarketplaceCategories />
      <FeaturedDestinations />
      <Stats />
      <OurCrew />
      <Testimonials />
      <BlogPreview />
      <VotingSection />
    </div>
  );
}
