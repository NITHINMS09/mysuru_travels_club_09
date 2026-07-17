'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineCalendar, HiOutlineClock,
  HiOutlineLocationMarker, HiOutlineMap, HiOutlineCheckCircle,
  HiOutlineChevronDown, HiOutlineChatAlt, HiOutlineStatusOnline,
  HiOutlineCreditCard, HiOutlineUser, HiOutlineUpload, HiOutlineArrowRight
} from 'react-icons/hi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { io } from 'socket.io-client';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

const bookingSchema = z.object({
  travelerName: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Invalid phone number'),
  seatCount: z.number().min(1).max(20),
});
type BookingFormData = z.infer<typeof bookingSchema>;
const STEPS = [
  { n: 1, label: 'Details', icon: HiOutlineUser },
  { n: 2, label: 'Payment', icon: HiOutlineCreditCard },
  { n: 3, label: 'Done', icon: HiOutlineCheckCircle }
];

export default function TripDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [openDay, setOpenDay] = useState<number | null>(0);
  const [liveLoc, setLiveLoc] = useState<{lat: number, lng: number} | null>(null);
  const [L, setL] = useState<any>(null);

  // Booking State
  const [step, setStep] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [paymentOption, setPaymentOption] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { seatCount: 1 }
  });
  const seatCount = watch('seatCount') || 1;

  const pricing = useMemo(() => {
    if (!trip) return { total: 0 };
    return { total: trip.price * seatCount };
  }, [trip, seatCount]);

  useEffect(() => {
    import('leaflet').then(mod => { setL(mod.default); });

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

  const handleCreateBookingAndProceed = async (data: BookingFormData) => {
    setBookingLoading(true);
    try {
      const bookingData = { 
        ...data, 
        tripId: id as string, 
        totalAmount: pricing.total, 
        isManualPayment: true 
      };
      const res = await api.bookings.create(bookingData);
      if (!res || !res.booking) throw new Error('Booking initialization failed');
      setCreatedBookingId(res.booking.id);
      setBookingRef(res.booking.bookingRef);
      setStep(2);
    } catch (error: any) {
      toast.error(error.message || 'Booking submission failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    const file = 'dataTransfer' in e ? e.dataTransfer.files?.[0] : (e.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be under 5MB');
        return;
      }
      setScreenshot(file); 
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  const submitPayment = async () => {
    if (!screenshot || !createdBookingId) {
      toast.error('Please upload a payment screenshot');
      return;
    }
    const payAmount = paymentOption === 'full' ? pricing.total : (parseFloat(partialAmount) || 0);
    if (isNaN(payAmount) || payAmount <= 0 || payAmount > pricing.total) {
      toast.error(`Please enter a valid payment amount between ₹1 and ₹${pricing.total}`);
      return;
    }
    setBookingLoading(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', screenshot);
      formData.append('amount', payAmount.toString());
      formData.append('notes', paymentOption === 'partial' ? `Initial partial payment of ₹${payAmount}` : 'Initial full payment');
      await api.bookings.uploadScreenshot(createdBookingId, formData);
      toast.success('Verification submitted successfully!');
      setStep(3);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || 'Screenshot submission failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!trip) return <div className="min-h-screen bg-[#f8fafc] pt-24 text-center text-slate-700 font-bold">Trip not found</div>;

  const mapCenter: [number, number] = liveLoc ? [liveLoc.lat, liveLoc.lng] : [trip.latitude || 20.5937, trip.longitude || 78.9629];

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-900 pb-20">
      <style jsx global>{`
        .leaflet-container { width: 100%; height: 100%; z-index: 1; background: #e2e8f0; }
      `}</style>

      {/* Hero Header */}
      <div className="relative h-[60vh] w-full">
        <Image src={trip.coverImage} alt={trip.title} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-block px-4 py-1 rounded-full bg-primary-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] shadow-md">{trip.category} Expedition</span>
                {trip.isLiveTracking && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500 text-white text-[10px] font-bold uppercase tracking-widest animate-pulse shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" /> Live Tracking Active
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#FFFFFF] mb-6 leading-tight font-outfit" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{trip.title}</h1>
              <div className="flex flex-wrap gap-6 text-sm font-semibold text-white/90">
                <div className="flex items-center gap-2"><HiOutlineLocationMarker className="w-5 h-5 text-primary-400" />{trip.destination}</div>
                <div className="flex items-center gap-2"><HiOutlineCalendar className="w-5 h-5 text-primary-400" />{new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div className="flex items-center gap-2"><HiOutlineClock className="w-5 h-5 text-primary-400" />Adventure Guaranteed</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Main Content */}
          <div className="lg:w-2/3">
            
            {/* Inline Booking Form (Placed above the map) */}
            <div className="mb-12" id="booking-section">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 lg:p-10">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-slate-900 font-outfit tracking-tight">Book Your Adventure</h2>
                  <p className="text-slate-500 mt-2 font-medium">Complete your reservation in a few simple steps</p>
                </div>

                <div className="flex items-center justify-between mb-8 relative max-w-md mx-auto">
                  <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-200 -translate-y-1/2 z-0 rounded-full" />
                  <div 
                    className="absolute top-1/2 left-0 h-[2px] bg-slate-900 -translate-y-1/2 z-0 transition-all duration-700 ease-in-out rounded-full" 
                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                  />
                  {STEPS.map((s) => (
                    <div key={s.n} className="relative z-10 flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                        step >= s.n 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}>
                        {step > s.n ? <HiOutlineCheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-widest mt-2 ${step >= s.n ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="max-w-lg mx-auto">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Full Name</label>
                            <input {...register('travelerName')} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-3.5 outline-none focus:border-slate-400 focus:bg-white transition-all" placeholder="John Doe" />
                            {errors.travelerName && <p className="text-red-500 text-xs font-bold">{errors.travelerName.message}</p>}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Mobile Number</label>
                            <input type="tel" {...register('phone')} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-3.5 outline-none focus:border-slate-400 focus:bg-white transition-all" placeholder="9876543210" />
                            {errors.phone && <p className="text-red-500 text-xs font-bold">{errors.phone.message}</p>}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Number of Seats</label>
                            <div className="flex items-center gap-4">
                              <button type="button" onClick={() => setValue('seatCount', Math.max(1, seatCount - 1))} className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold text-xl">-</button>
                              <div className="flex-1 text-center font-black text-xl text-slate-900">{seatCount}</div>
                              <button type="button" onClick={() => setValue('seatCount', Math.min(trip.availableSeats, 20, seatCount + 1))} className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold text-xl">+</button>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{trip.availableSeats} seats remaining</p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center mb-4">
                          <span className="text-slate-500 font-bold text-sm">Total to Pay</span>
                          <span className="font-black text-2xl text-[#00C853]">₹{pricing.total.toLocaleString()}</span>
                        </div>
                        <button type="button" onClick={handleSubmit(handleCreateBookingAndProceed)} disabled={bookingLoading || trip.availableSeats === 0} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none">
                          {bookingLoading ? 'Processing...' : 'Proceed to Payment'} <HiOutlineArrowRight />
                        </button>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div key="step2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                        <div className="text-center">
                          <p className="text-slate-500 font-medium mb-4">Choose a payment plan and upload the payment screenshot below.</p>
                        </div>
                        
                        <div className="flex gap-4">
                          <button 
                            type="button" 
                            onClick={() => setPaymentOption('full')}
                            className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                              paymentOption === 'full' 
                                ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            Pay Full Amount
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              setPaymentOption('partial');
                              setPartialAmount(Math.round(pricing.total * 0.3).toString());
                            }}
                            className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                              paymentOption === 'partial' 
                                ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            Pay Partial Amount
                          </button>
                        </div>

                        {paymentOption === 'partial' && (
                          <div className="space-y-1.5 mb-6 text-left">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Amount to Pay Now (₹)</label>
                            <input 
                              type="number"
                              value={partialAmount}
                              onChange={(e) => setPartialAmount(e.target.value)}
                              max={pricing.total}
                              min={1}
                              className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-3.5 outline-none focus:border-slate-400 focus:bg-white transition-all text-sm animate-fade-in"
                              placeholder={`Enter amount (max ₹${pricing.total})`}
                            />
                            <p className="text-[10px] text-slate-400">Minimum payment of ₹1 is required to secure booking.</p>
                          </div>
                        )}

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 w-48 h-48 mx-auto relative overflow-hidden mb-4">
                            <img src="https://cdn.corenexis.com/files/c/8845266720.png" alt="UPI QR Code" className="w-full h-full object-contain" />
                          </div>
                          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Pay via UPI / Mobile</div>
                          <div className="text-3xl font-black text-slate-900 mb-2">9632463347</div>
                          <div className="text-sm text-slate-600 font-medium bg-slate-200/50 rounded-lg py-1.5 px-3 inline-block">
                            Amount: <b className="text-[#00C853]">₹{(paymentOption === 'full' ? pricing.total : (parseFloat(partialAmount) || 0)).toLocaleString()}</b>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Upload Screenshot</h3>
                          <div 
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileChange(e); }}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                              dragActive ? 'border-slate-800 bg-slate-50' : 'border-slate-300 hover:border-slate-400 bg-white'
                            }`}
                          >
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
                            
                            {previewUrl ? (
                              <div className="relative">
                                <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded-lg shadow-sm border border-slate-200" />
                                <div className="absolute -top-3 -right-3 bg-white text-red-500 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold shadow-md cursor-pointer hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setScreenshot(null); setPreviewUrl(null); }}>Remove</div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center space-y-3">
                                <HiOutlineUpload className="w-8 h-8 text-slate-400" />
                                <p className="text-sm font-bold text-slate-700">Tap to upload image</p>
                                <p className="text-[11px] text-slate-400">JPG, PNG, WEBP (Max 5MB)</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <button type="button" onClick={submitPayment} disabled={bookingLoading || !screenshot} className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
                          !screenshot ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                        }`}>
                          {bookingLoading ? 'Submitting...' : 'Complete Booking'}
                        </button>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div key="step3" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                        <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                          <HiOutlineCheckCircle className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-3 font-outfit tracking-tight">Booking Submitted</h2>
                        <p className="text-slate-600 mb-8 font-medium">
                          Your booking was submitted successfully and payment is awaiting verification by our team.<br/><br/>
                          Reference ID: <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">{bookingRef}</span>
                        </p>
                        <button type="button" onClick={() => router.push(`/booking/status?ref=${bookingRef}`)} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md transition-colors cursor-pointer">
                          Track Status
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Interactive Map (Leaflet) */}
            <div className="mb-12 glass-card overflow-hidden bg-white border border-slate-200/60 shadow-lg rounded-3xl">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold flex items-center gap-2 text-slate-900"><HiOutlineMap className="text-primary-600" />Journey Map (Real-time)</h3>
                {trip.isLiveTracking && <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1"><HiOutlineStatusOnline /> Live GPS Active</span>}
              </div>
              <div className="h-[450px] relative">
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
                  <div className="absolute top-4 right-4 z-[1000] p-3 rounded-2xl bg-white border border-slate-200 shadow-md">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">GPS Feed</p>
                    <p className="font-mono text-sm text-green-600 font-bold">{liveLoc?.lat.toFixed(5)}, {liveLoc?.lng.toFixed(5)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-slate-200 mb-8 overflow-x-auto whitespace-nowrap">
              {['itinerary', 'pickups', 'inclusions', 'reviews'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative cursor-pointer ${activeTab === tab ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  {tab}
                  {activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
                </button>
              ))}
            </div>

            <div className="min-h-[400px]">
              {activeTab === 'itinerary' && (
                <div className="space-y-4">
                  {trip.itinerary?.map((item: any, i: number) => (
                    <div key={i} className="glass-card bg-white border border-slate-100 shadow-sm overflow-hidden rounded-2xl">
                      <button onClick={() => setOpenDay(openDay === i ? null : i)} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">{item.day}</div>
                          <h3 className="font-bold text-lg text-slate-900">{item.title}</h3>
                        </div>
                        <HiOutlineChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openDay === i ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>{openDay === i && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-6 pb-6 overflow-hidden">
                          <p className="text-slate-600 pl-14 text-sm leading-relaxed">{item.description}</p>
                        </motion.div>
                      )}</AnimatePresence>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'pickups' && (
                <div className="space-y-4">
                  {trip.pickupPoints?.map((pt: any, i: number) => (
                    <div key={i} className="glass-card bg-white border border-slate-100 p-6 flex items-center justify-between group hover:border-primary-500/20 hover:bg-primary-500/[0.01] shadow-sm transition-all rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all"><HiOutlineLocationMarker className="w-6 h-6" /></div>
                        <div><h4 className="font-bold text-lg text-slate-900">{pt.location}</h4><p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Boarding Stop</p></div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-primary-600 font-black text-xl"><HiOutlineClock className="w-5 h-5" />{pt.time}</div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">ETA</p>
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
              <div className="glass-card p-8 bg-white border border-slate-200/60 shadow-lg rounded-3xl">
                <div className="mb-8">
                  <div className="text-slate-400 text-sm mb-1 font-bold tracking-widest uppercase">Starting from</div>
                  <div className="text-5xl font-black text-[#00C853] font-outfit tracking-tighter">₹{trip.price}</div>
                </div>
                <button onClick={() => {
                  document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                }} className="btn-primary w-full py-4 text-lg mb-4 cursor-pointer font-bold shadow-lg shadow-primary-500/20">Book Now</button>
                <button onClick={() => router.push(`/trips/${id}/chat`)} className="w-full py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-sm font-bold text-slate-700 flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                  <HiOutlineChatAlt className="w-5 h-5 text-primary-600" /> Join Group Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
