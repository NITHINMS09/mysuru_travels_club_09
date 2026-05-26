'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineCheckCircle, HiOutlineIdentification, HiOutlineCreditCard, 
  HiOutlineUser, HiOutlineLockClosed, HiOutlineTag, HiOutlineUserGroup,
  HiOutlineQrcode, HiOutlineUpload, HiOutlineCamera, HiOutlineLocationMarker
} from 'react-icons/hi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const bookingSchema = z.object({
  travelerName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone number'),
  age: z.number().min(1, 'Age is required'),
  gender: z.string().min(1, 'Gender is required'),
  emergencyName: z.string().min(2, 'Emergency contact name is required'),
  emergencyPhone: z.string().min(10, 'Emergency contact phone is required'),
  seatCount: z.number().min(1).max(20),
  pickupPoint: z.string().min(1, 'Please select a boarding point'),
  specialRequests: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

declare global { interface Window { Razorpay: any; } }

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="pt-24 pb-20 bg-[#f8fafc] min-h-screen px-4 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripId = searchParams.get('tripId');
  const [trip, setTrip] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingRes, setBookingRes] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'qr'>('razorpay');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { seatCount: 1, gender: 'Male' }
  });

  const seatCount = watch('seatCount') || 1;

  const pricing = useMemo(() => {
    if (!trip) return { subtotal: 0, discount: 0, total: 0 };
    const subtotal = trip.price * seatCount;
    const discount = seatCount > 4 ? subtotal * 0.15 : 0;
    return { subtotal, discount, total: subtotal - discount };
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
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, [tripId, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setScreenshot(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const processManualPayment = async (bookingId: string) => {
    try {
      const formData = new FormData();
      formData.append('screenshot', screenshot!);
      await api.bookings.uploadScreenshot(bookingId, formData);
      setStep(3);
      toast.success('Submitted for approval!');
    } catch (err: any) { 
      toast.error(err.message || 'Submission failed'); 
    } finally { 
      setLoading(false); 
    }
  };

  const processRazorpayPayment = async (bookingId: string, amount: number) => {
    try {
      const orderRes = await api.payments.createOrder({ amount, bookingId });
      if (!orderRes || !orderRes.id) throw new Error('Order failed');
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: orderRes.amount,
        order_id: orderRes.id,
        handler: async function (response: any) {
          try {
            await api.payments.verify({ ...response, bookingId });
            setStep(3); toast.success('Confirmed!');
          } catch (err) { toast.error('Verification failed'); }
        },
        prefill: { name: watch('travelerName'), email: watch('email') },
        theme: { color: '#3b82f6' }
      };
      if (window.Razorpay) new window.Razorpay(options).open();
      else { setStep(3); toast.success('Test Success!'); }
    } catch (err) { 
      toast.error('Payment Error'); 
      setPaymentMethod('qr');
      setLoading(false);
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    if (step === 1) { setStep(2); return; }
    
    if (paymentMethod === 'qr' && !screenshot) {
      toast.error('Please upload a payment screenshot to proceed');
      return;
    }
    
    setLoading(true);
    try {
      const bookingData = { ...data, tripId, totalAmount: pricing.total, isManualPayment: paymentMethod === 'qr' };
      const res = await api.bookings.create(bookingData);
      if (!res || !res.booking) throw new Error('Booking failed');
      setBookingRes(res.booking);
      
      if (paymentMethod === 'qr') {
        await processManualPayment(res.booking.id);
      } else {
        await processRazorpayPayment(res.booking.id, pricing.total);
      }
    } catch (error: any) { 
      toast.error(error.message || 'Booking submission failed'); 
      setLoading(false); 
    }
  };

  if (!trip) return null;

  return (
    <div className="pt-24 pb-20 bg-[#f8fafc] min-h-screen px-4 text-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          {[
            { n: 1, label: 'Details', icon: HiOutlineUser },
            { n: 2, label: 'Confirm', icon: HiOutlineIdentification },
            { n: 3, label: 'Success', icon: HiOutlineCheckCircle }
          ].map((s) => (
            <div key={s.n} className="relative z-10 flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border ${
                step >= s.n 
                  ? 'bg-gradient-to-r from-primary-600 to-purple-600 border-primary-600 text-white shadow-md' 
                  : 'bg-white text-slate-400 border-slate-200'
              }`}><s.icon className="w-6 h-6" /></div>
              <span className={`text-[10px] uppercase font-bold tracking-widest mt-2 ${step >= s.n ? 'text-slate-800' : 'text-slate-400'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <div className="glass-card bg-white border border-slate-200/60 shadow-lg p-8">
                      <h2 className="text-2xl font-bold text-slate-900 mb-6 font-outfit">Traveler Information</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Full Name</label>
                          <input {...register('travelerName')} className="input-field bg-white border border-slate-200" placeholder="John Doe" />
                          {errors.travelerName && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.travelerName.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Pickup Point</label>
                          <select {...register('pickupPoint')} className="input-field bg-white border border-slate-200 font-semibold text-slate-700">
                            <option value="">Select Boarding Point</option>
                            {trip.pickupPoints?.map((pt: any, i: number) => (
                              <option key={i} value={pt.location}>{pt.location} - {pt.time}</option>
                            ))}
                          </select>
                          {errors.pickupPoint && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.pickupPoint.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Email</label>
                          <input {...register('email')} className="input-field bg-white border border-slate-200" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Phone</label>
                          <input {...register('phone')} className="input-field bg-white border border-slate-200" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-widest text-slate-400">Age</label><input type="number" {...register('age', { valueAsNumber: true })} className="input-field bg-white border border-slate-200" /></div>
                          <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-widest text-slate-400">Gender</label><select {...register('gender')} className="input-field bg-white border border-slate-200 font-semibold text-slate-700"><option>Male</option><option>Female</option></select></div>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card bg-white border border-slate-200/60 shadow-lg p-8">
                      <h2 className="text-2xl font-bold text-slate-900 mb-6 font-outfit">Emergency Contact</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input {...register('emergencyName')} className="input-field bg-white border border-slate-200" placeholder="Contact Name" />
                        <input {...register('emergencyPhone')} className="input-field bg-white border border-slate-200" placeholder="Contact Phone" />
                      </div>
                    </div>

                    <button type="submit" className="btn-primary w-full py-4 text-lg cursor-pointer">Review & Pay</button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                    <div className="glass-card bg-white border border-slate-200/60 shadow-lg p-8">
                      <h2 className="text-2xl font-bold text-slate-900 mb-6 font-outfit">Confirm Details</h2>
                      <div className="space-y-4 text-sm text-slate-700">
                        <div className="flex justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="flex items-center gap-3"><HiOutlineLocationMarker className="text-primary-600 w-5 h-5" /><span>Boarding Point</span></div>
                          <span className="font-bold text-primary-600">{watch('pickupPoint')}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-4"><span className="text-slate-500">Trip</span><span className="font-bold text-slate-900">{trip.title}</span></div>
                        <div className="flex justify-between border-b border-slate-100 pb-4"><span className="text-slate-500">Total</span><span className="font-black text-xl gradient-text">₹{pricing.total}</span></div>
                      </div>
                    </div>
                    
                    <div className="glass-card bg-white border border-slate-200/60 shadow-lg p-8">
                      <h2 className="text-2xl font-bold text-slate-900 mb-6 font-outfit">Select Payment Method</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <button type="button" onClick={() => setPaymentMethod('razorpay')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all cursor-pointer ${paymentMethod === 'razorpay' ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}><HiOutlineCreditCard className="w-8 h-8" /><span className="font-bold text-sm">Online Pay</span></button>
                        <button type="button" onClick={() => setPaymentMethod('qr')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all cursor-pointer ${paymentMethod === 'qr' ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}><HiOutlineQrcode className="w-8 h-8" /><span className="font-bold text-sm">Scan QR Code</span></button>
                      </div>

                      {paymentMethod === 'qr' && (
                        <div className="mt-8 space-y-6">
                          <div className="flex flex-col items-center p-6 bg-slate-50 border border-slate-200/60 rounded-2xl"><Image src="/qr-payment.jpeg" alt="QR" width={180} height={180} className="border border-slate-100 rounded-xl" /><p className="text-slate-900 font-black mt-4">Scan & Pay ₹{pricing.total}</p></div>
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:border-primary-500/30 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-white transition-all">
                            {previewUrl ? <Image src={previewUrl} alt="Preview" width={200} height={100} className="mx-auto rounded-lg shadow-sm" /> : <p className="text-slate-400 font-medium">Click to upload screenshot</p>}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <button type="button" onClick={() => setStep(1)} className="py-4 px-8 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm rounded-xl cursor-pointer font-bold transition-colors">Back</button>
                      <button type="submit" className="btn-primary flex-1 py-4 cursor-pointer" disabled={loading}>{loading ? 'Processing...' : (paymentMethod === 'qr' ? 'Submit Screenshot' : `Pay ₹${pricing.total}`)}</button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
                    <div className="w-24 h-24 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-8"><HiOutlineCheckCircle className="w-16 h-16 text-green-600" /></div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4 font-outfit">{paymentMethod === 'qr' ? 'Submitted!' : 'Confirmed!'}</h2>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">{paymentMethod === 'qr' ? 'Verification in progress...' : 'Welcome to the adventure!'}</p>
                    <button type="button" onClick={() => router.push('/')} className="btn-primary px-12 cursor-pointer">Return Home</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
          
          {step < 3 && (
            <div className="lg:col-span-1">
              <div className="glass-card bg-white border border-slate-200/60 shadow-lg p-6 sticky top-28">
                <h3 className="text-lg font-bold text-slate-900 mb-6 font-outfit">Booking Details</h3>
                <div className="relative h-40 rounded-xl overflow-hidden mb-6"><Image src={trip.coverImage} alt="Trip" fill className="object-cover" /></div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Travelers</span><span className="font-bold text-slate-900">{seatCount}</span></div>
                  <div className="flex justify-between font-black text-xl gradient-text pt-2 border-t border-slate-100"><span>Total</span><span>₹{pricing.total}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
