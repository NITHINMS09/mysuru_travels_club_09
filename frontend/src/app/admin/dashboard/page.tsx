'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineChartBar, HiOutlineMap, HiOutlineTicket, 
  HiOutlineChatAlt, HiOutlineDocumentText, HiOutlineLogout,
  HiOutlineUser, HiOutlineBell, HiOutlineSearch, HiOutlinePlus,
  HiOutlineTrash, HiOutlinePencil, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineLocationMarker, HiOutlineUsers, HiOutlineCog
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
    { label: 'Overview', icon: HiOutlineChartBar },
    { label: 'Marketplace', icon: HiOutlineMap },
    { label: 'Trips', icon: HiOutlineMap },
    { label: 'Bookings', icon: HiOutlineTicket },
    { label: 'Crew', icon: HiOutlineUsers },
    { label: 'Blogs', icon: HiOutlineDocumentText },
    { label: 'Chat', icon: HiOutlineChatAlt },
    { label: 'Settings', icon: HiOutlineCog },
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
    <div className="min-h-screen bg-[#050816] flex text-white">
      <aside className="w-64 border-r border-white/5 bg-[#0a0e27]/50 backdrop-blur-xl hidden lg:flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center font-bold">T</div>
          <span className="font-outfit font-black tracking-tight text-xl">Trip<span className="text-primary-500">Nova</span></span>
        </div>
        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <button key={item.label} onClick={() => setActiveTab(item.label)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === item.label ? 'bg-primary-600/10 text-primary-400 border border-primary-500/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-white/40 hover:text-red-400 transition-colors text-sm font-medium mt-auto"><HiOutlineLogout className="w-5 h-5" />Sign Out</button>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0e27]/20 backdrop-blur-md sticky top-0 z-30">
          <h2 className="font-bold text-lg">{activeTab}</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
              <div className="text-right"><p className="text-sm font-bold">{admin?.name || 'Admin'}</p><p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Super Admin</p></div>
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold border-2 border-primary-500/20">{admin?.name?.charAt(0) || 'A'}</div>
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
                    { label: 'Total Revenue', value: `₹${stats?.totalRevenue?.toLocaleString() || '0'}`, color: 'text-green-400' },
                    { label: 'Total Bookings', value: stats?.totalBookings || '0', color: 'text-primary-400' },
                    { label: 'Active Trips', value: stats?.totalTrips || '0', color: 'text-cyan-400' },
                    { label: 'Upcoming Trips', value: stats?.upcomingTrips || '0', color: 'text-purple-400' }
                  ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 border-white/5">
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">{stat.label}</p>
                      <h3 className={`text-3xl font-black ${stat.color}`}>{stat.value}</h3>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'Marketplace' && (
              <motion.div key="marketplace" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <MarketplaceManager />
              </motion.div>
            )}

            {activeTab === 'Trips' && (
              <motion.div key="trips" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black">Manage Trips</h3>
                  <button onClick={() => setIsAddingTrip(true)} className="btn-primary flex items-center gap-2"><HiOutlinePlus className="w-5 h-5" />Create New Trip</button>
                </div>
                <div className="space-y-4">
                  {trips.map(trip => (
                    <div key={trip.id} className="glass-card p-4 flex items-center gap-6 border-white/5">
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"><img src={trip.coverImage} className="w-full h-full object-cover" alt="" /></div>
                      <div className="flex-1"><h4 className="font-bold text-lg">{trip.title}</h4><p className="text-white/40 text-sm">{trip.destination} • ₹{trip.price}</p></div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const lat = prompt('Enter Lat:', trip.currentLat || trip.latitude || '19.076');
                            const lng = prompt('Enter Lng:', trip.currentLng || trip.longitude || '72.877');
                            if (lat && lng) (window as any).startLiveTracking?.(trip.id, parseFloat(lat), parseFloat(lng));
                          }}
                          className={`p-2 rounded-lg transition-all ${trip.isLiveTracking ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/5 text-white/40'}`}
                        ><HiOutlineLocationMarker className="w-5 h-5" /></button>
                        <button onClick={() => setEditingTrip(trip)} className="p-2 hover:bg-white/5 rounded-lg"><HiOutlinePencil className="w-5 h-5 text-white/40" /></button>
                        <button onClick={() => deleteTrip(trip.id)} className="p-2 hover:bg-red-500/10 rounded-lg"><HiOutlineTrash className="w-5 h-5 text-red-400" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'Bookings' && (
              <motion.div key="bookings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h3 className="text-2xl font-black mb-8">Bookings</h3>
                <div className="glass-card overflow-hidden border-white/5">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-white/40 text-xs uppercase tracking-widest">
                      <tr><th className="px-6 py-4">Ref</th><th className="px-6 py-4">Traveler</th><th className="px-6 py-4">Trip</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bookings.map(booking => (
                        <tr key={booking.id} className="text-sm">
                          <td className="px-6 py-4 font-mono">{booking.bookingRef}</td>
                          <td className="px-6 py-4">{booking.travelerName}</td>
                          <td className="px-6 py-4">{booking.trip?.title}</td>
                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${booking.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{booking.status}</span></td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')} className="p-1 hover:text-green-400"><HiOutlineCheckCircle className="w-5 h-5" /></button>
                              <button onClick={() => updateBookingStatus(booking.id, 'CANCELLED')} className="p-1 hover:text-red-400"><HiOutlineXCircle className="w-5 h-5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'Crew' && (
              <motion.div key="crew" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black">Our Crew</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Add Crew Form */}
                  <div className="lg:col-span-1">
                    <div className="glass-card p-6 border-white/5">
                      <h4 className="font-bold text-lg mb-4">{editingCrew ? `Edit Member: ${editingCrew.name}` : 'Add New Member'}</h4>
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
                      }} className="space-y-4">
                        <input name="name" required placeholder="Full Name" className="input-field" value={crewForm.name} onChange={e => setCrewForm({...crewForm, name: e.target.value})} />
                        <input name="role" required placeholder="Role (e.g. Lead Guide)" className="input-field" value={crewForm.role} onChange={e => setCrewForm({...crewForm, role: e.target.value})} />
                        <input name="image" required placeholder="Image URL" className="input-field" value={crewForm.image} onChange={e => setCrewForm({...crewForm, image: e.target.value})} />
                        <input name="contact" placeholder="Contact Info (Optional)" className="input-field" value={crewForm.contact} onChange={e => setCrewForm({...crewForm, contact: e.target.value})} />
                        <input name="instagram" placeholder="Instagram Username (Optional)" className="input-field" value={crewForm.instagram} onChange={e => setCrewForm({...crewForm, instagram: e.target.value})} />
                        <textarea name="description" required placeholder="Short Description / Bio (Required)" className="input-field py-2" rows={2} value={crewForm.description} onChange={e => setCrewForm({...crewForm, description: e.target.value})} />
                        <button type="submit" className="btn-primary w-full py-3">{editingCrew ? 'Save Changes' : 'Add Member'}</button>
                        {editingCrew && (
                          <button type="button" onClick={() => setEditingCrew(null)} className="w-full py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-medium">Cancel Edit</button>
                        )}
                      </form>
                    </div>
                  </div>

                  {/* Crew List */}
                  <div className="lg:col-span-2 space-y-4">
                    {crew.length === 0 ? (
                      <div className="glass-card p-12 text-center text-white/20 font-bold border-dashed border-2">No crew members yet.</div>
                    ) : (
                      crew.map(member => (
                        <div key={member.id} className="glass-card p-4 flex items-center gap-6 border-white/5">
                          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-white/5">
                            {member.image && <img src={member.image} className="w-full h-full object-cover" alt={member.name} />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg">{member.name}</h4>
                            <p className="text-white/40 text-sm uppercase tracking-widest font-bold">{member.role}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingCrew(member)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white" title="Edit member"><HiOutlinePencil className="w-5 h-5" /></button>
                            <button onClick={() => deleteCrew(member.id)} className="p-2 hover:bg-red-500/10 rounded-lg"><HiOutlineTrash className="w-5 h-5 text-red-400" /></button>
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
                  <h3 className="text-2xl font-black">Global Settings</h3>
                  <p className="text-white/40 text-sm">Control website content dynamically</p>
                </div>
                
                <form onSubmit={handleSaveSettings} className="space-y-8">
                  {/* Hero Section Settings */}
                  <div className="glass-card p-6 border-white/5">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2"><HiOutlineMap className="w-5 h-5 text-primary-400"/> Hero Section</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Hero Video URL</label>
                        <input name="heroVideoUrl" defaultValue={settings.heroVideoUrl || '/videos/hero-bg.mp4'} className="input-field" placeholder="/videos/hero-bg.mp4 or https://..." />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Hero Tagline</label>
                        <input name="heroTagline" defaultValue={settings.heroTagline || 'Explore the Extraordinary'} className="input-field" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Cinematic Film URL (For "Watch Film" Button)</label>
                      <input name="filmVideoUrl" defaultValue={settings.filmVideoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ'} className="input-field" placeholder="YouTube Embed URL..." />
                    </div>
                  </div>

                  {/* General / Theme Settings */}
                  <div className="glass-card p-6 border-white/5">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2"><HiOutlineCog className="w-5 h-5 text-primary-400"/> General Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Site Name</label>
                        <input name="siteName" defaultValue={settings.siteName || 'MYSURU TRAVEL CLUB'} className="input-field" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Contact Email</label>
                        <input name="contactEmail" defaultValue={settings.contactEmail || 'hello@mysurutravelclub.com'} className="input-field" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Contact Phone</label>
                        <input name="contactPhone" defaultValue={settings.contactPhone || '+91 98765 43210'} className="input-field" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Contact Address</label>
                        <input name="contactAddress" defaultValue={settings.contactAddress || 'Mysuru, Karnataka, India'} className="input-field" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Footer Description</label>
                        <textarea name="footerDescription" defaultValue={settings.footerDescription || ''} className="input-field" rows={2} placeholder="AI-powered travel experiences that transform..." />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Site Notice (Top Banner)</label>
                        <input name="siteNotice" defaultValue={settings.siteNotice || ''} className="input-field" placeholder="Leave empty to hide..." />
                      </div>
                    </div>
                  </div>

                  {/* SEO & Socials */}
                  <div className="glass-card p-6 border-white/5">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2"><HiOutlineDocumentText className="w-5 h-5 text-primary-400"/> SEO & Social Links</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Global Meta Title</label>
                        <input name="metaTitle" defaultValue={settings.metaTitle || 'TripNova — Luxury Travel'} className="input-field" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Global Meta Description</label>
                        <input name="metaDescription" defaultValue={settings.metaDescription || 'AI-Powered luxury travel platform.'} className="input-field" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Instagram</label>
                        <input name="socialInsta" defaultValue={settings.socialInsta || 'https://instagram.com'} className="input-field" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Twitter/X</label>
                        <input name="socialTwitter" defaultValue={settings.socialTwitter || 'https://twitter.com'} className="input-field" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase mb-2 block">Facebook</label>
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
