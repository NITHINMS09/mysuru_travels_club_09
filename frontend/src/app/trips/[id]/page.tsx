'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineCalendar, HiOutlineClock, HiOutlineUserGroup, 
  HiOutlineLocationMarker, HiOutlineMap, HiOutlineCheckCircle,
  HiOutlineChevronDown, HiOutlineStar, HiOutlinePlay, HiX,
  HiOutlineChatAlt, HiOutlineStatusOnline
} from 'react-icons/hi';
import api from '@/lib/api';
import { io } from 'socket.io-client';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components (no SSR)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

export default function TripDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [openDay, setOpenDay] = useState<number | null>(0);
  const [liveLoc, setLiveLoc] = useState<{lat: number, lng: number} | null>(null);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    // Import Leaflet for the Icon helper
    import('leaflet').then(mod => {
      setL(mod.default);
    });

    const fetchTrip = async () => {
      try {
        const data = await api.trips.getById(id as string);
        setTrip(data);
        if (data.isLiveTracking) {
          setLiveLoc({ lat: data.currentLat, lng: data.currentLng });
        }
      } catch (error) {
        console.error('Failed to fetch trip:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();

    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000');
    socket.emit('join_trip_location', id);

    socket.on('location_updated', (data) => setLiveLoc({ lat: data.lat, lng: data.lng }));
    socket.on('location_started', (data) => {
      setLiveLoc({ lat: data.lat, lng: data.lng });
      setTrip((prev: any) => ({ ...prev, isLiveTracking: true }));
    });
    socket.on('location_stopped', () => {
      setLiveLoc(null);
      setTrip((prev: any) => ({ ...prev, isLiveTracking: false }));
    });

    return () => { socket.disconnect(); };
  }, [id]);

  const customIcon = useMemo(() => {
    if (!L) return null;
    return new L.Icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
  }, [L]);

  const liveIcon = useMemo(() => {
    if (!L) return null;
    return new L.DivIcon({
      className: 'live-marker',
      html: '<div class="w-6 h-6 bg-primary-500 rounded-full border-4 border-white shadow-glow animate-pulse"></div>',
      iconSize: [24, 24]
    });
  }, [L]);

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 pt-24 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!trip) return <div className="min-h-screen bg-zinc-950 pt-24 text-center">Trip not found</div>;

  const mapCenter: [number, number] = liveLoc ? [liveLoc.lat, liveLoc.lng] : [trip.latitude || 20.5937, trip.longitude || 78.9629];

  return (
    <div className="bg-zinc-950 min-h-screen">
      <style jsx global>{`
        .leaflet-container { width: 100%; height: 100%; z-index: 1; background: #18181b; }
        .leaflet-tile { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
      `}</style>

      {/* Hero Header */}
      <div className="relative h-[60vh] w-full">
        <Image src={trip.coverImage} alt={trip.title} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-block px-4 py-1 rounded-full bg-primary-600 text-[10px] font-bold uppercase tracking-[0.2em]">{trip.category} Expedition</span>
                {trip.isLiveTracking && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Live Tracking Active
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">{trip.title}</h1>
              <div className="flex flex-wrap gap-6 text-sm font-medium text-white/80">
                <div className="flex items-center gap-2"><HiOutlineLocationMarker className="w-5 h-5 text-primary-500" />{trip.destination}</div>
                <div className="flex items-center gap-2"><HiOutlineCalendar className="w-5 h-5 text-primary-500" />{new Date(trip.startDate).toLocaleDateString()}</div>
                <div className="flex items-center gap-2"><HiOutlineClock className="w-5 h-5 text-primary-500" />Adventure Guaranteed</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* Interactive Map (Leaflet) */}
            <div className="mb-12 glass-card overflow-hidden border-primary-500/20">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-primary-950/20">
                <h3 className="font-bold flex items-center gap-2"><HiOutlineMap className="text-primary-500" />Journey Map (Real-time)</h3>
                {trip.isLiveTracking && <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-1"><HiOutlineStatusOnline /> Live GPS Active</span>}
              </div>
              <div className="h-[450px] relative">
                {/* Check if we're in the browser to render Leaflet */}
                {typeof window !== 'undefined' && (
                  <MapContainer center={mapCenter} zoom={liveLoc ? 15 : 10} scrollWheelZoom={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                    
                    {/* Destination Marker */}
                    {trip.latitude && trip.longitude && !liveLoc && (
                      <Marker position={[trip.latitude, trip.longitude]} icon={customIcon || undefined}>
                        <Popup><div className="text-black font-bold">{trip.destination}</div></Popup>
                      </Marker>
                    )}

                    {/* Live Vehicle Marker */}
                    {liveLoc && (
                      <Marker position={[liveLoc.lat, liveLoc.lng]} icon={liveIcon || undefined}>
                        <Popup><div className="text-black font-black">Vehicle Live Location</div></Popup>
                      </Marker>
                    )}
                  </MapContainer>
                )}
                
                {trip.isLiveTracking && (
                  <div className="absolute top-4 right-4 z-[1000] p-3 glass-card bg-black/60 backdrop-blur-md">
                    <p className="text-[10px] font-bold text-white/40 uppercase mb-1">GPS Feed</p>
                    <p className="font-mono text-sm text-green-400">{liveLoc?.lat.toFixed(5)}, {liveLoc?.lng.toFixed(5)}</p>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white/[0.02] text-center"><p className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Powered by OpenStreetMap & TripNova Sockets</p></div>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-white/10 mb-8 overflow-x-auto whitespace-nowrap">
              {['itinerary', 'pickups', 'inclusions', 'reviews'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/60'}`}>
                  {tab}
                  {activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />}
                </button>
              ))}
            </div>

            <div className="min-h-[400px]">
              {activeTab === 'itinerary' && (
                <div className="space-y-4">
                  {trip.itinerary?.map((item: any, i: number) => (
                    <div key={i} className="glass-card overflow-hidden">
                      <button onClick={() => setOpenDay(openDay === i ? null : i)} className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center font-bold text-sm">{item.day}</div>
                          <h3 className="font-bold text-lg">{item.title}</h3>
                        </div>
                        <HiOutlineChevronDown className={`w-5 h-5 transition-transform ${openDay === i ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>{openDay === i && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-6 pb-6"><p className="text-white/60 pl-14">{item.description}</p></motion.div>}</AnimatePresence>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'pickups' && (
                <div className="space-y-4">
                  {trip.pickupPoints?.map((pt: any, i: number) => (
                    <div key={i} className="glass-card p-6 flex items-center justify-between group hover:bg-primary-500/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors"><HiOutlineLocationMarker className="w-6 h-6" /></div>
                        <div><h4 className="font-bold text-lg">{pt.location}</h4><p className="text-white/40 text-xs uppercase tracking-widest font-bold">Boarding Stop</p></div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-primary-400 font-black text-xl"><HiOutlineClock className="w-5 h-5" />{pt.time}</div>
                        <p className="text-white/20 text-[10px] uppercase font-bold tracking-tighter">ETA</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            <div className="sticky top-28 space-y-6">
              <div className="glass-card p-8 border-primary-500/20 bg-primary-950/10">
                <div className="mb-8">
                  <div className="text-white/40 text-sm mb-1">Starting from</div>
                  <div className="text-4xl font-black gradient-text">₹{trip.price}</div>
                </div>
                <button onClick={() => router.push(`/booking?tripId=${trip.id}`)} disabled={trip.availableSeats === 0} className="btn-primary w-full py-4 text-lg mb-4">Book Your Adventure</button>
                <button onClick={() => router.push(`/trips/${id}/chat`)} className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-bold flex items-center justify-center gap-2">
                  <HiOutlineChatAlt className="w-5 h-5 text-primary-400" /> Join Group Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
