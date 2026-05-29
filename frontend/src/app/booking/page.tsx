'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineCheckCircle, HiOutlineCreditCard, 
  HiOutlineUser, HiOutlineLocationMarker,
  HiOutlineUpload, HiOutlineArrowRight
} from 'react-icons/hi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import toast from 'react-hot-toast';

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

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripId = searchParams.get('tripId');
  const [trip, setTrip] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch, trigger, setValue } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { seatCount: 1 }
  });

  const seatCount = watch('seatCount') || 1;

  const pricing = useMemo(() => {
    if (!trip) return { total: 0 };
    const subtotal = trip.price * seatCount;
    return { total: subtotal };
  }, [trip, seatCount]);

  useEffect(() => {
    if (!tripId) { router.push('/trips'); return; }
    const fetchTrip = async () => {
      try {
        const data = await api.trips.getById(tripId);
        setTrip(data);
      } catch (err) { toast.error('Failed to load trip details'); }
    };
    fetchTrip();
  }, [tripId, router]);

  const handleCreateBookingAndProceed = async (data: BookingFormData) => {
    setLoading(true);
    try {
      const bookingData = { 
        ...data, 
        tripId, 
        totalAmount: pricing.total, 
        isManualPayment: true 
      };
      const res = await api.bookings.create(bookingData);
      if (!res || !res.booking) throw new Error('Booking initialization failed');
      setCreatedBookingId(res.booking.id);
      setBookingRef(res.booking.bookingRef);
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      toast.error(error.message || 'Booking submission failed');
    } finally {
      setLoading(false);
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
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', screenshot);
      await api.bookings.uploadScreenshot(createdBookingId, formData);
      toast.success('Verification submitted successfully!');
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || 'Screenshot submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!trip) return null;

  return (
    <div className="pt-24 pb-20 bg-[#fafafa] min-h-screen text-slate-900 font-inter font-medium">
      <div className="max-w-md mx-auto px-4 md:px-0">
        
        <div className="text-center mb-8 flex flex-col items-center">
          <Image src="https://cdn.corenexis.com/files/c/7115481720.png" alt="Mysuru Travel Club Logo" width={50} height={50} className="mb-4" />
          <h1 className="text-2xl font-black text-slate-900 font-outfit tracking-tight">Book {trip.title}</h1>
        </div>

        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-200 -translate-y-1/2 z-0 rounded-full" />
          <div 
            className="absolute top-1/2 left-0 h-[2px] bg-slate-900 -translate-y-1/2 z-0 transition-all duration-700 ease-in-out rounded-full" 
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
          
          {STEPS.map((s) => (
            <div key={s.n} className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                step >= s.n 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-400 border-slate-200'
              }`}>
                {step > s.n ? <HiOutlineCheckCircle className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              </div>
              <span className={`text-[9px] uppercase font-bold tracking-widest mt-1.5 ${step >= s.n ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-4 font-outfit">Enter Details</h2>
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
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center mb-4">
                  <span className="text-slate-500 font-bold text-sm">Total to Pay</span>
                  <span className="font-black text-2xl text-slate-900">₹{pricing.total.toLocaleString()}</span>
                </div>
                
                <button type="button" onClick={handleSubmit(handleCreateBookingAndProceed)} disabled={loading} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md">
                  {loading ? 'Processing...' : 'Proceed to Payment'} <HiOutlineArrowRight />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-black text-slate-900 mb-1 font-outfit">Payment</h2>
                  <p className="text-slate-500 text-[13px]">Pay the amount and upload the payment screenshot below.</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 w-48 h-48 mx-auto relative overflow-hidden mb-4">
                    <img src="https://cdn.corenexis.com/files/c/8845266720.png" alt="UPI QR Code" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Pay via UPI / Mobile</div>
                  <div className="text-2xl font-black text-slate-900 mb-1">9632463347</div>
                  <div className="text-sm text-slate-600 font-medium bg-slate-200/50 rounded-lg py-1.5 px-3 inline-block">Amount: <b>₹{pricing.total.toLocaleString()}</b></div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Upload Screenshot</h3>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileChange(e); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragActive ? 'border-slate-800 bg-slate-50' : 'border-slate-300 hover:border-slate-400 bg-white'
                    }`}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
                    
                    {previewUrl ? (
                      <div className="relative">
                        <img src={previewUrl} alt="Preview" className="max-h-32 mx-auto rounded-lg shadow-sm border border-slate-200" />
                        <div className="absolute -top-3 -right-3 bg-white text-red-500 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold shadow-md cursor-pointer hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setScreenshot(null); setPreviewUrl(null); }}>Remove</div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <HiOutlineUpload className="w-6 h-6 text-slate-400" />
                        <p className="text-xs font-bold text-slate-700">Tap to upload image</p>
                        <p className="text-[10px] text-slate-400">JPG, PNG, WEBP</p>
                      </div>
                    )}
                  </div>
                </div>

                <button type="button" onClick={submitPayment} disabled={loading || !screenshot} className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
                  !screenshot ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                }`}>
                  {loading ? 'Submitting...' : 'Complete Booking'}
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-slate-900/20">
                  <HiOutlineCheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-3 font-outfit tracking-tight">Booking Submitted</h2>
                <p className="text-slate-600 mb-6 text-sm">
                  Booking submitted successfully. Your payment is awaiting verification. Ref: <span className="font-mono font-bold text-slate-900">{bookingRef}</span>
                </p>
                <button type="button" onClick={() => router.push(`/booking/status?ref=${bookingRef}`)} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md transition-colors">
                  Track Status
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="pt-24 pb-20 bg-[#fafafa] min-h-screen px-4 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
