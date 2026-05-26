'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineChartBar, HiOutlineMap, HiOutlineTicket, 
  HiOutlineChatAlt, HiOutlineDocumentText, HiOutlineLogout,
  HiOutlineUser, HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, 
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineLocationMarker, 
  HiOutlineUsers, HiOutlineCog
} from 'react-icons/hi';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import CreateTripModal from '@/components/admin/CreateTripModal';
import MarketplaceManager from '@/components/admin/MarketplaceManager';
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000');

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [crew, setCrew] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);
  const [isAddingTrip, setIsAddingTrip] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any>(null);

  const [editingCrew, setEditingCrew] = useState<any>(null);
  const [crewForm, setCrewForm] = useState({
    name: '',
    role: '',
    image: '',
    contact: '',
    instagram: '',
    description: ''
  });

  useEffect(() => {
    if (editingCrew) {
      setCrewForm({
        name: editingCrew.name || '',
        role: editingCrew.role || '',
        image: editingCrew.image || '',
        contact: editingCrew.contact || '',
        instagram: editingCrew.instagram || '',
        description: editingCrew.description || ''
      });
    } else {
      setCrewForm({
        name: '',
        role: '',
        image: '',
        contact: '',
        instagram: '',
        description: ''
      });
    }
  }, [editingCrew]);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    try {
      setLoading(true);
      const [statsData, tripsData, bookingsData, blogsData, crewData, settingsData] = await Promise.all([
        api.auth.dashboard(token),
        api.trips.getAll(),
        api.bookings.getAll(token),
        api.blogs.getAll(),
        api.crew.getAll(),
        api.settings.getAll()
      ]);
      setStats(statsData.stats);
      setTrips(tripsData.trips);
      setBookings(bookingsData.bookings);
      setBlogs(blogsData.blogs);
      setCrew(crewData);
      setSettings(settingsData);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('tripnova_admin_token');
    const user = localStorage.getItem('tripnova_admin_user');
    if (!token) { router.push('/admin/login'); return; }
    setAdmin(user ? JSON.parse(user) : null);
    fetchData();

    (window as any).startLiveTracking = (tripId: string, lat: number, lng: number) => {
      socket.emit('start_live_tracking', { tripId, lat, lng });
      toast.success('Live Location Started!');
      fetchData();
    };
  }, [router, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('tripnova_admin_token');
    localStorage.removeItem('tripnova_admin_user');
    toast.success('Logged out successfully');
    router.push('/admin/login');
  };

  const deleteTrip = async (id: string) => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    try {
      await api.trips.delete(id, token);
      setTrips(trips.filter(t => t.id !== id));
      toast.success('Trip deleted');
    } catch (err) { toast.error('Failed to delete trip'); }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    try {
      await api.bookings.updateStatus(id, status, token);
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
      toast.success(`Booking ${status}`);
    } catch (err) { toast.error('Failed to update booking'); }
  };

  const deleteCrew = async (id: string) => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    try {
      await api.crew.delete(id, token);
      setCrew(crew.filter(c => c.id !== id));
      toast.success('Crew member removed');
    } catch (err) { toast.error('Failed to remove crew member'); }
  };

  const navItems = [
    { label: 'Overview', icon: HiOutlineChartBar, color: 'text-purple-400' },
    { label: 'Marketplace', icon: HiOutlineMap, color: 'text-emerald-400' },
    { label: 'Trips', icon: HiOutlineMap, color: 'text-blue-400' },
    { label: 'Bookings', icon: HiOutlineTicket, color: 'text-pink-400' },
    { label: 'Crew', icon: HiOutlineUsers, color: 'text-amber-400' },
    { label: 'Blogs', icon: HiOutlineDocumentText, color: 'text-indigo-400' },
    { label: 'Settings', icon: HiOutlineCog, color: 'text-cyan-400' },
  ];

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    const formData = new FormData(e.currentTarget);
    const newSettings: any = {};
    formData.forEach((value, key) => { newSettings[key] = value; });
    try {
      await api.settings.update(newSettings, token);
      setSettings({ ...settings, ...newSettings });
      toast.success('Settings updated securely');
    } catch (err) { toast.error('Failed to update settings'); }
  };

  return (
    <div className="min-h-screen bg-[#030014] flex text-white relative overflow-hidden font-outfit">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-72 border-r border-white/[0.08] bg-[#070327]/60 backdrop-blur-2xl hidden lg:flex flex-col p-6 sticky top-0 h-screen z-20">
        <div className="flex items-center gap-3.5 mb-12 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-purple-500 to-accent-cyan flex items-center justify-center font-bold shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            <span className="text-xl text-white">T</span>
          </div>
          <span className="font-outfit font-black tracking-tight text-xl">Trip<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-cyan">Nova</span></span>
        </div>
        
        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <button 
              key={item.label} 
              onClick={() => setActiveTab(item.label)} 
              className={`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl transition-all duration-300 text-sm font-semibold border ${
                activeTab === item.label 
                  ? 'bg-gradient-to-r from-primary-600/20 to-purple-600/10 text-white border-primary-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                  : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/[0.03]'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.label ? item.color : 'text-white/30'}`} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-3.5 px-5 py-4 text-white/40 hover:text-red-400 border border-transparent hover:border-red-500/20 hover:bg-red-500/5 rounded-2xl transition-all duration-300 text-sm font-bold mt-auto"
        >
          <HiOutlineLogout className="w-5 h-5" />
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col z-10">
        <header className="h-20 border-b border-white/[0.08] flex items-center justify-between px-8 bg-[#070327]/30 backdrop-blur-md sticky top-0 z-30">
          <h2 className="font-black text-xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">{activeTab}</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3.5 pl-6 border-l border-white/[0.08]">
              <div className="text-right">
                <p className="text-sm font-black">{admin?.name || 'Admin'}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-accent-cyan font-extrabold">Super Admin</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-sm font-black border border-white/[0.1] shadow-md">{admin?.name?.charAt(0) || 'A'}</div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {isAddingTrip && <CreateTripModal onClose={() => setIsAddingTrip(false)} onSuccess={() => { setIsAddingTrip(false); fetchData(); }} />}
          {editingTrip && <CreateTripModal trip={editingTrip} onClose={() => setEditingTrip(null)} onSuccess={() => { setEditingTrip(null); fetchData(); }} />}
          
          <AnimatePresence mode="wait">
            {activeTab === 'Overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  {[
                    { label: 'Total Revenue', value: `₹${stats?.totalRevenue?.toLocaleString() || '0'}`, color: 'text-emerald-400', glow: 'shadow-emerald-500/5 border-emerald-500/10' },
                    { label: 'Total Bookings', value: stats?.totalBookings || '0', color: 'text-primary-400', glow: 'shadow-primary-500/5 border-primary-500/10' },
                    { label: 'Active Trips', value: stats?.totalTrips || '0', color: 'text-cyan-400', glow: 'shadow-cyan-500/5 border-cyan-500/10' },
                    { label: 'Upcoming Trips', value: stats?.upcomingTrips || '0', color: 'text-purple-400', glow: 'shadow-purple-500/5 border-purple-500/10' }
                  ].map((stat, i) => (
                    <div key={i} className={`glass-card p-6 border border-white/[0.06] hover:scale-103 transition-transform duration-300 shadow-lg ${stat.glow}`}>
                      <p className="text-white/40 text-[10px] font-extrabold uppercase tracking-widest mb-4 font-outfit">{stat.label}</p>
                      <h3 className={`text-3xl font-black ${stat.color} font-outfit`}>{stat.value}</h3>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'Marketplace' && (
              <motion.div key="marketplace" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="glass-card p-6 border-white/[0.06]">
                  <MarketplaceManager />
                </div>
              </motion.div>
            )}

            {activeTab === 'Trips' && (
              <motion.div key="trips" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black font-outfit">Manage Trips</h3>
                  <button onClick={() => setIsAddingTrip(true)} className="btn-primary flex items-center gap-2 py-3 px-6"><HiOutlinePlus className="w-5 h-5" />Create New Trip</button>
                </div>
                <div className="space-y-4">
                  {trips.map(trip => (
                    <div key={trip.id} className="glass-card p-4.5 flex flex-col md:flex-row md:items-center gap-6 border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03] transition-all duration-300">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-white/[0.08] shadow-md">
                        <img src={trip.coverImage} className="w-full h-full object-cover" alt={trip.title} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg font-outfit text-white mb-1.5">{trip.title}</h4>
                        <p className="text-white/40 text-sm font-medium">{trip.destination} • <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-cyan font-bold">₹{trip.price}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const lat = prompt('Enter Lat:', trip.currentLat || trip.latitude || '19.076');
                            const lng = prompt('Enter Lng:', trip.currentLng || trip.longitude || '72.877');
                            if (lat && lng) (window as any).startLiveTracking?.(trip.id, parseFloat(lat), parseFloat(lng));
                          }}
                          className={`p-2.5 rounded-xl border transition-all duration-300 ${trip.isLiveTracking ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-white/[0.02] border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.06]'}`}
                          title="Start live tracking"
                        >
                          <HiOutlineLocationMarker className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setEditingTrip(trip)} 
                          className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.06] hover:border-primary-500/30 transition-all duration-300"
                          title="Edit trip"
                        >
                          <HiOutlinePencil className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deleteTrip(trip.id)} 
                          className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300"
                          title="Delete trip"
                        >
                          <HiOutlineTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'Bookings' && (
              <motion.div key="bookings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h3 className="text-2xl font-black mb-8 font-outfit">Bookings</h3>
                <div className="glass-card overflow-hidden border-white/[0.06] shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white/[0.03] text-white/50 text-[10px] font-extrabold uppercase tracking-widest border-b border-white/[0.06]">
                        <tr>
                          <th className="px-6 py-4.5">Ref</th>
                          <th className="px-6 py-4.5">Traveler</th>
                          <th className="px-6 py-4.5">Trip</th>
                          <th className="px-6 py-4.5">Status</th>
                          <th className="px-6 py-4.5">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {bookings.map(booking => (
                          <tr key={booking.id} className="text-sm hover:bg-white/[0.01] transition-colors duration-200">
                            <td className="px-6 py-4 font-mono font-bold text-accent-cyan">{booking.bookingRef}</td>
                            <td className="px-6 py-4 font-semibold text-white/80">{booking.travelerName}</td>
                            <td className="px-6 py-4 text-white/70">{booking.trip?.title}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                                booking.status === 'CONFIRMED' 
                                  ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                                  : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-3">
                                <button onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')} className="p-1 text-white/40 hover:text-green-400 transition-colors" title="Confirm Booking"><HiOutlineCheckCircle className="w-5.5 h-5.5" /></button>
                                <button onClick={() => updateBookingStatus(booking.id, 'CANCELLED')} className="p-1 text-white/40 hover:text-red-400 transition-colors" title="Cancel Booking"><HiOutlineXCircle className="w-5.5 h-5.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Crew' && (
              <motion.div key="crew" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black font-outfit">Our Crew</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Add Crew Form */}
                  <div className="lg:col-span-1">
                    <div className="glass-card p-6 border-white/[0.06] shadow-xl">
                      <h4 className="font-bold text-lg mb-6 font-outfit text-white">{editingCrew ? `Edit Member: ${editingCrew.name}` : 'Add New Member'}</h4>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const token = localStorage.getItem('tripnova_admin_token');
                        if (!token) return;
                        try {
                          if (editingCrew) {
                            const res = await api.crew.update(editingCrew.id, crewForm, token);
                            setCrew(crew.map(c => c.id === editingCrew.id ? res : c));
                            toast.success('Crew member updated successfully');
                            setEditingCrew(null);
                          } else {
                            const res = await api.crew.create(crewForm, token);
                            setCrew([res, ...crew]);
                            toast.success('Crew member added successfully');
                          }
                          setCrewForm({
                            name: '',
                            role: '',
                            image: '',
                            contact: '',
                            instagram: '',
                            description: ''
                          });
                        } catch (err) {
                          toast.error(editingCrew ? 'Failed to update crew member' : 'Failed to add crew member');
                        }
                      }} className="space-y-5">
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Full Name</label>
                          <input name="name" required placeholder="Full Name" className="input-field" value={crewForm.name} onChange={e => setCrewForm({...crewForm, name: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Role</label>
                          <input name="role" required placeholder="Role (e.g. Lead Guide)" className="input-field" value={crewForm.role} onChange={e => setCrewForm({...crewForm, role: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Image URL</label>
                          <input name="image" required placeholder="Image URL" className="input-field" value={crewForm.image} onChange={e => setCrewForm({...crewForm, image: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Contact Info (Optional)</label>
                          <input name="contact" placeholder="Contact Info" className="input-field" value={crewForm.contact} onChange={e => setCrewForm({...crewForm, contact: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Instagram (Optional)</label>
                          <input name="instagram" placeholder="Instagram Username" className="input-field" value={crewForm.instagram} onChange={e => setCrewForm({...crewForm, instagram: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Short Bio</label>
                          <textarea name="description" required placeholder="Short Description / Bio (Required)" className="input-field py-3 resize-none" rows={3} value={crewForm.description} onChange={e => setCrewForm({...crewForm, description: e.target.value})} />
                        </div>
                        <button type="submit" className="btn-primary w-full py-3.5">{editingCrew ? 'Save Changes' : 'Add Member'}</button>
                        {editingCrew && (
                          <button type="button" onClick={() => setEditingCrew(null)} className="w-full py-3.5 bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.05] rounded-xl transition-all duration-300 text-sm font-semibold">Cancel Edit</button>
                        )}
                      </form>
                    </div>
                  </div>

                  {/* Crew List */}
                  <div className="lg:col-span-2 space-y-4">
                    {crew.length === 0 ? (
                      <div className="glass-card p-12 text-center text-white/20 font-bold border-dashed border-2 border-white/[0.08]">No crew members yet.</div>
                    ) : (
                      crew.map(member => (
                        <div key={member.id} className="glass-card p-4.5 flex items-center gap-6 border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03] transition-all duration-300">
                          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-white/5 border border-white/[0.08] shadow-md">
                            {member.image && <img src={member.image} className="w-full h-full object-cover" alt={member.name} />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg font-outfit text-white mb-1">{member.name}</h4>
                            <p className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-cyan text-xs uppercase tracking-widest font-extrabold">{member.role}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingCrew(member)} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.06] hover:border-primary-500/30 transition-all duration-300" title="Edit member"><HiOutlinePencil className="w-5 h-5" /></button>
                            <button onClick={() => deleteCrew(member.id)} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300" title="Delete member"><HiOutlineTrash className="w-5 h-5" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black font-outfit">Global Settings</h3>
                  <p className="text-white/40 text-sm font-semibold">Control website content dynamically</p>
                </div>
                
                <form onSubmit={handleSaveSettings} className="space-y-8">
                  {/* Hero Section Settings */}
                  <div className="glass-card p-6 border-white/[0.06] shadow-xl">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2 font-outfit text-white"><HiOutlineMap className="w-5.5 h-5.5 text-primary-400"/> Hero Section</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Hero Video URL</label>
                        <input name="heroVideoUrl" defaultValue={settings.heroVideoUrl || '/videos/hero-bg.mp4'} className="input-field" placeholder="/videos/hero-bg.mp4 or https://..." />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Hero Tagline</label>
                        <input name="heroTagline" defaultValue={settings.heroTagline || 'Explore the Extraordinary'} className="input-field" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Cinematic Film URL (For "Watch Film" Button)</label>
                      <input name="filmVideoUrl" defaultValue={settings.filmVideoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ'} className="input-field" placeholder="YouTube Embed URL..." />
                    </div>
                  </div>

                  {/* General / Theme Settings */}
                  <div className="glass-card p-6 border-white/[0.06] shadow-xl">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2 font-outfit text-white"><HiOutlineCog className="w-5.5 h-5.5 text-primary-400"/> General Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Site Name</label>
                        <input name="siteName" defaultValue={settings.siteName || 'MYSURU TRAVEL CLUB'} className="input-field" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Contact Email</label>
                        <input name="contactEmail" defaultValue={settings.contactEmail || 'hello@mysurutravelclub.com'} className="input-field" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Contact Phone</label>
                        <input name="contactPhone" defaultValue={settings.contactPhone || '+91 98765 43210'} className="input-field" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Contact Address</label>
                        <input name="contactAddress" defaultValue={settings.contactAddress || 'Mysuru, Karnataka, India'} className="input-field" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Footer Description</label>
                        <textarea name="footerDescription" defaultValue={settings.footerDescription || ''} className="input-field" rows={2} placeholder="AI-powered travel experiences that transform..." />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Site Notice (Top Banner)</label>
                        <input name="siteNotice" defaultValue={settings.siteNotice || ''} className="input-field" placeholder="Leave empty to hide..." />
                      </div>
                    </div>
                  </div>

                  {/* SEO & Socials */}
                  <div className="glass-card p-6 border-white/[0.06] shadow-xl">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2 font-outfit text-white"><HiOutlineDocumentText className="w-5.5 h-5.5 text-primary-400"/> SEO & Social Links</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Global Meta Title</label>
                        <input name="metaTitle" defaultValue={settings.metaTitle || 'TripNova — Luxury Travel'} className="input-field" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Global Meta Description</label>
                        <input name="metaDescription" defaultValue={settings.metaDescription || 'AI-Powered luxury travel platform.'} className="input-field" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Instagram</label>
                        <input name="socialInsta" defaultValue={settings.socialInsta || 'https://instagram.com'} className="input-field" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Twitter/X</label>
                        <input name="socialTwitter" defaultValue={settings.socialTwitter || 'https://twitter.com'} className="input-field" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-2 block font-outfit">Facebook</label>
                        <input name="socialFacebook" defaultValue={settings.socialFacebook || 'https://facebook.com'} className="input-field" />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary py-4 px-8 w-full md:w-auto">Save All Settings</button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
