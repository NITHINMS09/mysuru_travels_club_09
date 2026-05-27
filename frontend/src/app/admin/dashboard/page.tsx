'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineChartBar, HiOutlineMap, HiOutlineTicket, 
  HiOutlineLogout, HiOutlineUser, HiOutlinePlus, 
  HiOutlineTrash, HiOutlinePencil, HiOutlineCheckCircle, 
  HiOutlineXCircle, HiOutlineLocationMarker, HiOutlineUsers, 
  HiOutlineCog, HiOutlineDocumentText, HiOutlineSearch, 
  HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineEye,
  HiOutlineMenuAlt3, HiX
} from 'react-icons/hi';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import CreateTripModal from '@/components/admin/CreateTripModal';
import MarketplaceManager from '@/components/admin/MarketplaceManager';
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000');

function InteractiveSVGChart({ title, data, valueKey, labelKey, color = 'violet', valuePrefix = '' }: any) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-6 bg-white border border-slate-200/80 shadow-md flex-1 text-center py-12 text-slate-400">
        No chart data available
      </div>
    );
  }
  
  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 20 };
  
  const values = data.map((d: any) => d[valueKey]);
  const min = Math.min(...values) * 0.9;
  const max = Math.max(...values) * 1.1 || 1;
  const valRange = max - min;
  
  const getCoords = () => {
    return data.map((d: any, i: number) => {
      const x = padding.left + (i * (width - padding.left - padding.right)) / Math.max(1, data.length - 1);
      const val = d[valueKey];
      const y = height - padding.bottom - ((val - min) / valRange) * (height - padding.top - padding.bottom);
      return { x, y, data: d };
    });
  };
  
  const coords = getCoords();
  
  let linePath = '';
  let areaPath = '';
  
  if (coords.length > 0) {
    linePath = `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map((c: any) => `L ${c.x} ${c.y}`).join(' ');
    areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - padding.bottom} L ${coords[0].x} ${height - padding.bottom} Z`;
  }
  
  const strokeColor = color === 'violet' ? '#8b5cf6' : color === 'emerald' ? '#10b981' : '#06b6d4';
  const fillColor = color === 'violet' ? 'url(#violetGradient)' : color === 'emerald' ? 'url(#emeraldGradient)' : 'url(#cyanGradient)';
  
  return (
    <div className="glass-card bg-white p-6 border border-slate-200/80 shadow-md flex-1 relative group select-none transition-all duration-300 hover:border-slate-300">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-slate-500 text-[10px] font-extrabold uppercase tracking-widest">{title}</h4>
        {hoveredIndex !== null ? (
          <div className="text-right">
            <span className="text-xs text-slate-400 font-bold block">{coords[hoveredIndex].data[labelKey]}</span>
            <span className="text-sm font-black text-slate-800">{valuePrefix}{coords[hoveredIndex].data[valueKey].toLocaleString()}</span>
          </div>
        ) : (
          <div className="text-right">
            <span className="text-xs text-slate-400 font-bold block">Current Peak</span>
            <span className="text-sm font-black text-slate-800">{valuePrefix}{Math.max(...values).toLocaleString()}</span>
          </div>
        )}
      </div>
      
      <div className="relative w-full h-[200px]">
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding.top + ratio * (height - padding.top - padding.bottom);
            return (
              <line key={idx} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            );
          })}
          
          {/* Area under curve */}
          {areaPath && <path d={areaPath} fill={fillColor} />}
          
          {/* Trend line */}
          {linePath && <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          
          {/* Hover highlight bars */}
          {hoveredIndex !== null && (
            <line x1={coords[hoveredIndex].x} y1={padding.top} x2={coords[hoveredIndex].x} y2={height - padding.bottom} stroke="#e2e8f0" strokeWidth="1" />
          )}
          
          {/* Connection dots */}
          {coords.map((c: any, idx: number) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g key={idx}>
                <circle 
                  cx={c.x} 
                  cy={c.y} 
                  r={isHovered ? 6 : 4} 
                  fill={isHovered ? strokeColor : '#ffffff'} 
                  stroke={strokeColor} 
                  strokeWidth={isHovered ? 2.5 : 1.5} 
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                
                {(idx === 0 || idx === coords.length - 1 || (coords.length > 5 && idx === Math.floor(coords.length / 2))) && (
                  <text 
                    x={c.x} 
                    y={height - 8} 
                    textAnchor={idx === 0 ? 'start' : idx === coords.length - 1 ? 'end' : 'middle'} 
                    fill="#94a3b8" 
                    fontSize="9" 
                    fontWeight="700"
                    fontFamily="Outfit"
                  >
                    {c.data[labelKey]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Users & Admin details
  const [users, setUsers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [bannedEmails, setBannedEmails] = useState<string[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [bookingsByStatus, setBookingsByStatus] = useState<any[]>([]);

  // Search & Filter state
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');

  // Modals state
  const [selectedBookingScreenshot, setSelectedBookingScreenshot] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    phone: '',
    age: '',
    gender: '',
    emergencyName: '',
    emergencyPhone: ''
  });

  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MODERATOR'
  });

  const [editingCrew, setEditingCrew] = useState<any>(null);
  const [crewForm, setCrewForm] = useState({
    name: '',
    role: '',
    image: '',
    contact: '',
    instagram: '',
    description: '',
    order: '0',
    isVisible: 'true'
  });

  useEffect(() => {
    if (editingCrew) {
      setCrewForm({
        name: editingCrew.name || '',
        role: editingCrew.role || '',
        image: editingCrew.image || '',
        contact: editingCrew.contact || '',
        instagram: editingCrew.instagram || '',
        description: editingCrew.description || '',
        order: editingCrew.order?.toString() || '0',
        isVisible: editingCrew.isVisible !== false ? 'true' : 'false'
      });
    } else {
      setCrewForm({
        name: '',
        role: '',
        image: '',
        contact: '',
        instagram: '',
        description: '',
        order: '0',
        isVisible: 'true'
      });
    }
  }, [editingCrew]);

  useEffect(() => {
    if (editingUser) {
      setUserForm({
        name: editingUser.name || '',
        phone: editingUser.phone || '',
        age: editingUser.age?.toString() || '',
        gender: editingUser.gender || '',
        emergencyName: editingUser.emergencyName || '',
        emergencyPhone: editingUser.emergencyPhone || ''
      });
    }
  }, [editingUser]);

  useEffect(() => {
    if (editingAdmin) {
      setAdminForm({
        name: editingAdmin.name || '',
        email: editingAdmin.email || '',
        password: '',
        role: editingAdmin.role || 'MODERATOR'
      });
    } else {
      setAdminForm({
        name: '',
        email: '',
        password: '',
        role: 'MODERATOR'
      });
    }
  }, [editingAdmin]);

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
      setRecentBookings(statsData.recentBookings || []);
      setMonthlyRevenue(statsData.monthlyRevenue || []);
      setBookingsByStatus(statsData.bookingsByStatus || []);
      
      setTrips(tripsData.trips);
      setBookings(bookingsData.bookings);
      setBlogs(blogsData.blogs || []);
      setCrew(crewData || []);
      setSettings(settingsData || {});

      if (settingsData.banned_emails) {
        try {
          setBannedEmails(JSON.parse(settingsData.banned_emails));
        } catch(e) {
          setBannedEmails([]);
        }
      } else {
        setBannedEmails([]);
      }

      // Fetch users
      const usersRes = await api.auth.getUsers(token);
      setUsers(usersRes.users || []);

      // Fetch admins if SUPER_ADMIN
      const user = localStorage.getItem('tripnova_admin_user');
      const parsedAdmin = user ? JSON.parse(user) : null;
      if (parsedAdmin?.role === 'SUPER_ADMIN') {
        const adminsRes = await api.auth.getAdmins(token);
        setAdmins(adminsRes.admins || []);
      }
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
    if (!confirm('Are you sure you want to delete this trip?')) return;
    try {
      await api.trips.delete(id, token);
      setTrips(trips.filter(t => t.id !== id));
      toast.success('Trip deleted');
      fetchData();
    } catch (err) { toast.error('Failed to delete trip'); }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    try {
      await api.bookings.updateStatus(id, status, token);
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
      toast.success(`Booking ${status}`);
      fetchData();
    } catch (err) { toast.error('Failed to update booking'); }
  };

  const deleteCrew = async (id: string) => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    if (!confirm('Are you sure you want to delete this crew member?')) return;
    try {
      await api.crew.delete(id, token);
      setCrew(crew.filter(c => c.id !== id));
      toast.success('Crew member removed');
    } catch (err) { toast.error('Failed to remove crew member'); }
  };

  const handleToggleBanEmail = async (email: string) => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    const emailLower = email.toLowerCase().trim();
    let updatedBanned: string[];
    const isSuspended = bannedEmails.includes(emailLower);
    
    if (isSuspended) {
      updatedBanned = bannedEmails.filter(e => e !== emailLower);
    } else {
      updatedBanned = [...bannedEmails, emailLower];
    }
    
    try {
      await api.settings.update({ banned_emails: JSON.stringify(updatedBanned) }, token);
      setBannedEmails(updatedBanned);
      toast.success(isSuspended ? `Suspension lifted for ${email}` : `Suspended ${email}`);
      setUsers(prev => prev.map(u => u.email.toLowerCase().trim() === emailLower ? { ...u, status: isSuspended ? 'Active' : 'Banned' } : u));
    } catch (err) {
      toast.error('Failed to update ban status');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token || !editingUser) return;
    try {
      await api.auth.updateUser(editingUser.email, userForm, token);
      toast.success('Explorer profile saved');
      setEditingUser(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update explorer details');
    }
  };

  const handleDeleteUser = async (email: string) => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    if (!confirm(`Warning: This will delete all bookings and record history associated with ${email}. Proceed?`)) return;
    try {
      await api.auth.deleteUser(email, token);
      toast.success('Explorer records removed');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete explorer records');
    }
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    try {
      if (editingAdmin) {
        const payload: any = { name: adminForm.name, role: adminForm.role };
        if (adminForm.password) payload.password = adminForm.password;
        await api.auth.updateAdmin(editingAdmin.id, payload, token);
        toast.success('Administrator account updated');
        setEditingAdmin(null);
      } else {
        if (!adminForm.password) {
          toast.error('Password is required for new accounts');
          return;
        }
        await api.auth.createAdmin(adminForm, token);
        toast.success('Administrator account created');
        setIsAddingAdmin(false);
      }
      setAdminForm({ name: '', email: '', password: '', role: 'MODERATOR' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save administrator account');
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    if (id === admin?.id) {
      toast.error('You cannot delete your own account');
      return;
    }
    if (!confirm('Are you sure you want to delete this administrator account?')) return;
    try {
      await api.auth.deleteAdmin(id, token);
      toast.success('Administrator removed');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove administrator');
    }
  };

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

  const navItems = [
    { label: 'Overview', icon: HiOutlineChartBar, color: 'text-purple-600' },
    { label: 'Marketplace', icon: HiOutlineMap, color: 'text-emerald-600' },
    { label: 'Trips', icon: HiOutlineMap, color: 'text-blue-600' },
    { label: 'Bookings', icon: HiOutlineTicket, color: 'text-pink-600' },
    { label: 'Users', icon: HiOutlineUsers, color: 'text-cyan-600' },
    ...(admin?.role === 'SUPER_ADMIN' ? [{ label: 'Admins', icon: HiOutlineUser, color: 'text-violet-600' }] : []),
    { label: 'Crew', icon: HiOutlineUsers, color: 'text-amber-600' },
    { label: 'Blogs', icon: HiOutlineDocumentText, color: 'text-indigo-600' },
    { label: 'Settings', icon: HiOutlineCog, color: 'text-cyan-600' },
  ];

  // SVG Chart data formatting
  const getRevenueChartData = () => {
    if (!monthlyRevenue || monthlyRevenue.length === 0) {
      return [
        { month: 'Jan', amount: 15000 },
        { month: 'Feb', amount: 32000 },
        { month: 'Mar', amount: 28000 },
        { month: 'Apr', amount: 49000 },
        { month: 'May', amount: 65000 },
        { month: 'Jun', amount: 80000 }
      ];
    }
    const grouped: Record<string, number> = {};
    monthlyRevenue.forEach((mr: any) => {
      const d = new Date(mr.createdAt);
      const key = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      grouped[key] = (grouped[key] || 0) + (mr._sum?.amount || 0);
    });
    return Object.entries(grouped).map(([month, amount]) => ({ month, amount }));
  };

  const getBookingsChartData = () => {
    if (!bookings || bookings.length === 0) {
      return [
        { date: 'Jan', bookings: 5 },
        { date: 'Feb', bookings: 12 },
        { date: 'Mar', bookings: 10 },
        { date: 'Apr', bookings: 22 },
        { date: 'May', bookings: 35 },
        { date: 'Jun', bookings: 42 }
      ];
    }
    const grouped: Record<string, number> = {};
    bookings.forEach((b: any) => {
      const d = new Date(b.createdAt);
      const key = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return Object.entries(grouped)
      .slice(-10) // show last 10 days
      .map(([date, bookings]) => ({ date, bookings }));
  };

  // Filter Bookings
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.bookingRef?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                          b.travelerName?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                          b.email?.toLowerCase().includes(bookingSearch.toLowerCase());
    
    if (bookingFilter === 'ALL') return matchesSearch;
    return matchesSearch && b.status === bookingFilter;
  });

  // Filter Users
  const filteredUsers = users.filter(u => {
    return u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
           u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
           u.phone?.toLowerCase().includes(userSearch.toLowerCase());
  });

  // Filter Admins
  const filteredAdmins = admins.filter(a => {
    return a.name?.toLowerCase().includes(adminSearch.toLowerCase()) ||
           a.email?.toLowerCase().includes(adminSearch.toLowerCase());
  });

  const getApiBaseClean = () => {
    return process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 relative overflow-hidden font-outfit">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-200/80 bg-white/80 backdrop-blur-2xl hidden lg:flex flex-col p-6 sticky top-0 h-screen z-20">
        <div className="flex items-center gap-3.5 mb-12 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500 flex items-center justify-center font-bold shadow-md shadow-violet-500/15">
            <span className="text-xl text-white">T</span>
          </div>
          <span className="font-outfit font-black tracking-tight text-xl text-slate-800">Trip<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500">Nova</span></span>
        </div>
        
        <nav className="space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <button 
              key={item.label} 
              onClick={() => setActiveTab(item.label)} 
              className={`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl transition-all duration-300 text-sm font-semibold border ${
                activeTab === item.label 
                  ? 'bg-gradient-to-r from-violet-600/10 via-blue-600/5 to-cyan-500/5 text-slate-900 border-slate-200/60 shadow-sm' 
                  : 'text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-900/[0.02]'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.label ? item.color : 'text-slate-400'}`} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-3.5 px-5 py-4 text-slate-500 hover:text-red-600 border border-transparent hover:border-red-200 hover:bg-red-50 rounded-2xl transition-all duration-300 text-sm font-bold mt-auto"
        >
          <HiOutlineLogout className="w-5 h-5" />
          Sign Out
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 w-72 h-full bg-white/95 backdrop-blur-2xl border-r border-slate-200/80 flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-12 px-2">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500 flex items-center justify-center font-bold shadow-md shadow-violet-500/15">
                    <span className="text-xl text-white">T</span>
                  </div>
                  <span className="font-outfit font-black tracking-tight text-xl text-slate-800">Trip<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500">Nova</span></span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                  <HiX className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-2 flex-1 overflow-y-auto">
                {navItems.map((item) => (
                  <button 
                    key={item.label} 
                    onClick={() => { setActiveTab(item.label); setSidebarOpen(false); }} 
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 text-sm font-semibold border ${
                      activeTab === item.label 
                        ? 'bg-gradient-to-r from-violet-600/10 via-blue-600/5 to-cyan-500/5 text-slate-900 border-slate-200/60 shadow-sm' 
                        : 'text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-900/[0.02]'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${activeTab === item.label ? item.color : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                ))}
              </nav>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-3.5 px-5 py-4 text-slate-500 hover:text-red-600 border border-transparent hover:border-red-200 hover:bg-red-50 rounded-2xl transition-all duration-300 text-sm font-bold mt-auto"
              >
                <HiOutlineLogout className="w-5 h-5" />
                Sign Out
              </button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col z-10 overflow-y-auto">
        <header className="h-16 md:h-20 border-b border-slate-200/80 flex items-center justify-between px-4 md:px-8 bg-white/70 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
              <HiOutlineMenuAlt3 className="w-6 h-6" />
            </button>
            <h2 className="font-black text-lg md:text-xl tracking-wide text-slate-800">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3.5 pl-6 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-black text-slate-800">{admin?.name || 'Admin'}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-cyan-600 font-extrabold">{admin?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Moderator'}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-sm font-black border border-slate-200 shadow-md text-white">{admin?.name?.charAt(0) || 'A'}</div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8">
          {isAddingTrip && <CreateTripModal onClose={() => setIsAddingTrip(false)} onSuccess={() => { setIsAddingTrip(false); fetchData(); }} />}
          {editingTrip && <CreateTripModal trip={editingTrip} onClose={() => setEditingTrip(null)} onSuccess={() => { setEditingTrip(null); fetchData(); }} />}
          
          <AnimatePresence mode="wait">
            {activeTab === 'Overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                {/* Stats Summary Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  {[
                    { label: 'Total Revenue', value: `₹${stats?.totalRevenue?.toLocaleString() || '0'}`, color: 'text-emerald-600', glow: 'shadow-emerald-500/5 border-emerald-200/60' },
                    { label: 'Total Bookings', value: bookings.length || '0', color: 'text-violet-600', glow: 'shadow-violet-500/5 border-violet-200/60' },
                    { label: 'Total Travelers', value: users.length || '0', color: 'text-blue-600', glow: 'shadow-blue-500/5 border-blue-200/60' },
                    { label: 'Upcoming Trips', value: stats?.upcomingTrips || '0', color: 'text-cyan-600', glow: 'shadow-cyan-500/5 border-cyan-200/60' }
                  ].map((stat, i) => (
                    <div key={i} className={`glass-card p-6 bg-white border hover:scale-[1.02] transition-all duration-300 shadow-md ${stat.glow}`}>
                      <p className="text-slate-500 text-[10px] font-extrabold uppercase tracking-widest mb-4 font-outfit">{stat.label}</p>
                      <h3 className={`text-3xl font-black ${stat.color} font-outfit`}>{stat.value}</h3>
                    </div>
                  ))}
                </div>

                {/* SVG Curves Trend Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                  <InteractiveSVGChart 
                    title="Revenue Performance Trend (Cumulative)" 
                    data={getRevenueChartData()} 
                    valueKey="amount" 
                    labelKey="month" 
                    color="emerald" 
                    valuePrefix="₹" 
                  />
                  <InteractiveSVGChart 
                    title="Booking Growth Velocity" 
                    data={getBookingsChartData()} 
                    valueKey="bookings" 
                    labelKey="date" 
                    color="violet" 
                  />
                </div>

                {/* Recent Activities Panel */}
                <div className="glass-card bg-white p-6 border border-slate-200/80 shadow-md">
                  <h4 className="font-bold text-lg mb-6 font-outfit text-slate-800">Recent Booking Log</h4>
                  <div className="space-y-4">
                    {recentBookings.slice(0, 5).map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">{log.travelerName?.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{log.travelerName}</p>
                            <p className="text-xs text-slate-400">Booked <span className="font-semibold text-slate-600">{log.trip?.title}</span> • Ref <span className="font-mono text-cyan-600">{log.bookingRef}</span></p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-800">₹{log.totalAmount}</p>
                          <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            log.status === 'CONFIRMED' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'
                          }`}>{log.status}</span>
                        </div>
                      </div>
                    ))}
                    {recentBookings.length === 0 && (
                      <div className="text-center py-8 text-slate-400 font-bold">No bookings recorded yet.</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Marketplace' && (
              <motion.div key="marketplace" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="glass-card p-6 bg-white border border-slate-200/80 shadow-md">
                  <MarketplaceManager />
                </div>
              </motion.div>
            )}

            {activeTab === 'Trips' && (
              <motion.div key="trips" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black font-outfit text-slate-800">Manage Trips</h3>
                  <button onClick={() => setIsAddingTrip(true)} className="btn-primary flex items-center gap-2 py-3 px-6"><HiOutlinePlus className="w-5 h-5" />Create New Trip</button>
                </div>
                <div className="space-y-4">
                  {trips.map(trip => (
                    <div key={trip.id} className="glass-card p-4.5 bg-white flex flex-col md:flex-row md:items-center gap-6 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-lg transition-all duration-300">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-200 shadow-sm">
                        <img src={trip.coverImage} className="w-full h-full object-cover" alt={trip.title} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg font-outfit text-slate-800 mb-1.5">{trip.title}</h4>
                        <p className="text-slate-500 text-sm font-medium">{trip.destination} • <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600 font-bold">₹{trip.price}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const lat = prompt('Enter Current Lat:', trip.currentLat || trip.latitude || '12.295');
                            const lng = prompt('Enter Current Lng:', trip.currentLng || trip.longitude || '76.639');
                            if (lat && lng) (window as any).startLiveTracking?.(trip.id, parseFloat(lat), parseFloat(lng));
                          }}
                          className={`p-2.5 rounded-xl border transition-all duration-300 ${trip.isLiveTracking ? 'bg-green-50 border-green-200 text-green-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                          title="Start live location tracking"
                        >
                          <HiOutlineLocationMarker className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setEditingTrip(trip)} 
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:border-violet-300 transition-all duration-300"
                          title="Edit trip"
                        >
                          <HiOutlinePencil className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deleteTrip(trip.id)} 
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-red-500/70 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-300"
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <h3 className="text-2xl font-black font-outfit text-slate-800">Bookings approval</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        placeholder="Search reference/name..." 
                        value={bookingSearch}
                        onChange={e => setBookingSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 bg-white shadow-sm"
                      />
                    </div>
                    <select 
                      value={bookingFilter}
                      onChange={e => setBookingFilter(e.target.value)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 bg-white shadow-sm"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING_APPROVAL">Pending Approval</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PENDING">Pending Payment</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="glass-card bg-white overflow-hidden border-slate-200/80 shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-200/80">
                        <tr>
                          <th className="px-6 py-4.5">Ref</th>
                          <th className="px-6 py-4.5">Traveler</th>
                          <th className="px-6 py-4.5">Trip Title</th>
                          <th className="px-6 py-4.5">Amount</th>
                          <th className="px-6 py-4.5">Receipt Proof</th>
                          <th className="px-6 py-4.5">Status</th>
                          <th className="px-6 py-4.5">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredBookings.map(booking => (
                          <tr key={booking.id} className="text-sm hover:bg-slate-50/50 transition-colors duration-200 text-slate-700">
                            <td className="px-6 py-4 font-mono font-bold text-cyan-600">{booking.bookingRef}</td>
                            <td className="px-6 py-4 font-semibold text-slate-800">
                              <div>{booking.travelerName}</div>
                              <div className="text-xs text-slate-400">{booking.email}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{booking.trip?.title}</td>
                            <td className="px-6 py-4 font-bold text-slate-800">₹{booking.totalAmount?.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              {booking.paymentScreenshot ? (
                                <button 
                                  onClick={() => setSelectedBookingScreenshot(booking)}
                                  className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-600 border border-violet-100 text-xs font-bold hover:bg-violet-100 transition-all flex items-center gap-1 shadow-sm"
                                >
                                  Proof of Payment
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs font-medium">Automatic verification</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                                booking.status === 'CONFIRMED' 
                                  ? 'bg-green-50 border border-green-200 text-green-700' 
                                  : booking.status === 'PENDING_APPROVAL'
                                  ? 'bg-purple-50 border border-purple-200 text-purple-700'
                                  : booking.status === 'CANCELLED'
                                  ? 'bg-red-50 border border-red-200 text-red-700'
                                  : 'bg-amber-50 border border-amber-200 text-amber-700'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')} className="p-1 text-slate-400 hover:text-green-600 transition-colors" title="Confirm Booking"><HiOutlineCheckCircle className="w-5.5 h-5.5" /></button>
                                <button onClick={() => updateBookingStatus(booking.id, 'CANCELLED')} className="p-1 text-slate-400 hover:text-red-600 transition-colors" title="Cancel Booking"><HiOutlineXCircle className="w-5.5 h-5.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredBookings.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">No bookings found matching filters.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-black font-outfit text-slate-800">Explorer Directory</h3>
                    <p className="text-sm text-slate-500 font-medium">Manage travelers, contact details, and account suspension</p>
                  </div>
                  <div className="relative">
                    <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      placeholder="Search explorers name/email..." 
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 bg-white shadow-sm w-72"
                    />
                  </div>
                </div>

                <div className="glass-card bg-white overflow-hidden border-slate-200/80 shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-200/80">
                        <tr>
                          <th className="px-6 py-4.5">Explorer</th>
                          <th className="px-6 py-4.5">Phone</th>
                          <th className="px-6 py-4.5">Bookings</th>
                          <th className="px-6 py-4.5">Total Invested</th>
                          <th className="px-6 py-4.5">Emergency Profile</th>
                          <th className="px-6 py-4.5">Status</th>
                          <th className="px-6 py-4.5">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(userItem => {
                          const isBanned = userItem.status === 'Banned' || bannedEmails.includes(userItem.email.toLowerCase().trim());
                          return (
                            <tr key={userItem.email} className="text-sm hover:bg-slate-50/50 transition-colors duration-200 text-slate-700">
                              <td className="px-6 py-4">
                                <div className="font-semibold text-slate-800">{userItem.name}</div>
                                <div className="text-xs text-slate-400">{userItem.email}</div>
                                {userItem.age ? (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">{userItem.gender}, {userItem.age}yo</span>
                                ) : null}
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-600">{userItem.phone || 'N/A'}</td>
                              <td className="px-6 py-4 font-black text-slate-700">{userItem.bookingsCount}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">₹{userItem.totalSpent?.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                {userItem.emergencyName ? (
                                  <div className="text-xs">
                                    <span className="font-semibold text-slate-600">{userItem.emergencyName}</span>
                                    <div className="text-slate-400">{userItem.emergencyPhone}</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-450 text-xs italic">Not Provided</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                                  isBanned ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
                                }`}>
                                  {isBanned ? 'BANNED' : 'ACTIVE'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <button onClick={() => setEditingUser(userItem)} className="p-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg hover:text-violet-600 transition-colors" title="Edit Profile Details"><HiOutlinePencil className="w-4 h-4" /></button>
                                  <button 
                                    onClick={() => handleToggleBanEmail(userItem.email)} 
                                    className={`p-2 border rounded-lg transition-colors ${
                                      isBanned ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100' : 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                                    }`}
                                    title={isBanned ? 'Lift Suspension' : 'Suspend traveler email'}
                                  >
                                    {isBanned ? <HiOutlineLockOpen className="w-4 h-4" /> : <HiOutlineLockClosed className="w-4 h-4" />}
                                  </button>
                                  <button onClick={() => handleDeleteUser(userItem.email)} className="p-2 bg-slate-50 border border-slate-200 text-red-500/70 rounded-lg hover:text-red-600 transition-colors" title="Delete Traveler Records"><HiOutlineTrash className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">No explorers registered yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Admins' && admin?.role === 'SUPER_ADMIN' && (
              <motion.div key="admins" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-black font-outfit text-slate-800">Administrator workspace</h3>
                    <p className="text-sm text-slate-500 font-medium">Provision security keys and control platform moderation credentials</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        placeholder="Search administrators..." 
                        value={adminSearch}
                        onChange={e => setAdminSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 bg-white shadow-sm w-64"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        setEditingAdmin(null);
                        setAdminForm({ name: '', email: '', password: '', role: 'MODERATOR' });
                        setIsAddingAdmin(true);
                      }} 
                      className="btn-primary py-2.5 px-4.5 text-sm flex items-center gap-2"
                    >
                      <HiOutlinePlus className="w-4 h-4" /> Add Admin
                    </button>
                  </div>
                </div>

                <div className="glass-card bg-white overflow-hidden border-slate-200/80 shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-200/80">
                        <tr>
                          <th className="px-6 py-4.5">Administrator</th>
                          <th className="px-6 py-4.5">Access Role</th>
                          <th className="px-6 py-4.5">Granted At</th>
                          <th className="px-6 py-4.5">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAdmins.map(adminItem => (
                          <tr key={adminItem.id} className="text-sm hover:bg-slate-50/50 transition-colors duration-200 text-slate-700">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-800">{adminItem.name}</div>
                              <div className="text-xs text-slate-400">{adminItem.email}</div>
                            </td>
                            <td className="px-6 py-4 font-medium">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                                adminItem.role === 'SUPER_ADMIN' ? 'bg-violet-50 text-violet-700 border border-violet-100' : 'bg-slate-55 text-slate-700 border border-slate-200'
                              }`}>
                                {adminItem.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">{new Date(adminItem.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button onClick={() => setEditingAdmin(adminItem)} className="p-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg hover:text-violet-600 transition-colors" title="Edit administrator details"><HiOutlinePencil className="w-4 h-4" /></button>
                                <button 
                                  onClick={() => handleDeleteAdmin(adminItem.id)} 
                                  className="p-2 bg-slate-50 border border-slate-200 text-red-500/70 rounded-lg hover:text-red-600 transition-colors" 
                                  title="Delete administrator account"
                                  disabled={adminItem.id === admin?.id}
                                >
                                  <HiOutlineTrash className="w-4 h-4" />
                                </button>
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
                  <h3 className="text-2xl font-black font-outfit text-slate-800">Our Crew</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Add Crew Form */}
                  <div className="lg:col-span-1">
                    <div className="glass-card bg-white p-6 border-slate-200/80 shadow-md">
                      <h4 className="font-bold text-lg mb-6 font-outfit text-slate-800">{editingCrew ? `Edit Member: ${editingCrew.name}` : 'Add New Member'}</h4>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const token = localStorage.getItem('tripnova_admin_token');
                        if (!token) return;
                        const formattedForm = {
                          ...crewForm,
                          order: parseInt(crewForm.order) || 0,
                          isVisible: crewForm.isVisible === 'true'
                        };
                        try {
                          if (editingCrew) {
                            const res = await api.crew.update(editingCrew.id, formattedForm, token);
                            setCrew(crew.map(c => c.id === editingCrew.id ? res : c));
                            toast.success('Crew member updated successfully');
                            setEditingCrew(null);
                          } else {
                            const res = await api.crew.create(formattedForm, token);
                            setCrew([res, ...crew]);
                            toast.success('Crew member added successfully');
                          }
                          setCrewForm({
                            name: '',
                            role: '',
                            image: '',
                            contact: '',
                            instagram: '',
                            description: '',
                            order: '0',
                            isVisible: 'true'
                          });
                        } catch (err) {
                          toast.error(editingCrew ? 'Failed to update crew member' : 'Failed to add crew member');
                        }
                      }} className="space-y-5">
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Full Name</label>
                          <input name="name" required placeholder="Full Name" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={crewForm.name} onChange={e => setCrewForm({...crewForm, name: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Role</label>
                          <input name="role" required placeholder="Role (e.g. Lead Guide)" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={crewForm.role} onChange={e => setCrewForm({...crewForm, role: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Image URL</label>
                          <input name="image" required placeholder="Image URL" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={crewForm.image} onChange={e => setCrewForm({...crewForm, image: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Display Order</label>
                            <input name="order" type="number" required className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={crewForm.order} onChange={e => setCrewForm({...crewForm, order: e.target.value})} />
                          </div>
                          <div>
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Visibility</label>
                            <select name="isVisible" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={crewForm.isVisible} onChange={e => setCrewForm({...crewForm, isVisible: e.target.value})}>
                              <option value="true">Visible</option>
                              <option value="false">Hidden</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Contact Info (Optional)</label>
                          <input name="contact" placeholder="Contact Info" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={crewForm.contact} onChange={e => setCrewForm({...crewForm, contact: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Instagram (Optional)</label>
                          <input name="instagram" placeholder="Instagram Username" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={crewForm.instagram} onChange={e => setCrewForm({...crewForm, instagram: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Short Bio</label>
                          <textarea name="description" required placeholder="Short Description / Bio (Required)" className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 py-3 resize-none" rows={3} value={crewForm.description} onChange={e => setCrewForm({...crewForm, description: e.target.value})} />
                        </div>
                        <button type="submit" className="btn-primary w-full py-3.5">{editingCrew ? 'Save Changes' : 'Add Member'}</button>
                        {editingCrew && (
                          <button type="button" onClick={() => setEditingCrew(null)} className="w-full py-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all duration-300 text-sm font-semibold text-slate-700">Cancel Edit</button>
                        )}
                      </form>
                    </div>
                  </div>

                  {/* Crew List */}
                  <div className="lg:col-span-2 space-y-4">
                    {crew.length === 0 ? (
                      <div className="glass-card bg-white p-12 text-center text-slate-350 font-bold border-dashed border-2 border-slate-200 shadow-md">No crew members yet.</div>
                    ) : (
                      [...crew].sort((a, b) => (a.order || 0) - (b.order || 0)).map(member => (
                        <div key={member.id} className={`glass-card bg-white p-4.5 flex items-center gap-6 border hover:border-slate-300 hover:bg-slate-50/50 transition-all duration-300 shadow-sm ${member.isVisible === false ? 'opacity-60 border-dashed border-slate-200' : 'border-slate-200/80'}`}>
                          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200 shadow-sm">
                            {member.image && <img src={member.image} className="w-full h-full object-cover" alt={member.name} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg font-outfit text-slate-800">{member.name}</h4>
                              {member.isVisible === false && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-100 border border-slate-200 font-bold text-slate-500 uppercase tracking-widest">Hidden</span>
                              )}
                            </div>
                            <p className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600 text-xs uppercase tracking-widest font-extrabold">{member.role} • Order: {member.order || 0}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingCrew(member)} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:border-violet-300 transition-all duration-300" title="Edit member"><HiOutlinePencil className="w-5 h-5" /></button>
                            <button onClick={() => deleteCrew(member.id)} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-red-500/70 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-300" title="Delete member"><HiOutlineTrash className="w-5 h-5" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Blogs' && (
              <motion.div key="blogs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black font-outfit text-slate-800">Manage Blogs</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {blogs.length === 0 ? (
                    <div className="md:col-span-2 glass-card bg-white p-12 text-center text-slate-350 font-bold border-dashed border-2 border-slate-200 shadow-md">No blogs created yet.</div>
                  ) : (
                    blogs.map(blog => (
                      <div key={blog.id} className="glass-card bg-white p-6 border border-slate-200/80 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <span className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600 font-extrabold uppercase tracking-widest block mb-2">{blog.category || 'Travel'}</span>
                          <h4 className="font-bold text-lg font-outfit text-slate-800 mb-2 leading-snug">{blog.title}</h4>
                          <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">{blog.excerpt || blog.content}</p>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto">
                          <span className="text-xs font-semibold text-slate-400">By {blog.authorName || 'Admin'} • {new Date(blog.createdAt).toLocaleDateString()}</span>
                          <button 
                            onClick={async () => {
                              const token = localStorage.getItem('tripnova_admin_token');
                              if (!token) return;
                              if (!confirm('Are you sure you want to delete this blog post?')) return;
                              try {
                                await api.blogs.delete(blog.id, token);
                                setBlogs(blogs.filter(b => b.id !== blog.id));
                                toast.success('Blog post deleted');
                              } catch(e) {
                                toast.error('Failed to delete blog');
                              }
                            }}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all duration-300"
                            title="Delete Blog"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'Settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black font-outfit text-slate-800">Global Settings</h3>
                  <p className="text-slate-500 text-sm font-semibold">Control website content dynamically</p>
                </div>
                
                <form onSubmit={handleSaveSettings} className="space-y-8">
                  {/* Hero Section Settings */}
                  <div className="glass-card bg-white p-6 border-slate-200/80 shadow-md">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2 font-outfit text-slate-800"><HiOutlineMap className="w-5.5 h-5.5 text-violet-600"/> Hero Section</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Hero Video URL</label>
                        <input name="heroVideoUrl" defaultValue={settings.heroVideoUrl || '/videos/hero-bg.mp4'} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" placeholder="/videos/hero-bg.mp4 or https://..." />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Hero Tagline</label>
                        <input name="heroTagline" defaultValue={settings.heroTagline || 'Explore the Extraordinary'} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Cinematic Film URL (For "Watch Film" Button)</label>
                      <input name="filmVideoUrl" defaultValue={settings.filmVideoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ'} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" placeholder="YouTube Embed URL..." />
                    </div>
                  </div>

                  {/* General / Theme Settings */}
                  <div className="glass-card bg-white p-6 border-slate-200/80 shadow-md">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2 font-outfit text-slate-800"><HiOutlineCog className="w-5.5 h-5.5 text-violet-600"/> General Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Site Name</label>
                        <input name="siteName" defaultValue={settings.siteName || 'MYSURU TRAVEL CLUB'} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Contact Email</label>
                        <input name="contactEmail" defaultValue={settings.contactEmail || 'hello@mysurutravelclub.com'} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Contact Phone</label>
                        <input name="contactPhone" defaultValue={settings.contactPhone || '+91 98765 43210'} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Contact Address</label>
                        <input name="contactAddress" defaultValue={settings.contactAddress || 'Mysuru, Karnataka, India'} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Footer Description</label>
                        <textarea name="footerDescription" defaultValue={settings.footerDescription || ''} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" rows={2} placeholder="AI-powered travel experiences that transform..." />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Site Notice (Top Banner)</label>
                        <input name="siteNotice" defaultValue={settings.siteNotice || ''} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" placeholder="Leave empty to hide..." />
                      </div>
                    </div>
                  </div>

                  {/* SEO & Socials */}
                  <div className="glass-card bg-white p-6 border-slate-200/80 shadow-md">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2 font-outfit text-slate-800"><HiOutlineDocumentText className="w-5.5 h-5.5 text-violet-600"/> SEO & Social Links</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Global Meta Title</label>
                        <input name="metaTitle" defaultValue={settings.metaTitle || 'TripNova — Luxury Travel'} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Global Meta Description</label>
                        <input name="metaDescription" defaultValue={settings.metaDescription || 'AI-Powered luxury travel platform.'} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Instagram</label>
                        <input name="socialInsta" defaultValue={settings.socialInsta || 'https://instagram.com'} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Twitter/X</label>
                        <input name="socialTwitter" defaultValue={settings.socialTwitter || 'https://twitter.com'} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Facebook</label>
                        <input name="socialFacebook" defaultValue={settings.socialFacebook || 'https://facebook.com'} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" />
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

      {/* MODAL: Payment Screenshot Proof Viewer */}
      {selectedBookingScreenshot && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-black text-xl text-slate-800">Verification Proof</h3>
                <p className="text-xs text-slate-400">Ref: <span className="font-mono font-bold text-cyan-600">{selectedBookingScreenshot.bookingRef}</span></p>
              </div>
              <button 
                onClick={() => setSelectedBookingScreenshot(null)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <HiOutlineXCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 max-h-[50vh] flex items-center justify-center p-2 mb-6">
              <img 
                src={`${getApiBaseClean()}${selectedBookingScreenshot.paymentScreenshot}`} 
                alt="Payment screenshot proof"
                className="max-w-full max-h-[46vh] object-contain rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm">
              <div>
                <span className="text-[10px] font-extrabold text-slate-450 uppercase block">Traveler</span>
                <span className="font-bold text-slate-800">{selectedBookingScreenshot.travelerName}</span>
                <span className="text-xs text-slate-400 block">{selectedBookingScreenshot.email}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-450 uppercase block">Trip Title</span>
                <span className="font-bold text-slate-800">{selectedBookingScreenshot.trip?.title}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-450 uppercase block">Amount Paid</span>
                <span className="font-bold text-slate-800">₹{selectedBookingScreenshot.totalAmount?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-450 uppercase block">Status</span>
                <span className="font-bold text-violet-600 uppercase tracking-widest">{selectedBookingScreenshot.status}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  updateBookingStatus(selectedBookingScreenshot.id, 'CONFIRMED');
                  setSelectedBookingScreenshot(null);
                }} 
                className="flex-1 bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/10"
              >
                <HiOutlineCheckCircle className="w-5 h-5" /> Approve & Confirm
              </button>
              <button 
                onClick={() => {
                  updateBookingStatus(selectedBookingScreenshot.id, 'CANCELLED');
                  setSelectedBookingScreenshot(null);
                }} 
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <HiOutlineXCircle className="w-5 h-5" /> Reject & Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: Edit User Details */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl w-full max-w-lg"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-black text-xl text-slate-800">Edit Explorer Details</h3>
                <p className="text-xs text-slate-400">Updating settings for {editingUser.email}</p>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <HiOutlineXCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Explorer Name</label>
                <input 
                  required
                  value={userForm.name}
                  onChange={e => setUserForm({...userForm, name: e.target.value})}
                  className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Phone Number</label>
                  <input 
                    value={userForm.phone}
                    onChange={e => setUserForm({...userForm, phone: e.target.value})}
                    className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Age</label>
                  <input 
                    type="number"
                    value={userForm.age}
                    onChange={e => setUserForm({...userForm, age: e.target.value})}
                    className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Gender</label>
                <select 
                  value={userForm.gender}
                  onChange={e => setUserForm({...userForm, gender: e.target.value})}
                  className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Emergency Contact Name</label>
                  <input 
                    value={userForm.emergencyName}
                    onChange={e => setUserForm({...userForm, emergencyName: e.target.value})}
                    className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Emergency Phone</label>
                  <input 
                    value={userForm.emergencyPhone}
                    onChange={e => setUserForm({...userForm, emergencyPhone: e.target.value})}
                    className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs"
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full py-3.5 mt-4">Save Profile Settings</button>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Add/Edit Administrator Account */}
      {(isAddingAdmin || editingAdmin) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-black text-xl text-slate-800">{editingAdmin ? 'Edit Access Credentials' : 'Provision Admin Account'}</h3>
                <p className="text-xs text-slate-400">{editingAdmin ? `Editing account ${editingAdmin.email}` : 'Add moderator / super admin keys'}</p>
              </div>
              <button 
                onClick={() => {
                  setIsAddingAdmin(false);
                  setEditingAdmin(null);
                }}
                className="w-10 h-10 rounded-full hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <HiOutlineXCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveAdmin} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Administrator Name</label>
                <input 
                  required
                  value={adminForm.name}
                  onChange={e => setAdminForm({...adminForm, name: e.target.value})}
                  className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900"
                  placeholder="e.g. Nithin Gowda"
                />
              </div>
              {!editingAdmin && (
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={adminForm.email}
                    onChange={e => setAdminForm({...adminForm, email: e.target.value})}
                    className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900"
                    placeholder="name@mysurutravelclub.com"
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Password {editingAdmin && '(Leave empty to preserve)'}</label>
                <input 
                  type="password"
                  required={!editingAdmin}
                  value={adminForm.password}
                  onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                  className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Role Access Level</label>
                <select 
                  value={adminForm.role}
                  onChange={e => setAdminForm({...adminForm, role: e.target.value})}
                  className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900"
                >
                  <option value="MODERATOR">Moderator (Manage content/trips)</option>
                  <option value="SUPER_ADMIN">Super Admin (Full control + register admins)</option>
                </select>
              </div>
              <button type="submit" className="btn-primary w-full py-3.5 mt-4">Save Credentials</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

