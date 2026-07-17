'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  HiOutlineCheckCircle, HiOutlineClock, HiOutlineDocumentText, 
  HiOutlineExclamationCircle, HiOutlineXCircle
} from 'react-icons/hi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function StatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get('ref');
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Partial Payment State
  const [payAmount, setPayAmount] = useState<string>('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    if (!ref) {
      setError('No booking reference provided');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const data = await api.bookings.getByRef(ref);
        setBooking(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [ref]);

  const handlePayPending = async () => {
    if (!payAmount || !screenshotFile) {
      toast.error('Please specify the amount and upload screenshot proof');
      return;
    }
    const amountVal = parseFloat(payAmount);
    if (isNaN(amountVal) || amountVal <= 0 || amountVal > (booking.totalAmount - booking.paidAmount)) {
      toast.error(`Please enter a valid payment amount up to ₹${booking.totalAmount - booking.paidAmount}`);
      return;
    }
    setSubmittingPayment(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', screenshotFile);
      formData.append('amount', amountVal.toString());
      formData.append('notes', `Additional partial payment of ₹${amountVal}`);
      
      await api.bookings.uploadScreenshot(booking.id, formData);
      toast.success('Additional payment submitted successfully!');
      
      // Reload booking details
      const updatedData = await api.bookings.getByRef(ref as string);
      setBooking(updatedData);
      setPayAmount('');
      setScreenshotFile(null);
    } catch (err: any) {
      toast.error(err.message || 'Payment submission failed');
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 pb-20 bg-[#f8fafc] min-h-screen px-4 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="pt-24 pb-20 bg-[#f8fafc] min-h-screen px-4 flex items-center justify-center">
        <div className="text-center">
          <HiOutlineExclamationCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2 font-outfit">Booking Not Found</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary">Return Home</button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <HiOutlineCheckCircle className="w-8 h-8 text-green-500" />;
      case 'CANCELLED':
      case 'REJECTED': return <HiOutlineXCircle className="w-8 h-8 text-red-500" />;
      default: return <HiOutlineClock className="w-8 h-8 text-amber-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Payment Pending';
      case 'PENDING_VERIFICATION': return 'Payment Submitted (Awaiting Review)';
      case 'CONFIRMED': return 'Booking Confirmed';
      case 'CANCELLED': return 'Booking Cancelled';
      case 'REJECTED': return 'Payment Rejected';
      default: return status;
    }
  };

  const getPaymentStatusBadge = () => {
    const paid = booking.paidAmount || 0;
    const total = booking.totalAmount || 0;
    if (paid >= total) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-green-50 border border-green-200 text-green-700">
          Fully Paid
        </span>
      );
    } else if (paid > 0) {
      return (
        <span className="px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700">
          Partially Paid
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-red-50 border border-red-200 text-red-700">
          Pending Payment
        </span>
      );
    }
  };

  return (
    <div className="pt-20 sm:pt-24 pb-12 sm:pb-20 bg-[#f8fafc] min-h-screen px-4 text-slate-900">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card bg-white border border-slate-200/60 shadow-xl p-5 sm:p-8 rounded-3xl"
        >
          <div className="flex flex-col-reverse md:flex-row gap-6 sm:gap-8 items-start">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                  <HiOutlineDocumentText className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-outfit">Booking Status</h1>
                  <p className="text-sm text-slate-500 font-mono font-bold">Ref: {booking.bookingRef}</p>
                </div>
              </div>

              <div className="py-4">
                <div className="flex items-center gap-4 mb-4">
                  {getStatusIcon(booking.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{getStatusText(booking.status)}</h2>
                      {getPaymentStatusBadge()}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {booking.status === 'CONFIRMED' ? 'Your booking has been fully verified and confirmed.' : 
                       booking.status === 'PENDING_VERIFICATION' ? 'Your payment screenshot is under review by our team.' :
                       (booking.status === 'CANCELLED' || booking.status === 'REJECTED') ? 'This booking has been cancelled or rejected.' : 
                       'Awaiting payment completion.'}
                    </p>
                  </div>
                </div>

                {/* Progress Timeline */}
                <div className="mt-8 relative ml-2">
                  <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-200 -z-10" />
                  
                  <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/30 font-bold text-xs">
                        <HiOutlineCheckCircle className="w-5 h-5" />
                      </div>
                      <div className="pt-1.5 bg-white px-2">
                        <p className="text-sm font-bold text-slate-900">Booking Created</p>
                        <p className="text-xs text-slate-500">Traveler details saved.</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs border-2 ${
                        (booking.paidAmount || 0) === 0 ? 'bg-white border-slate-300 text-slate-400' : 'bg-primary-600 border-primary-600 text-white shadow-sm shadow-primary-500/30'
                      }`}>
                        {(booking.paidAmount || 0) === 0 ? '2' : <HiOutlineCheckCircle className="w-5 h-5" />}
                      </div>
                      <div className="pt-1.5 bg-white px-2">
                        <p className={`text-sm font-bold ${(booking.paidAmount || 0) === 0 ? 'text-slate-500' : 'text-slate-900'}`}>Payment Submitted</p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs border-2 ${
                        booking.status === 'CONFIRMED' ? 'bg-primary-600 border-primary-600 text-white shadow-sm shadow-primary-500/30' : 
                        (booking.status === 'CANCELLED' || booking.status === 'REJECTED') ? 'bg-red-500 border-red-500 text-white' :
                        booking.status === 'PENDING_VERIFICATION' ? 'bg-amber-100 border-amber-400 text-amber-600' :
                        'bg-white border-slate-300 text-slate-400'
                      }`}>
                        {booking.status === 'CONFIRMED' ? <HiOutlineCheckCircle className="w-5 h-5" /> : 
                         (booking.status === 'CANCELLED' || booking.status === 'REJECTED') ? <HiOutlineXCircle className="w-5 h-5" /> :
                         booking.status === 'PENDING_VERIFICATION' ? <HiOutlineClock className="w-5 h-5" /> : '3'}
                      </div>
                      <div className="pt-1.5 bg-white px-2">
                        <p className={`text-sm font-bold ${
                          booking.status === 'CONFIRMED' ? 'text-slate-900' : 
                          (booking.status === 'CANCELLED' || booking.status === 'REJECTED') ? 'text-red-600' :
                          booking.status === 'PENDING_VERIFICATION' ? 'text-amber-600' :
                          'text-slate-500'
                        }`}>
                          {(booking.status === 'CANCELLED' || booking.status === 'REJECTED') ? 'Booking Rejected' : 'Admin Verification'}
                        </p>
                        {booking.status === 'PENDING_VERIFICATION' && (
                          <p className="text-xs text-amber-600 mt-1">Checking your payment screenshot...</p>
                        )}
                        {booking.adminNotes && (booking.status === 'CANCELLED' || booking.status === 'REJECTED') && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-xs text-red-700">
                            <strong>Reason:</strong> {booking.adminNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                {booking.paymentHistory && booking.paymentHistory.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-widest font-outfit">Payment Transactions</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="pb-2">Date</th>
                            <th className="pb-2">Method</th>
                            <th className="pb-2">Amount</th>
                            <th className="pb-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {booking.paymentHistory.map((p: any) => (
                            <tr key={p.id} className="text-slate-600">
                              <td className="py-2.5">{new Date(p.date || p.createdAt).toLocaleDateString()}</td>
                              <td className="py-2.5 uppercase font-medium">{p.method}</td>
                              <td className="py-2.5 font-bold text-slate-800">₹{p.amount.toLocaleString()}</td>
                              <td className="py-2.5 text-right">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                  p.status === 'VERIFIED' ? 'bg-green-50 text-green-700 border border-green-200' :
                                  p.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
                                  'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Make Another Payment Form */}
                {booking.status !== 'CANCELLED' && booking.status !== 'REJECTED' && (booking.paidAmount || 0) < booking.totalAmount && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-widest font-outfit">Pay Pending Balance</h3>
                    <p className="text-xs text-slate-500 mb-4">Scan the QR code and upload the payment screenshot to clear your pending balance of <b className="text-slate-800 font-bold">₹{(booking.totalAmount - (booking.paidAmount || 0)).toLocaleString()}</b>.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
                      <div className="text-center">
                        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 w-36 h-36 mx-auto relative overflow-hidden mb-2">
                          <img src="https://cdn.corenexis.com/files/c/8845266720.png" alt="UPI QR Code" className="w-full h-full object-contain" />
                        </div>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Pay via UPI: <b>9632463347</b></p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Amount to Pay (₹)</label>
                          <input 
                            type="number"
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value)}
                            max={booking.totalAmount - (booking.paidAmount || 0)}
                            min={1}
                            className="w-full bg-white border border-slate-200 text-slate-900 font-semibold rounded-lg p-2.5 outline-none focus:border-slate-400 text-xs shadow-sm"
                            placeholder={`Max ₹${booking.totalAmount - (booking.paidAmount || 0)}`}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Upload Screenshot</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setScreenshotFile(file);
                            }}
                            className="w-full text-[11px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer shadow-sm"
                          />
                        </div>

                        <button 
                          onClick={handlePayPending}
                          disabled={submittingPayment || !screenshotFile || !payAmount}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-slate-900/10"
                        >
                          {submittingPayment ? 'Submitting...' : 'Submit Payment Proof'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button onClick={() => router.push('/')} className="btn-primary w-full py-3 text-sm">
                  Back to Home
                </button>
              </div>
            </div>

            <div className="w-full md:w-64 shrink-0 bg-slate-50 rounded-2xl border border-slate-200/60 p-3 sm:p-4">
              <div className="relative h-32 rounded-xl overflow-hidden mb-4 border border-slate-200/60">
                {booking.trip?.coverImage && (
                  <Image src={booking.trip.coverImage} alt={booking.trip.title} fill className="object-cover" />
                )}
              </div>
              <h3 className="font-bold text-[#FFFFFF] text-sm mb-1" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{booking.trip?.title}</h3>
              <p className="text-xs text-slate-500 mb-4">{booking.trip?.destination}</p>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Traveler:</span>
                  <span className="font-bold text-slate-800">{booking.travelerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Seats:</span>
                  <span className="font-bold text-slate-800">{booking.seatCount}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-semibold">Total Price:</span>
                  <span className="font-bold text-slate-800">₹{booking.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Paid Amount:</span>
                  <span className="font-bold text-[#00C853]">₹{(booking.paidAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200">
                  <span className="text-slate-500 font-black">Pending Balance:</span>
                  <span className="font-black text-rose-600">₹{(booking.totalAmount - (booking.paidAmount || 0)).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={
      <div className="pt-24 pb-20 bg-[#f8fafc] min-h-screen px-4 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <StatusContent />
    </Suspense>
  );
}
