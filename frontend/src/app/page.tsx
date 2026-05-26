import Hero from '@/components/home/Hero';
import MarketplaceCategories from '@/components/home/MarketplaceCategories';
import UpcomingTrips from '@/components/home/UpcomingTrips';
import Stats from '@/components/home/Stats';
import FeaturedDestinations from '@/components/home/FeaturedDestinations';
import Testimonials from '@/components/home/Testimonials';
import BlogPreview from '@/components/home/BlogPreview';
import OurCrew from '@/components/home/OurCrew';
import VotingSection from '@/components/home/VotingSection';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <MarketplaceCategories />
      <UpcomingTrips />
      <Stats />
      <FeaturedDestinations />
      <Testimonials />
      <BlogPreview />
      <OurCrew />
      <VotingSection />
    </div>
  );
}
