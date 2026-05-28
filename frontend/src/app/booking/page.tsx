'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineCheckCircle, HiOutlineIdentification, HiOutlineCreditCard, 
  HiOutlineUser, HiOutlineTag, HiOutlineLocationMarker,
  HiOutlineUpload, HiOutlineQrcode, HiOutlineDocumentText, HiOutlineArrowRight
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
  age: z.number().min(1, 'Age is required').max(120),
  gender: z.string().min(1, 'Gender is required'),
  emergencyName: z.string().min(2, 'Emergency contact name is required'),
  emergencyPhone: z.string().min(10, 'Emergency contact phone is required'),
  seatCount: z.number().min(1).max(20),
  pickupPoint: z.string().min(1, 'Please select a boarding point'),
  specialRequests: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const STEPS = [
  { n: 1, label: 'Traveler', icon: HiOutlineUser },
  { n: 2, label: 'Trip Options', icon: HiOutlineLocationMarker },
  { n: 3, label: 'Review', icon: HiOutlineDocumentText },
  { n: 4, label: 'Payment', icon: HiOutlineCreditCard },
  { n: 5, label: 'Done', icon: HiOutlineCheckCircle }
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
    defaultValues: { seatCount: 1, gender: 'Male' }
  });

  const seatCount = watch('seatCount') || 1;

  const pricing = useMemo(() => {
    if (!trip) return { subtotal: 0, discount: 0, platformFee: 0, total: 0 };
    const subtotal = trip.price * seatCount;
    const discount = seatCount >= 5 ? subtotal * 0.15 : 0;
    const platformFee = 49 * seatCount; // Nominal platform/taxes per seat
    return { subtotal, discount, platformFee, total: subtotal - discount + platformFee };
  }, [trip, seatCount]);

  const upiId = '9632463347@ptyes';
  const upiLink = useMemo(() => {
    if (!trip) return '';
    return `upi://pay?pa=${upiId}&pn=MysuruTravelClub&am=${pricing.total}&cu=INR`;
  }, [trip, pricing.total]);

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

  const validateStep = async (currentStep: number) => {
    if (currentStep === 1) {
      return await trigger(['travelerName', 'email', 'phone', 'age', 'gender', 'emergencyName', 'emergencyPhone']);
    }
    if (currentStep === 2) {
      return await trigger(['pickupPoint', 'seatCount', 'specialRequests']);
    }
    return true;
  };

  const nextStep = async () => {
    const isValid = await validateStep(step);
    if (isValid) {
      setStep(s => Math.min(s + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleCreateBooking = async (data: BookingFormData) => {
    setLoading(true);
    try {
      const bookingData = { ...data, tripId, totalAmount: pricing.total, isManualPayment: true };
      const res = await api.bookings.create(bookingData);
      if (!res || !res.booking) throw new Error('Booking initialization failed');
      setCreatedBookingId(res.booking.id);
      setBookingRef(res.booking.bookingRef);
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      toast.error(error.message || 'Booking submission failed');
    } finally {
      setLoading(false);
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
      setStep(5);
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
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        
        {/* Modern Apple-style Header */}
        <div className="text-center mb-12 flex flex-col items-center">
          <Image src="https://cdn.corenexis.com/files/c/7115481720.png" alt="Mysuru Travel Club Logo" width={60} height={60} className="mb-4" />
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 font-outfit tracking-tight">Complete Your Booking</h1>
          <p className="text-slate-500 mt-2 text-sm max-w-lg mx-auto">Secure your spot for the {trip.title} adventure.</p>
        </div>

        {/* Premium Step Progress */}
        <div className="flex items-center justify-between mb-12 relative max-w-2xl mx-auto">
          <div className="absolute top-1/2 left-0 w-full h-[3px] bg-slate-200 -translate-y-1/2 z-0 rounded-full" />
          <div 
            className="absolute top-1/2 left-0 h-[3px] bg-slate-900 -translate-y-1/2 z-0 transition-all duration-700 ease-in-out rounded-full" 
            style={{ width: `${((step - 1) / 4) * 100}%` }}
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
              <span className={`text-[10px] uppercase font-bold tracking-widest mt-2 hidden sm:block ${step >= s.n ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm p-6 md:p-10">
              <AnimatePresence mode="wait">
                
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 mb-2 font-outfit">Traveler Details</h2>
                      <p className="text-slate-500 text-sm mb-6">Enter the primary traveler's information.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Full Name</label>
                          <input {...register('travelerName')} className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-3.5 outline-none focus:border-slate-400 focus:bg-white transition-all" placeholder="John Doe" />
                          {errors.travelerName && <p className="text-red-500 text-xs font-bold">{errors.travelerName.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Email Address</label>
                          <input type="email" {...register('email')} className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-3.5 outline-none focus:border-slate-400 focus:bg-white transition-all" placeholder="john@example.com" />
                          {errors.email && <p className="text-red-500 text-xs font-bold">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Phone Number</label>
                          <input type="tel" {...register('phone')} className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-3.5 outline-none focus:border-slate-400 focus:bg-white transition-all" placeholder="+91 9876543210" />
                          {errors.phone && <p className="text-red-500 text-xs font-bold">{errors.phone.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Age</label>
                          <input type="number" {...register('age', { valueAsNumber: true })} className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-3.5 outline-none focus:border-slate-400 focus:bg-white transition-all" placeholder="25" />
                          {errors.age && <p className="text-red-500 text-xs font-bold">{errors.age.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Gender</label>
                          <select {...register('gender')} className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-3.5 outline-none focus:border-slate-400 focus:bg-white transition-all cursor-pointer">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <h2 className="text-xl font-black text-slate-900 mb-2 font-outfit">Emergency Contact</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Contact Name</label>
                          <input {...register('emergencyName')} className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-3.5 outline-none focus:border-slate-400 focus:bg-white transition-all" placeholder="Jane Doe" />
                          {errors.emergencyName && <p className="text-red-500 text-xs font-bold">{errors.emergencyName.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Contact Phone</label>
                          <input type="tel" {...register('emergencyPhone')} className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-3.5 outline-none focus:border-slate-400 focus:bg-white transition-all" placeholder="+91 9123456789" />
                          {errors.emergencyPhone && <p className="text-red-500 text-xs font-bold">{errors.emergencyPhone.message}</p>}
                        </div>
                      </div>
                    </div>
                    
                    <button type="button" onClick={nextStep} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md">
                      Continue to Options <HiOutlineArrowRight />
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 mb-2 font-outfit">Trip Options</h2>
                      <p className="text-slate-500 text-sm mb-6">Select your boarding point and group size.</p>
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Boarding Point</label>
                          <div className="relative">
                            <select {...register('pickupPoint')} className="w-full appearance-none bg-slate-50/50 border border-slate-200 text-slate-900 font-semibold rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-slate-400 focus:bg-white transition-all cursor-pointer">
                              <option value="">Select Boarding Location</option>
                              {trip.pickupPoints?.map((pt: any, i: number) => (
                                <option key={i} value={pt.location}>{pt.location} - {pt.time}</option>
                              ))}
                            </select>
                            <HiOutlineLocationMarker className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                          </div>
                          {errors.pickupPoint && <p className="text-red-500 text-xs font-bold mt-1">{errors.pickupPoint.message}</p>}
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Number of Travelers</label>
                          <div className="flex items-center gap-4 max-w-[200px]">
                            <button type="button" onClick={() => setValue('seatCount', Math.max(1, seatCount - 1))} className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold text-xl cursor-pointer">-</button>
                            <div className="flex-1 text-center font-black text-2xl text-slate-900">{seatCount}</div>
                            <button type="button" onClick={() => setValue('seatCount', Math.min(trip.availableSeats, 20, seatCount + 1))} className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold text-xl cursor-pointer">+</button>
                          </div>
                          <p className="text-xs text-slate-400">{trip.availableSeats} seats remaining</p>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Special Requests (Optional)</label>
                          <textarea {...register('specialRequests')} rows={3} className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 font-medium rounded-xl p-4 outline-none focus:border-slate-400 focus:bg-white transition-all resize-none" placeholder="Any dietary preferences, medical conditions, or room requirements?" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button type="button" onClick={prevStep} className="py-4 px-8 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all cursor-pointer">Back</button>
                      <button type="button" onClick={nextStep} className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer flex justify-center items-center gap-2">Review Details <HiOutlineArrowRight /></button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 mb-6 font-outfit">Review & Pay</h2>
                      
                      <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100 mb-6">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-200 pb-3">Price Breakdown</h3>
                        
                        <div className="space-y-4 text-sm font-medium">
                          <div className="flex justify-between items-center text-slate-700">
                            <span>Base Fare (₹{trip.price.toLocaleString()} × {seatCount})</span>
                            <span className="font-bold text-slate-900">₹{pricing.subtotal.toLocaleString()}</span>
                          </div>
                          
                          {pricing.discount > 0 && (
                            <div className="flex justify-between items-center text-emerald-600">
                              <span>Group Discount (15%)</span>
                              <span className="font-bold">-₹{pricing.discount.toLocaleString()}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center text-slate-700">
                            <span>Taxes & Platform Fees</span>
                            <span className="font-bold text-slate-900">₹{pricing.platformFee.toLocaleString()}</span>
                          </div>
                          
                          <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-2">
                            <span className="font-black text-slate-900 text-base">Total Amount</span>
                            <span className="font-black text-2xl text-slate-900 tracking-tight">₹{pricing.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 text-sm text-slate-700">
                        <HiOutlineCheckCircle className="w-5 h-5 shrink-0 text-slate-500 mt-0.5" />
                        <div>By continuing, you agree to our terms and conditions. Your booking will be confirmed after payment verification.</div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button type="button" onClick={prevStep} className="py-4 px-8 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all cursor-pointer">Back</button>
                      <button type="button" onClick={handleSubmit(handleCreateBooking)} disabled={loading} className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center cursor-pointer gap-2">
                        {loading ? 'Processing...' : `Pay ₹${pricing.total.toLocaleString()}`} <HiOutlineArrowRight />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-2xl font-black text-slate-900 mb-2 font-outfit">Complete UPI Payment</h2>
                      <p className="text-slate-500 text-sm">Scan the QR code or tap to pay with any UPI app.</p>
                    </div>

                    <div className="flex flex-col items-center p-8 bg-slate-50/80 border border-slate-200 rounded-[2rem] mx-auto max-w-sm shadow-inner">
                      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 mb-6 flex justify-center w-64 h-64 mx-auto relative overflow-hidden">
                        <img 
                          src="https://cdn.corenexis.com/files/c/8845266720.png" 
                          alt="UPI Payment QR Code" 
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      
                      <div className="text-center mb-6">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total to Pay</div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight mb-2">₹{pricing.total.toLocaleString()}</div>
                        <div className="text-xs text-slate-500 mb-4">UPI ID: <span className="font-bold text-slate-800">{upiId}</span></div>
                        
                        <div className="bg-slate-100/50 p-4 rounded-xl text-left border border-slate-200/50">
                          <ul className="text-xs text-slate-600 space-y-2 font-medium">
                            <li className="flex items-start gap-2">
                              <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                              <span>Scan using PhonePe, Google Pay, Paytm, or any UPI app</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                              <span>Complete payment of ₹{pricing.total.toLocaleString()}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                              <span>Upload payment screenshot for admin verification</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="w-full grid grid-cols-2 gap-3 mb-2 sm:grid-cols-4">
                        <a href={`phonepe://pay?pa=${upiId}&pn=MysuruTravelClub&am=${pricing.total}&cu=INR`} className="py-3 px-2 bg-[#5f259f] rounded-xl text-center text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#4d1f81]">PhonePe</a>
                        <a href={`gpay://upi/pay?pa=${upiId}&pn=MysuruTravelClub&am=${pricing.total}&cu=INR`} className="py-3 px-2 bg-[#4285F4] rounded-xl text-center text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#3367d6]">GPay</a>
                        <a href={`paytmmp://pay?pa=${upiId}&pn=MysuruTravelClub&am=${pricing.total}&cu=INR`} className="py-3 px-2 bg-[#00baf2] rounded-xl text-center text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#00a3d9]">Paytm</a>
                        <a href={`bhim://pay?pa=${upiId}&pn=MysuruTravelClub&am=${pricing.total}&cu=INR`} className="py-3 px-2 bg-[#f89c1e] rounded-xl text-center text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#e08914]">BHIM</a>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Upload Payment Screenshot</h3>
                      
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileChange(e); }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                          dragActive ? 'border-slate-800 bg-slate-50' : 'border-slate-300 hover:border-slate-400 bg-white'
                        }`}
                      >
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        
                        {previewUrl ? (
                          <div className="relative">
                            <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded-xl shadow-sm border border-slate-200" />
                            <div className="absolute -top-3 -right-3 bg-white text-red-500 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold shadow-md cursor-pointer hover:bg-red-50 transition-colors" onClick={(e) => { e.stopPropagation(); setScreenshot(null); setPreviewUrl(null); }}>Remove</div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center space-y-3">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-900 border border-slate-200 shadow-sm">
                              <HiOutlineUpload className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">Click or drag image here</p>
                              <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button type="button" onClick={submitPayment} disabled={loading || !screenshot} className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
                      !screenshot ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                    }`}>
                      {loading ? 'Submitting Verification...' : 'Complete Booking'}
                    </button>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div key="step5" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
                    <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-slate-900/20">
                      <HiOutlineCheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4 font-outfit tracking-tight">Payment Submitted</h2>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                      Your payment screenshot has been uploaded and is under review. Your booking reference is <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{bookingRef}</span>.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button type="button" onClick={() => router.push(`/booking/status?ref=${bookingRef}`)} className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md transition-colors">
                        Track Status
                      </button>
                      <button type="button" onClick={() => router.push('/')} className="w-full sm:w-auto px-8 py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-colors">
                        Return Home
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {step < 5 && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm p-6 sticky top-28">
                <h3 className="text-lg font-black text-slate-900 mb-5 font-outfit">Your Selection</h3>
                <div className="relative h-48 rounded-2xl overflow-hidden mb-5 border border-slate-100">
                  <Image src={trip.coverImage} alt="Trip" fill className="object-cover" />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-slate-900 shadow-sm border border-slate-200/50">
                    {trip.destination}
                  </div>
                </div>
                
                <h4 className="font-bold text-slate-900 text-base mb-1">{trip.title}</h4>
                <p className="text-[13px] font-medium text-slate-500 mb-6">{new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}</p>
                
                <div className="space-y-3.5">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5"><HiOutlineUser className="w-4 h-4 text-slate-400" /> Travelers</span>
                    <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{seatCount}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5"><HiOutlineLocationMarker className="w-4 h-4 text-slate-400" /> Boarding</span>
                    <span className="font-bold text-slate-900 truncate max-w-[140px]" title={watch('pickupPoint') || 'Not selected'}>
                      {watch('pickupPoint') || 'Not selected'}
                    </span>
                  </div>
                  
                  <div className="pt-5 mt-5 border-t border-slate-100">
                    <div className="flex justify-between items-end">
                      <span className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Total</span>
                      <span className="font-black text-2xl text-slate-900 tracking-tight">₹{pricing.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
