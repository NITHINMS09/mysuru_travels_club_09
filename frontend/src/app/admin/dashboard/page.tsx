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
  HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineEye, HiOutlineBell,
  HiOutlineMenuAlt3, HiX, HiOutlineThumbUp, HiOutlineDownload, HiOutlineVideoCamera, HiOutlineChevronUp, HiOutlineChevronDown, HiOutlineX, HiOutlineExternalLink, HiOutlineShare, HiOutlinePhone
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api, { fetchAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import CreateTripModal from '@/components/admin/CreateTripModal';
import MarketplaceManager from '@/components/admin/MarketplaceManager';
import dynamic from 'next/dynamic';
import { io } from 'socket.io-client';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

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
  const [updates, setUpdates] = useState<any[]>([]);
  const [crew, setCrew] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [whatsAppSettings, setWhatsAppSettings] = useState<any>({});
  const [whatsAppForm, setWhatsAppForm] = useState({ messageTitle: '', messageTemplate: '', imageUrl: '', isActive: true });
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
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [selectedBookingScreenshot, setSelectedBookingScreenshot] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminPayAmount, setAdminPayAmount] = useState('');
  const [adminPayMethod, setAdminPayMethod] = useState('CASH');
  const [adminPayNotes, setAdminPayNotes] = useState('');
  
  // Instagram State
  const [instagramSettings, setInstagramSettings] = useState<any>(null);
  const [syncingInstagram, setSyncingInstagram] = useState(false);
  const [connectingDemo, setConnectingDemo] = useState(false);
  const [appPromptEnabled, setAppPromptEnabled] = useState(false);
  const [instaClientId, setInstaClientId] = useState('');
  const [instaClientSecret, setInstaClientSecret] = useState('');
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [instaApiType, setInstaApiType] = useState<'GRAPH_API' | 'BASIC_DISPLAY'>('GRAPH_API');
  const [socialUpdates, setSocialUpdates] = useState<any[]>([]);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkCategory, setBulkCategory] = useState('reels');
  const [socialForm, setSocialForm] = useState({
    id: '',
    url: '',
    title: '',
    description: '',
    category: 'reels',
    thumbnailUrl: '',
    isFeatured: false,
    orderIndex: 0
  });
  const [socialFilter, setSocialFilter] = useState('all');
  const [socialSearch, setSocialSearch] = useState('');

  // Modals state
  const [editingVote, setEditingVote] = useState<any>(null);
  const [voteForm, setVoteForm] = useState({ name: '', description: '', voteCount: 0 });
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
  const [visitorStats, setVisitorStats] = useState<any>(null);
  const [crewForm, setCrewForm] = useState({
    name: '',
    role: '',
    image: '',
    contact: '',
    instagram: '',
    description: '',
    displayOrder: '0',
    isVisible: 'true'
  });

  const [isAddingUpdate, setIsAddingUpdate] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<any>(null);
  const [updateForm, setUpdateForm] = useState({ title: '', description: '', videoUrl: '', thumbnailUrl: '', fileSize: 0, duration: 0, status: 'PUBLISHED', category: '' });
  const [updateStats, setUpdateStats] = useState({ total: 0, published: 0, drafts: 0, totalViews: 0 });
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const [isAddingBlog, setIsAddingBlog] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [blogForm, setBlogForm] = useState({ title: '', excerpt: '', content: '', coverImage: '', tags: '', category: '' });

  useEffect(() => {
    if (editingBlog) {
      setBlogForm({
        title: editingBlog.title || '',
        excerpt: editingBlog.excerpt || '',
        content: editingBlog.content || '',
        coverImage: editingBlog.coverImage || '',
        tags: Array.isArray(editingBlog.tags) ? editingBlog.tags.join(', ') : editingBlog.tags || '',
        category: editingBlog.category || ''
      });
    } else {
      setBlogForm({ title: '', excerpt: '', content: '', coverImage: '', tags: '', category: '' });
    }
  }, [editingBlog]);

  useEffect(() => {
    if (editingVote) {
      setVoteForm({
        name: editingVote.name || '',
        description: editingVote.description || '',
        voteCount: editingVote.voteCount || 0
      });
    }
  }, [editingVote]);

  useEffect(() => {
    if (editingCrew) {
      setCrewForm({
        name: editingCrew.name || '',
        role: editingCrew.role || '',
        image: editingCrew.image || '',
        contact: editingCrew.contact || '',
        instagram: editingCrew.instagram || '',
        description: editingCrew.description || '',
        displayOrder: editingCrew.displayOrder?.toString() || '0',
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
        displayOrder: '0',
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

  const fetchTabData = useCallback(async (tabName: string) => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    
    try {
      if (tabName === 'Overview' && !stats) setLoading(true);
      else if (tabName === 'Trips' && trips.length === 0) setLoading(true);
      else if (tabName === 'Bookings' && bookings.length === 0) setLoading(true);
      else if (tabName === 'Users' && users.length === 0) setLoading(true);
      else if (tabName === 'Admins' && admins.length === 0) setLoading(true);
      else if (tabName === 'Crew' && crew.length === 0) setLoading(true);
      else if (tabName === 'Settings' && Object.keys(settings).length === 0) setLoading(true);
      else if (tabName === 'Updates' && updates.length === 0) setLoading(true);
      
      if (tabName === 'Overview') {
        const [statsData, visitorData] = await Promise.all([
          api.auth.dashboard(token),
          fetchAPI('/analytics/stats', { token }).catch(() => null)
        ]);
        setStats(statsData.stats);
        setRecentBookings(statsData.recentBookings || []);
        setMonthlyRevenue(statsData.monthlyRevenue || []);
        setBookingsByStatus(statsData.bookingsByStatus || []);
        if (visitorData) setVisitorStats(visitorData);
      }
      else if (tabName === 'Trips') {
        const tripsData = await api.trips.getAll();
        setTrips(tripsData.trips || []);
      }
      else if (tabName === 'Bookings') {
        const bookingsData = await api.bookings.getAll(token);
        setBookings(bookingsData.bookings || []);
      }
      else if (tabName === 'Users') {
        const usersRes = await api.users.getAll(token);
        setUsers(usersRes.users || []);
        if (usersRes.stats) {
          setStats((prev: any) => ({ ...prev, userStats: usersRes.stats }));
        }
      }
      else if (tabName === 'Admins') {
        const user = localStorage.getItem('tripnova_admin_user');
        const parsedAdmin = user ? JSON.parse(user) : null;
        if (parsedAdmin?.role === 'SUPER_ADMIN') {
          const adminsRes = await api.auth.getAdmins(token);
          setAdmins(adminsRes.admins || []);
        }
      }
      else if (tabName === 'Crew') {
        const crewData = await api.crew.getAll();
        setCrew(crewData || []);
      }
      else if (tabName === 'Settings') {
        const [settingsData, whatsappSettingsData] = await Promise.all([
          api.settings.getAll(),
          api.whatsappSettings.get()
        ]);
        setSettings(settingsData || {});
        setAppPromptEnabled(settingsData?.app_prompt_enabled === 'true');
        if (settingsData.banned_emails) {
          try {
            setBannedEmails(JSON.parse(settingsData.banned_emails));
          } catch(e) {
            setBannedEmails([]);
          }
        } else {
          setBannedEmails([]);
        }
        setWhatsAppSettings(whatsappSettingsData || {});
        setWhatsAppForm({
          messageTitle: whatsappSettingsData?.messageTitle || 'Booking Confirmation',
          messageTemplate: whatsappSettingsData?.messageTemplate || '',
          imageUrl: whatsappSettingsData?.imageUrl || '',
          isActive: whatsappSettingsData?.isActive ?? true
        });
      }
      else if (tabName === 'Updates') {
        const [updatesData, updatesStatsData] = await Promise.all([
          api.updates.getAdminAll(token),
          api.updates.getStats(token)
        ]);
        setUpdates(updatesData || []);
        setUpdateStats(updatesStatsData || { total: 0, published: 0, drafts: 0, totalViews: 0 });
      }
      else if (tabName === 'Votes') {
        const votesData = await api.votes.getDestinations();
        setVotes(Array.isArray(votesData) ? votesData : votesData.destinations || []);
      }
      else if (tabName === 'Blogs') {
        const blogsData = await api.blogs.getAll();
        setBlogs(blogsData.blogs || blogsData);
      }
      else if (tabName === 'Social Integration') {
        const res = await api.instagram.getSettings(token);
        setInstagramSettings(res);
        setInstaClientId(res.clientId || '');
        setInstaClientSecret(res.clientSecret || '');
        setInstaApiType(res.apiType || 'GRAPH_API');
      }
      else if (tabName === 'Social Media Updates') {
        const res = await api.socialUpdates.getAll({ limit: 100 });
        setSocialUpdates(res.updates || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch data for ' + tabName);
    } finally {
      setLoading(false);
    }
  }, [stats, trips.length, bookings.length, users.length, admins.length, crew.length, settings, updates.length]);

  const fetchData = useCallback(async () => {
    await fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

  useEffect(() => {
    const token = localStorage.getItem('tripnova_admin_token');
    const user = localStorage.getItem('tripnova_admin_user');
    if (!token) { router.push('/admin/login'); return; }
    setAdmin(user ? JSON.parse(user) : null);
  }, [router]);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

  useEffect(() => {
    (window as any).startLiveTracking = (tripId: string, lat: number, lng: number) => {
      socket.emit('start_live_tracking', { tripId, lat, lng });
      toast.success('Live Location Started!');
      fetchData();
    };
  }, [fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('tripnova_admin_token');
    localStorage.removeItem('tripnova_admin_user');
    toast.success('Logged out successfully');
    router.push('/admin/login');
  };

  const handleConnectDemoInstagram = async () => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    setConnectingDemo(true);
    try {
      const res = await api.instagram.connectDemo(token);
      setInstagramSettings(res.settings);
      toast.success('Connected simulated demo Instagram account!');
    } catch (e: any) {
      toast.error(e.message || 'Demo connection failed');
    } finally {
      setConnectingDemo(false);
    }
  };

  const handleDisconnectInstagram = async () => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    if (!confirm('Are you sure you want to disconnect your Instagram account? This will wipe the cached media feed.')) return;
    try {
      const res = await api.instagram.disconnect(token);
      setInstagramSettings(res.settings);
      toast.success('Disconnected Instagram account successfully.');
    } catch (e: any) {
      toast.error(e.message || 'Disconnection failed');
    }
  };

  const handleSyncInstagram = async () => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    setSyncingInstagram(true);
    try {
      const res = await api.instagram.sync(token);
      setInstagramSettings(res.settings);
      toast.success('Instagram synchronization completed!');
    } catch (e: any) {
      toast.error(e.message || 'Synchronization failed');
    } finally {
      setSyncingInstagram(false);
    }
  };

  const handleRefreshToken = async () => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    setRefreshingToken(true);
    try {
      const res = await api.instagram.refreshToken(token);
      setInstagramSettings(res.settings);
      toast.success('Instagram access token successfully refreshed!');
    } catch (e: any) {
      toast.error(e.message || 'Token refresh failed');
    } finally {
      setRefreshingToken(false);
    }
  };

  const handleToggleSyncSetting = async (key: string) => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token || !instagramSettings) return;
    const updatedValue = !instagramSettings[key];
    try {
      const res = await api.instagram.updateSettings({ [key]: updatedValue }, token);
      setInstagramSettings(res);
      toast.success('Sync setting updated');
    } catch (e: any) {
      toast.error('Failed to update sync setting');
    }
  };

  const handleSyncLimitChange = async (val: number) => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token || !instagramSettings) return;
    try {
      const res = await api.instagram.updateSettings({ syncLimit: val }, token);
      setInstagramSettings(res);
      toast.success('Sync limit count updated');
    } catch (e: any) {
      toast.error('Failed to update sync limit');
    }
  };

  const handleSaveSocialUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;

    try {
      if (socialForm.id) {
        // Edit
        await api.socialUpdates.update(socialForm.id, socialForm, token);
        toast.success('Social media update updated successfully!');
      } else {
        // Create
        await api.socialUpdates.create(socialForm, token);
        toast.success('Social media update published successfully!');
      }

      setSocialModalOpen(false);
      // Reload
      const res = await api.socialUpdates.getAll({ limit: 100 });
      setSocialUpdates(res.updates || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save social update');
    }
  };

  const handleDeleteSocialUpdate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this social media update?')) return;
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;

    try {
      await api.socialUpdates.delete(id, token);
      toast.success('Social update deleted successfully!');
      // Reload
      const res = await api.socialUpdates.getAll({ limit: 100 });
      setSocialUpdates(res.updates || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete update');
    }
  };

  const handleReorderSocialUpdate = async (id: string, direction: 'up' | 'down') => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;

    const index = socialUpdates.findIndex(item => item.id === id);
    if (index === -1) return;

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === socialUpdates.length - 1) return;

    const newUpdates = [...socialUpdates];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    
    // Swap items
    const temp = newUpdates[index];
    newUpdates[index] = newUpdates[targetIdx];
    newUpdates[targetIdx] = temp;

    // Map order indexes
    const payload = newUpdates.map((item, idx) => ({
      id: item.id,
      orderIndex: idx
    }));

    try {
      setSocialUpdates(newUpdates);
      await api.socialUpdates.reorder(payload, token);
      toast.success('Order synchronized successfully');
    } catch (e) {
      toast.error('Failed to reorder items');
    }
  };

  const handleBulkUploadSocialUpdates = async () => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;

    const urls = bulkUrls.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) {
      toast.error('Please enter at least one URL');
      return;
    }

    try {
      let count = 0;
      for (const url of urls) {
        // extract a title from URL structure or generic title
        let autoTitle = `Media Update - ${url.substring(0, 30)}`;
        if (url.includes('instagram.com/reel/')) {
          autoTitle = `Reel: ${url.split('/reel/')[1]?.substring(0, 10) || 'Clip'}`;
        } else if (url.includes('youtube.com/shorts/')) {
          autoTitle = `Shorts: ${url.split('/shorts/')[1]?.substring(0, 10) || 'Video'}`;
        }
        
        await api.socialUpdates.create({
          url,
          title: autoTitle,
          description: `Shared via our social updates aggregator. View full details on the main page.`,
          category: bulkCategory,
          isFeatured: false,
          orderIndex: 0
        }, token);
        count++;
      }

      toast.success(`Successfully uploaded ${count} media links in bulk!`);
      setBulkUrls('');
      setBulkModalOpen(false);
      // Reload
      const res = await api.socialUpdates.getAll({ limit: 100 });
      setSocialUpdates(res.updates || []);
    } catch (err: any) {
      toast.error(err.message || 'Bulk upload failed');
    }
  };

  const handleConnectRealInstagram = () => {
    const clientId = instaClientId;
    if (!clientId) {
      toast.error('Please configure your Instagram Client ID first');
      return;
    }
    if (clientId.includes('@')) {
      toast.error('The App ID cannot be an email address. Please configure your Meta App ID (a numeric string) first.');
      return;
    }
    const redirectUri = window.location.origin + '/admin/instagram-callback';
    
    // Switch login redirection URL between Facebook Graph API (v23.0) and Basic Display API
    const authUrl = instaApiType === 'GRAPH_API'
      ? `https://www.facebook.com/v23.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement&response_type=code`
      : `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code`;

    window.open(authUrl, '_blank');
    toast.success(`Opened ${instaApiType === 'GRAPH_API' ? 'Facebook Login' : 'Instagram Login'} Redirect.`);
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

  const updateBookingStatus = async (id: string, status: string, notes?: string) => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    try {
      await api.bookings.updateStatus(id, status, token, notes);
      toast.success(`Booking ${status.toLowerCase()} successfully`);
      
      if (status === 'CONFIRMED' && whatsAppSettings?.isActive && whatsAppSettings.messageTemplate) {
        const booking = bookings.find(b => b.id === id);
        if (booking) {
          let text = whatsAppSettings.messageTemplate
            .replace(/{CustomerName}/g, booking.customerName || 'Customer')
            .replace(/{TripName}/g, booking.trip?.title || 'Trip')
            .replace(/{BookingID}/g, booking.referenceId || booking.id)
            .replace(/{MobileNumber}/g, booking.phone || '')
            .replace(/{TripDate}/g, booking.trip?.date ? new Date(booking.trip.date).toLocaleDateString() : '')
            .replace(/{SeatCount}/g, booking.seats?.toString() || '1')
            .replace(/{AmountPaid}/g, booking.totalAmount?.toString() || '0')
            .replace(/{PickupLocation}/g, booking.pickupLocation || 'your selected point');

          if (whatsAppSettings.imageUrl) {
            text += `\n\n${whatsAppSettings.imageUrl}`;
          }

          const phone = booking.phone?.replace(/[^0-9]/g, '') || '';
          const finalPhone = phone.length === 10 ? `91${phone}` : phone;
          
          if (finalPhone) {
            window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`, '_blank');
          }
        }
      }

      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update booking');
    }
  };

  const deleteBooking = async (id: string) => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    if (!confirm('Are you sure you want to permanently delete this booking?')) return;
    try {
      await api.bookings.delete(id, token);
      toast.success('Booking deleted successfully');
      setSelectedBookings(prev => prev.filter(bId => bId !== id));
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete booking');
    }
  };

  const handleBulkBookingAction = async (action: 'CONFIRM' | 'REJECT' | 'DELETE') => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token || selectedBookings.length === 0) return;
    const confirmMessage = action === 'DELETE' 
      ? `Are you sure you want to permanently delete ${selectedBookings.length} booking(s)?` 
      : `Are you sure you want to ${action.toLowerCase()} ${selectedBookings.length} booking(s)?`;
      
    if (!confirm(confirmMessage)) return;
    
    try {
      await api.bookings.bulkUpdate(selectedBookings, action, token);
      toast.success(`Successfully executed bulk ${action.toLowerCase()}`);
      setSelectedBookings([]);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || `Failed to execute bulk ${action.toLowerCase()}`);
    }
  };

  const generateWhatsAppLink = (booking: any) => {
    let text = whatsAppSettings?.messageTemplate || `Hello {CustomerName}, Your payment for {TripName} has been verified.`;
    text = text
      .replace(/{CustomerName}/g, booking.travelerName || '')
      .replace(/{TripName}/g, booking.trip?.title || '')
      .replace(/{MobileNumber}/g, booking.phone || '')
      .replace(/{SeatCount}/g, booking.seatCount?.toString() || '')
      .replace(/{AmountPaid}/g, booking.totalAmount?.toString() || '');
    
    if (whatsAppSettings?.imageUrl) {
      text += `\n\n${whatsAppSettings.imageUrl}`;
    }

    const phone = (booking.phone || '').replace(/\D/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
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

  const handleWhatsAppImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('Uploading image...');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}/api/v1/upload/single`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setWhatsAppForm(prev => ({ ...prev, imageUrl: data.url }));
      toast.success('Image uploaded successfully', { id: toastId });
    } catch (error: any) {
      toast.error(error.message || 'Upload failed', { id: toastId });
    }
  };

  const saveWhatsAppSettings = async () => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    try {
      const toastId = toast.loading('Saving WhatsApp settings...');
      const res = await api.whatsappSettings.update(whatsAppForm, token);
      setWhatsAppSettings(res);
      toast.success('WhatsApp Settings saved!', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    }
  };

  const resetWhatsAppSettings = async () => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    if (!confirm('Are you sure you want to reset the template to default?')) return;
    try {
      const toastId = toast.loading('Resetting WhatsApp template...');
      const res = await api.whatsappSettings.reset(token);
      setWhatsAppSettings(res);
      setWhatsAppForm({
        messageTitle: res.messageTitle,
        messageTemplate: res.messageTemplate,
        imageUrl: res.imageUrl || '',
        isActive: res.isActive
      });
      toast.success('WhatsApp Template reset!', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset settings');
    }
  };

  const deleteVote = async (id: string) => {
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token) return;
    if (!confirm('Are you sure you want to permanently delete this vote destination?')) return;
    try {
      await api.votes.deleteDestination(id, token);
      setVotes(votes.filter(v => v.id !== id));
      toast.success('Vote destination deleted');
      fetchData();
    } catch (err) { toast.error('Failed to delete vote destination'); }
  };

  const handleSaveVote = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('tripnova_admin_token');
    if (!token || !editingVote) return;
    try {
      await api.votes.updateDestination(editingVote.id, voteForm, token);
      toast.success('Vote destination updated');
      setEditingVote(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update vote destination');
    }
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('tripnova_admin_token');
      if (!token) return;
      if (editingUpdate) {
        const res = await api.updates.update(editingUpdate.id, updateForm, token);
        setUpdates(updates.map(u => u.id === editingUpdate.id ? res : u));
        toast.success('Video update modified successfully');
      } else {
        const res = await api.updates.create(updateForm, token);
        setUpdates([res, ...updates]);
        toast.success('Video update added successfully');
      }
      setIsAddingUpdate(false);
      setEditingUpdate(null);
      setUpdateForm({ title: '', description: '', videoUrl: '', thumbnailUrl: '', fileSize: 0, duration: 0, status: 'PUBLISHED', category: '' });
      fetchData(); // Refresh stats
    } catch (err) {
      toast.error('Failed to save update');
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video size must be less than 100MB');
      return;
    }

    try {
      setIsUploadingVideo(true);
      const res = await api.upload.video(file);
      setUpdateForm({
        ...updateForm,
        videoUrl: res.url,
        thumbnailUrl: res.thumbnailUrl,
        fileSize: res.size,
        duration: res.duration
      });
      toast.success('Video uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload video');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('tripnova_admin_token');
      if (!token) return;
      let res: any;
      if (editingBlog) {
        res = await fetchAPI(`/blogs/${editingBlog.id}`, { method: 'PUT', body: JSON.stringify(blogForm), token });
        setBlogs(blogs.map(b => b.id === editingBlog.id ? res : b));
        toast.success('Blog updated');
      } else {
        res = await fetchAPI('/blogs', { method: 'POST', body: JSON.stringify(blogForm), token });
        setBlogs([res, ...blogs]);
        toast.success('Blog created');
      }
      setIsAddingBlog(false);
      setEditingBlog(null);
      setBlogForm({ title: '', excerpt: '', content: '', coverImage: '', tags: '', category: '' });
    } catch (err) {
      toast.error('Failed to save blog');
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
    { label: 'Visitor Analytics', icon: HiOutlineEye, color: 'text-indigo-600' },
    { label: 'Marketplace', icon: HiOutlineMap, color: 'text-emerald-600' },
    { label: 'Trips', icon: HiOutlineMap, color: 'text-blue-600' },
    { label: 'Bookings', icon: HiOutlineTicket, color: 'text-pink-600' },
    { label: 'Users', icon: HiOutlineUsers, color: 'text-cyan-600' },
    ...(admin?.role === 'SUPER_ADMIN' ? [{ label: 'Admins', icon: HiOutlineUser, color: 'text-violet-600' }] : []),
    { label: 'Crew', icon: HiOutlineUsers, color: 'text-amber-600' },
    { label: 'Blogs', icon: HiOutlineDocumentText, color: 'text-indigo-600' },
    { label: 'Updates', icon: HiOutlineVideoCamera, color: 'text-rose-500' },
    { label: 'Votes', icon: HiOutlineThumbUp, color: 'text-rose-500' },
    { label: 'Social Integration', icon: HiOutlineShare, color: 'text-amber-500' },
    { label: 'Social Media Updates', icon: HiOutlineShare, color: 'text-rose-600' },
    { label: 'Settings', icon: HiOutlineCog, color: 'text-cyan-600' },
    { label: 'WhatsApp Settings', icon: FaWhatsapp, color: 'text-green-500' },
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
                          b.phone?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                          b.trip?.title?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                          b.email?.toLowerCase().includes(bookingSearch.toLowerCase());
                          
    if (!matchesSearch) return false;
    
    if (bookingFilter !== 'ALL') {
      return b.status === bookingFilter;
    }
    return true;
  });

  // Filter Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.mobileNumber?.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.id.toLowerCase().includes(userSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (userFilter === 'CONFIRMED') {
      return u.bookings.some((b: any) => b.status === 'CONFIRMED');
    }
    if (userFilter === 'PENDING') {
      return u.bookings.some((b: any) => b.status.includes('PENDING'));
    }
    if (userFilter === 'REJECTED') {
      return u.bookings.every((b: any) => b.status === 'REJECTED' || b.status === 'CANCELLED');
    }
    return true;
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  {[
                    { label: 'Total Users', value: stats?.userStats?.totalUsers || users.length || '0', color: 'text-violet-600', glow: 'shadow-violet-500/5 border-violet-200/60' },
                    { label: 'Total Bookings', value: stats?.totalBookings || '0', color: 'text-amber-600', glow: 'shadow-amber-500/5 border-amber-200/60' },
                    { label: 'Confirmed Bookings', value: stats?.userStats?.confirmedBookings || stats?.confirmedPayments || '0', color: 'text-emerald-600', glow: 'shadow-emerald-500/5 border-emerald-200/60' },
                    { label: 'Repeat Customers', value: stats?.userStats?.repeatCustomers || '0', color: 'text-blue-600', glow: 'shadow-blue-500/5 border-blue-200/60' },
                    { label: 'New Customers Today', value: stats?.userStats?.newCustomersToday || '0', color: 'text-rose-600', glow: 'shadow-rose-500/5 border-rose-200/60' },
                    { label: 'Total Blogs', value: stats?.totalBlogs || blogs.length || '0', color: 'text-indigo-600', glow: 'shadow-indigo-500/5 border-indigo-200/60' },
                    { label: 'Total Videos', value: stats?.totalVideos || updates.length || '0', color: 'text-rose-600', glow: 'shadow-rose-500/5 border-rose-200/60' },
                    { label: 'Notifications Sent', value: stats?.notificationsSent || '0', color: 'text-cyan-600', glow: 'shadow-cyan-500/5 border-cyan-200/60' }
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
                        <h4 className="font-bold text-lg font-outfit text-[#FFFFFF] mb-1.5" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{trip.title}</h4>
                        <p className="text-slate-500 text-sm font-medium">{trip.destination} • <span className="text-[#00C853] font-bold">₹{trip.price}</span></p>
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
                      <option value="PENDING_VERIFICATION">Pending Verification</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PENDING">Pending Payment</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                </div>

                {selectedBookings.length > 0 && (
                  <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center justify-between mb-6 animate-fade-in sticky top-4 z-50">
                    <span className="font-bold">{selectedBookings.length} booking(s) selected</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleBulkBookingAction('CONFIRM')} className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                        <HiOutlineCheckCircle className="w-4 h-4" /> Confirm
                      </button>
                      <button onClick={() => handleBulkBookingAction('REJECT')} className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
                        <HiOutlineXCircle className="w-4 h-4" /> Reject
                      </button>
                      <button onClick={() => handleBulkBookingAction('DELETE')} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors border border-slate-600">
                        <HiOutlineTrash className="w-4 h-4" /> Delete
                      </button>
                      <button onClick={() => setSelectedBookings([])} className="px-3 py-2 bg-transparent hover:bg-slate-800 rounded-lg text-slate-300 font-medium text-sm transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="glass-card bg-white overflow-hidden border-slate-200/80 shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-200/80">
                        <tr>
                          <th className="px-6 py-4.5 w-10">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
                              checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBookings(filteredBookings.map(b => b.id));
                                } else {
                                  setSelectedBookings([]);
                                }
                              }}
                            />
                          </th>
                          <th className="px-6 py-4.5">Customer Name</th>
                          <th className="px-6 py-4.5">Mobile Number</th>
                          <th className="px-6 py-4.5">Trip Name</th>
                          <th className="px-6 py-4.5">Seats</th>
                          <th className="px-6 py-4.5">Paid / Total (Pending)</th>
                          <th className="px-6 py-4.5">Payment Screenshot</th>
                          <th className="px-6 py-4.5">Booking Date</th>
                          <th className="px-6 py-4.5">Status</th>
                          <th className="px-6 py-4.5">Notif</th>
                          <th className="px-6 py-4.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredBookings.map(booking => (
                          <tr key={booking.id} className={`text-sm hover:bg-slate-50/50 transition-colors duration-200 text-slate-700 ${selectedBookings.includes(booking.id) ? 'bg-violet-50/30' : ''}`}>
                            <td className="px-6 py-4">
                              <input 
                                type="checkbox" 
                                className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
                                checked={selectedBookings.includes(booking.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBookings(prev => [...prev, booking.id]);
                                  } else {
                                    setSelectedBookings(prev => prev.filter(id => id !== booking.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-800">{booking.travelerName}</td>
                            <td className="px-6 py-4 text-slate-600">{booking.phone}</td>
                            <td className="px-6 py-4 text-slate-600">{booking.trip?.title}</td>
                            <td className="px-6 py-4 text-slate-600 font-bold">{booking.seatCount}</td>
                            <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                              <div className="font-bold text-slate-800">
                                <span className="text-[#00C853]">₹{(booking.paidAmount || 0).toLocaleString()}</span>
                                {" / "}
                                <span>₹{booking.totalAmount?.toLocaleString()}</span>
                              </div>
                              <div className="text-[10px] text-rose-500 font-extrabold">
                                Pending: ₹{(booking.totalAmount - (booking.paidAmount || 0)).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {booking.paymentScreenshot ? (
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={booking.paymentScreenshot.startsWith('http') ? booking.paymentScreenshot : `${getApiBaseClean()}${booking.paymentScreenshot}`} 
                                    alt="Proof Thumbnail" 
                                    className="w-8 h-8 object-cover rounded shadow-sm border border-slate-200 cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => setSelectedBookingScreenshot(booking)}
                                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                  />
                                  <button 
                                    onClick={() => setSelectedBookingScreenshot(booking)}
                                    className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-600 border border-violet-100 text-xs font-bold hover:bg-violet-100 transition-all shadow-sm"
                                  >
                                    View Proof
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs font-medium">Automatic verification</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-600">{new Date(booking.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                                booking.status === 'CONFIRMED' 
                                  ? 'bg-green-50 border border-green-200 text-green-700' 
                                  : booking.status === 'PENDING_VERIFICATION'
                                  ? 'bg-purple-50 border border-purple-200 text-purple-700'
                                  : booking.status === 'CANCELLED'
                                  ? 'bg-red-50 border border-red-200 text-red-700'
                                  : 'bg-amber-50 border border-amber-200 text-amber-700'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {booking.notifications && booking.notifications.length > 0 ? (
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                  booking.notifications[0].status === 'SENT' ? 'text-green-600' :
                                  booking.notifications[0].status === 'FAILED' ? 'text-red-600' :
                                  'text-amber-600'
                                }`} title={booking.notifications[0].error || 'Notification sent'}>
                                  {booking.notifications[0].status}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-2 items-end">
                                  <div className="flex gap-2">
                                    {(booking.status === 'PENDING_VERIFICATION' || booking.status === 'PENDING') && (
                                      <>
                                        <button onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border border-green-200" title="Confirm Booking">
                                          <HiOutlineCheckCircle className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => {
                                          if (confirm("Are you sure you want to reject this booking?")) {
                                            const reason = prompt("Enter reason for rejection (optional):");
                                            updateBookingStatus(booking.id, 'REJECTED', reason || undefined);
                                          }
                                        }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200" title="Reject Booking">
                                          <HiOutlineXCircle className="w-5 h-5" />
                                        </button>
                                      </>
                                    )}
                                    <button onClick={() => deleteBooking(booking.id)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-red-600 transition-colors border border-slate-200" title="Delete Booking">
                                      <HiOutlineTrash className="w-5 h-5" />
                                    </button>
                                  </div>
                                  
                                  {booking.status === 'CONFIRMED' && (
                                    <div className="w-full mt-1">
                                      <a 
                                        href={generateWhatsAppLink(booking)}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-full px-3 py-1.5 bg-[#25D366] text-white rounded-md hover:bg-[#1ebd5a] flex items-center justify-center gap-1 font-bold transition-colors text-xs shadow-sm"
                                        title="Send WhatsApp Message"
                                      >
                                        <FaWhatsapp className="w-4 h-4" /> WhatsApp
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                        ))}
                        {filteredBookings.length === 0 && (
                          <tr>
                            <td colSpan={10} className="text-center py-10 text-slate-400 font-bold">No bookings found matching filters.</td>
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
                  <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
                    <select 
                      value={userFilter}
                      onChange={e => setUserFilter(e.target.value)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 bg-white shadow-sm font-semibold text-slate-700"
                    >
                      <option value="ALL">All Users</option>
                      <option value="CONFIRMED">Confirmed Bookings</option>
                      <option value="PENDING">Pending Payments</option>
                      <option value="REJECTED">Rejected Bookings</option>
                    </select>
                    <div className="relative">
                      <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        placeholder="Search name/mobile/id..." 
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 bg-white shadow-sm w-64"
                      />
                    </div>
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
                          const latestBooking = userItem.bookings?.[0];
                          return (
                            <tr key={userItem.id} className="text-sm hover:bg-slate-50/50 transition-colors duration-200 text-slate-700">
                              <td className="px-6 py-4">
                                <div className="font-semibold text-slate-800">{userItem.fullName}</div>
                                <div className="text-xs text-slate-400">Joined {new Date(userItem.createdAt).toLocaleDateString()}</div>
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-600">{userItem.mobileNumber}</td>
                              <td className="px-6 py-4 font-black text-slate-700">{userItem.totalTrips}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">₹{userItem.totalSpent?.toLocaleString()}</td>
                              <td className="px-6 py-4">
                                {latestBooking ? (
                                  <div className="text-xs">
                                    <span className="font-semibold text-slate-600">{latestBooking.trip?.title}</span>
                                    <div className="text-slate-400">{new Date(latestBooking.createdAt).toLocaleDateString()}</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-450 text-xs italic">No bookings yet</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                                  userItem.totalTrips > 1 ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-blue-50 border border-blue-200 text-blue-700'
                                }`}>
                                  {userItem.totalTrips > 1 ? 'REPEAT' : 'NEW'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <button onClick={() => setViewingUser(userItem)} className="px-3 py-1.5 bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-lg text-xs font-bold transition-colors">View Profile</button>
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
                          displayOrder: parseInt(crewForm.displayOrder) || 0,
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
                            displayOrder: '0',
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
                            <input name="displayOrder" type="number" required className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" value={crewForm.displayOrder || '0'} onChange={e => setCrewForm({...crewForm, displayOrder: e.target.value})} />
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
                    <div className="flex justify-end mb-2">
                      <button 
                        onClick={async () => {
                          const token = localStorage.getItem('tripnova_admin_token');
                          if (!token) return;
                          try {
                            const orders = crew.map(c => ({ id: c.id, displayOrder: c.displayOrder || 0 }));
                            await api.crew.reorder(orders, token);
                            toast.success('Crew order saved successfully!');
                          } catch (err) {
                            toast.error('Failed to save order');
                          }
                        }}
                        className="btn-primary py-2 px-6 shadow-md"
                      >
                        Save Bulk Order
                      </button>
                    </div>
                    {crew.length === 0 ? (
                      <div className="glass-card bg-white p-12 text-center text-slate-350 font-bold border-dashed border-2 border-slate-200 shadow-md">No crew members yet.</div>
                    ) : (
                      [...crew].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map((member, index) => (
                        <div key={member.id} className={`glass-card bg-white p-4.5 flex items-center gap-6 border hover:border-slate-300 hover:bg-slate-50/50 transition-all duration-300 shadow-sm ${member.isVisible === false ? 'opacity-60 border-dashed border-slate-200' : 'border-slate-200/80'}`}>
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <button 
                              onClick={() => {
                                if (index === 0) return;
                                const newCrew = [...crew].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                                const temp = newCrew[index].displayOrder;
                                newCrew[index].displayOrder = newCrew[index - 1].displayOrder;
                                newCrew[index - 1].displayOrder = temp;
                                setCrew(newCrew);
                              }}
                              className="text-slate-400 hover:text-violet-600 disabled:opacity-30 disabled:hover:text-slate-400 p-1"
                              disabled={index === 0}
                            >
                              <HiOutlineChevronUp className="w-5 h-5" />
                            </button>
                            <input 
                              type="number"
                              value={member.displayOrder || 0}
                              onChange={(e) => {
                                const newCrew = [...crew];
                                const target = newCrew.find(c => c.id === member.id);
                                if (target) target.displayOrder = parseInt(e.target.value) || 0;
                                setCrew(newCrew);
                              }}
                              className="w-12 text-center text-sm font-bold border border-slate-200 rounded p-1"
                            />
                            <button 
                              onClick={() => {
                                if (index === crew.length - 1) return;
                                const newCrew = [...crew].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                                const temp = newCrew[index].displayOrder;
                                newCrew[index].displayOrder = newCrew[index + 1].displayOrder;
                                newCrew[index + 1].displayOrder = temp;
                                setCrew(newCrew);
                              }}
                              className="text-slate-400 hover:text-violet-600 disabled:opacity-30 disabled:hover:text-slate-400 p-1"
                              disabled={index === crew.length - 1}
                            >
                              <HiOutlineChevronDown className="w-5 h-5" />
                            </button>
                          </div>
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
                            <div className="inline-block px-2.5 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-[0_0_8px_rgba(168,85,247,0.4)] mt-1">
                              {member.role}
                            </div>
                            <span className="text-xs text-slate-400 font-bold ml-2">Order: {member.displayOrder || 0}</span>
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
                  <div>
                    <h3 className="text-2xl font-black font-outfit text-slate-800">Manage Blogs</h3>
                    <p className="text-slate-500 text-sm mt-1">Create and manage travel journal entries.</p>
                  </div>
                  <button onClick={() => setIsAddingBlog(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-primary-600 transition-all font-bold text-sm shadow-md">
                    <HiOutlinePlus className="w-4 h-4" /> Write Blog
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {blogs.length === 0 ? (
                    <div className="md:col-span-2 glass-card bg-white p-12 text-center text-slate-350 font-bold border-dashed border-2 border-slate-200 shadow-md">No blogs created yet.</div>
                  ) : (
                    blogs.map(blog => (
                      <div key={blog.id} className="glass-card bg-white p-6 border border-slate-200/80 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group cursor-pointer" onClick={() => { setEditingBlog(blog); setIsAddingBlog(true); }}>
                        <div>
                          <span className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600 font-extrabold uppercase tracking-widest block mb-2">{blog.category || 'Travel'}</span>
                          <h4 className="font-bold text-lg font-outfit text-slate-800 mb-2 leading-snug group-hover:text-primary-600 transition-colors">{blog.title}</h4>
                          <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">{blog.excerpt || (blog.content ? blog.content.replace(/<[^>]*>?/gm, '') : '')}</p>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto">
                          <span className="text-xs font-semibold text-slate-400">By {blog.authorName || 'Admin'} • {new Date(blog.createdAt).toLocaleDateString()}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const token = localStorage.getItem('tripnova_admin_token');
                                if (!token) return;
                                try {
                                  const res = await api.blogs.update(blog.id, { published: !blog.published }, token);
                                  setBlogs(blogs.map(b => b.id === blog.id ? res : b));
                                  toast.success(`Blog ${res.published ? 'published' : 'unpublished'}`);
                                } catch(e) {
                                  toast.error('Failed to update status');
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${blog.published ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                            >
                              {blog.published ? 'Published' : 'Draft'}
                            </button>
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
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
                              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all duration-300"
                              title="Delete Blog"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'Updates' && (
              <motion.div key="updates" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black font-outfit text-slate-800">Manage Updates</h3>
                    <p className="text-slate-500 text-sm mt-1">Upload short video updates for the homepage.</p>
                  </div>
                  <button onClick={() => setIsAddingUpdate(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-primary-600 transition-all font-bold text-sm shadow-md">
                    <HiOutlinePlus className="w-4 h-4" /> Add Video
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="glass-card bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Total Videos</div>
                    <div className="text-2xl font-black text-indigo-600">{updateStats.total}</div>
                  </div>
                  <div className="glass-card bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Published</div>
                    <div className="text-2xl font-black text-green-600">{updateStats.published}</div>
                  </div>
                  <div className="glass-card bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Drafts</div>
                    <div className="text-2xl font-black text-amber-500">{updateStats.drafts}</div>
                  </div>
                  <div className="glass-card bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Total Views</div>
                    <div className="text-2xl font-black text-violet-600">{updateStats.totalViews}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {updates.length === 0 ? (
                    <div className="sm:col-span-2 lg:col-span-3 glass-card bg-white p-12 text-center text-slate-400 font-bold border-dashed border-2 border-slate-200">No videos uploaded yet.</div>
                  ) : (
                    updates.map(update => (
                      <div key={update.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group">
                        <div className="aspect-[9/16] bg-slate-900 w-full relative">
                          <video src={update.videoUrl} poster={update.thumbnailUrl || undefined} preload="none" autoPlay muted loop playsInline className="w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          
                          <div className="absolute top-4 left-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-widest uppercase ${update.status === 'PUBLISHED' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                              {update.status}
                            </span>
                          </div>

                          <div className="absolute bottom-0 left-0 p-4 w-full">
                            <div className="flex items-center gap-2 mb-2">
                              {update.category && <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-[10px] font-bold text-white uppercase tracking-wider">{update.category}</span>}
                              {update.views > 0 && <span className="text-white/80 text-xs font-bold flex items-center gap-1"><HiOutlineEye className="w-3 h-3"/> {update.views}</span>}
                            </div>
                            <h4 className="text-white font-bold text-lg leading-tight mb-1">{update.title}</h4>
                            <p className="text-white/70 text-xs line-clamp-2">{update.description}</p>
                          </div>
                        </div>
                        
                        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingUpdate(update);
                              setUpdateForm({
                                title: update.title,
                                description: update.description || '',
                                videoUrl: update.videoUrl,
                                thumbnailUrl: update.thumbnailUrl || '',
                                fileSize: update.fileSize || 0,
                                duration: update.duration || 0,
                                status: update.status || 'PUBLISHED',
                                category: update.category || ''
                              });
                              setIsAddingUpdate(true);
                            }}
                            className="p-2 bg-white text-slate-800 rounded-xl hover:bg-slate-100 transition-colors shadow-lg"
                            title="Edit Video"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              if (!confirm('Delete this video?')) return;
                              try {
                                const token = localStorage.getItem('tripnova_admin_token') || '';
                                await api.updates.delete(update.id, token);
                                setUpdates(updates.filter(u => u.id !== update.id));
                                fetchData();
                                toast.success('Video deleted');
                              } catch (e) {
                                toast.error('Failed to delete video');
                              }
                            }}
                            className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg"
                            title="Delete Video"
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

            {activeTab === 'Votes' && (
              <motion.div key="votes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black font-outfit text-slate-800">Vote Destinations</h3>
                    <p className="text-slate-500 text-sm mt-1">Manage user-suggested destinations and their votes.</p>
                  </div>
                </div>

                <div className="glass-card bg-white border border-slate-200/80 shadow-md rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto min-w-[700px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="p-4 font-bold text-xs uppercase tracking-widest text-slate-400">Destination</th>
                          <th className="p-4 font-bold text-xs uppercase tracking-widest text-slate-400">Suggested By</th>
                          <th className="p-4 font-bold text-xs uppercase tracking-widest text-slate-400 text-center">Votes</th>
                          <th className="p-4 font-bold text-xs uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {votes.map((vote) => (
                          <tr key={vote.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <h4 className="font-bold text-slate-800 font-outfit">{vote.name}</h4>
                              <p className="text-sm text-slate-500 line-clamp-1">{vote.description}</p>
                            </td>
                            <td className="p-4 text-sm text-slate-600 font-medium">{vote.suggestedBy}</td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1 rounded-full bg-rose-50 text-rose-600 font-bold text-sm border border-rose-100">
                                {vote.voteCount}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setEditingVote(vote)} 
                                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:border-violet-300 transition-all duration-300"
                                  title="Edit vote"
                                >
                                  <HiOutlinePencil className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => deleteVote(vote.id)} 
                                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all duration-300"
                                  title="Delete vote"
                                >
                                  <HiOutlineTrash className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {votes.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-400 font-bold">No vote destinations found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Visitor Analytics' && (
              <motion.div key="visitor-analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black font-outfit text-slate-800">Visitor Analytics</h3>
                </div>
                
                {visitorStats ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="glass-card bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Total Visitors</div>
                        <div className="text-3xl font-black text-indigo-600">{visitorStats.totalVisitors}</div>
                      </div>
                      <div className="glass-card bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Unique Visitors</div>
                        <div className="text-3xl font-black text-blue-600">{visitorStats.uniqueVisitors}</div>
                      </div>
                      <div className="glass-card bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Today's Visitors</div>
                        <div className="text-3xl font-black text-cyan-600">{visitorStats.todayVisitors}</div>
                      </div>
                      <div className="glass-card bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Weekly Visitors</div>
                        <div className="text-3xl font-black text-emerald-600">{visitorStats.weeklyVisitors}</div>
                      </div>
                      <div className="glass-card bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Monthly Visitors</div>
                        <div className="text-3xl font-black text-purple-600">{visitorStats.monthlyVisitors}</div>
                      </div>
                      <div className="glass-card bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Active Visitors</div>
                        <div className="text-3xl font-black text-green-600">{visitorStats.activeVisitors}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="glass-card bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-full">
                        <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Daily Visitors (Last 7 Days)</h4>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={visitorStats.dailyVisitors}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                              <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="glass-card bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Top Pages Visited</h4>
                        <ul className="space-y-3">
                          {visitorStats.pageStats?.map((p: any, i: number) => (
                            <li key={i} className="flex justify-between items-center text-sm">
                              <span className="text-slate-600 font-medium truncate pr-4">{p.page}</span>
                              <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">{p._count.page}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="glass-card bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Recent Visitors</h4>
                        <div className="overflow-y-auto max-h-[300px]">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-slate-100 sticky top-0 bg-white">
                                <th className="py-2 text-xs uppercase tracking-widest text-slate-400">Location</th>
                                <th className="py-2 text-xs uppercase tracking-widest text-slate-400">Device</th>
                                <th className="py-2 text-xs uppercase tracking-widest text-slate-400">OS/Browser</th>
                                <th className="py-2 text-xs uppercase tracking-widest text-slate-400">Time</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {visitorStats.recentVisitors?.map((v: any, i: number) => (
                                <tr key={i}>
                                  <td className="py-2 font-medium text-slate-700">{v.city ? `${v.city}, ${v.country}` : 'Unknown'}</td>
                                  <td className="py-2 text-slate-500">{v.device || 'Desktop'}</td>
                                  <td className="py-2 text-slate-500">{v.os} / {v.browser}</td>
                                  <td className="py-2 text-slate-500">{new Date(v.startedAt).toLocaleTimeString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center items-center py-20 text-slate-400 font-bold">Loading visitor data...</div>
                )}
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

                  {/* PWA & Mobile App Prompt Settings */}
                  <div className="glass-card bg-white p-6 border border-slate-200/80 shadow-md">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2 font-outfit text-slate-800"><HiOutlinePhone className="w-5.5 h-5.5 text-violet-600"/> PWA & Mobile App Settings</h4>
                    
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-xs font-bold text-slate-500">Enable App Download Prompt Popup</span>
                      <input 
                        type="hidden" 
                        name="app_prompt_enabled" 
                        value={appPromptEnabled ? 'true' : 'false'} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setAppPromptEnabled(!appPromptEnabled)}
                        className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${appPromptEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${appPromptEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Popup Title</label>
                        <input name="app_prompt_title" defaultValue={settings.app_prompt_title || 'Experience Travels on the Go'} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Popup Description</label>
                        <input name="app_prompt_description" defaultValue={settings.app_prompt_description || 'Download our mobile app or add it to your home screen for real-time alerts and offline maps.'} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Google Play Store Link</label>
                        <input name="app_prompt_play_store" defaultValue={settings.app_prompt_play_store || ''} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" placeholder="https://play.google.com/..." />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Apple App Store Link</label>
                        <input name="app_prompt_app_store" defaultValue={settings.app_prompt_app_store || ''} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" placeholder="https://apps.apple.com/..." />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Direct APK Download Link</label>
                        <input name="app_prompt_apk_link" defaultValue={settings.app_prompt_apk_link || ''} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" placeholder="https://mysurutravels.com/..." />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary py-4 px-8 w-full md:w-auto">Save All Settings</button>
                </form>
              </motion.div>
            )}

            {activeTab === 'WhatsApp Settings' && (
              <motion.div key="whatsappSettings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black font-outfit text-slate-800">WhatsApp Settings</h3>
                  <p className="text-slate-500 text-sm font-semibold">Configure the payment verification message</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-8">
                    <div className="glass-card bg-white p-6 border-slate-200/80 shadow-md">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-lg flex items-center gap-2 font-outfit text-slate-800"><FaWhatsapp className="w-5.5 h-5.5 text-green-500"/> Message Template</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">Active</span>
                          <button 
                            type="button" 
                            onClick={() => setWhatsAppForm({...whatsAppForm, isActive: !whatsAppForm.isActive})}
                            className={`w-10 h-5 rounded-full relative transition-colors ${whatsAppForm.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${whatsAppForm.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 block">Message Title</label>
                        <input 
                          value={whatsAppForm.messageTitle}
                          onChange={(e) => setWhatsAppForm({...whatsAppForm, messageTitle: e.target.value})}
                          className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 w-full"
                          placeholder="e.g. Booking Confirmation"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 block">Message Content</label>
                        <p className="text-xs text-slate-500 mb-2 font-medium">Use variables: {'{CustomerName}'}, {'{TripName}'}, {'{BookingID}'}, {'{MobileNumber}'}, {'{TripDate}'}, {'{SeatCount}'}, {'{AmountPaid}'}, {'{PickupLocation}'}</p>
                        <textarea 
                          rows={10} 
                          className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 w-full font-mono text-sm"
                          value={whatsAppForm.messageTemplate}
                          onChange={(e) => setWhatsAppForm({...whatsAppForm, messageTemplate: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="glass-card bg-white p-6 border-slate-200/80 shadow-md">
                      <h4 className="font-bold text-lg mb-6 flex items-center gap-2 font-outfit text-slate-800"><HiOutlineDocumentText className="w-5.5 h-5.5 text-violet-600"/> Upload Image</h4>
                      <p className="text-xs text-slate-500 mb-4 font-medium">Upload a promotional or confirmation poster (JPG, PNG). The image URL will be appended to the WhatsApp message text to generate a preview.</p>
                      
                      {whatsAppForm.imageUrl && (
                        <div className="mb-4 relative rounded-lg overflow-hidden border border-slate-200" style={{ height: '200px' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={whatsAppForm.imageUrl} alt="WhatsApp Poster" className="object-cover w-full h-full" />
                          <button 
                            onClick={() => setWhatsAppForm({...whatsAppForm, imageUrl: ''})}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      )}

                      <input type="file" accept="image/*" onChange={handleWhatsAppImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer" />
                    </div>

                    <div className="flex gap-4">
                      <button onClick={saveWhatsAppSettings} className="btn-primary py-4 px-8 flex-1 shadow-lg">Save Template</button>
                      <button onClick={resetWhatsAppSettings} className="px-8 py-4 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-bold transition-all shadow-md">Reset Default</button>
                    </div>
                  </div>

                  <div className="glass-card bg-slate-50 p-6 border-slate-200/80 shadow-inner">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2 font-outfit text-slate-800"><HiOutlineEye className="w-5.5 h-5.5 text-blue-600"/> Live Preview</h4>
                    <div className="bg-[#EFEAE2] p-4 rounded-xl max-w-sm mx-auto shadow-md" style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-solid-color-background.jpg")', backgroundSize: 'cover' }}>
                      <div className="bg-white p-3 rounded-lg shadow-sm mb-2 rounded-tr-none text-sm text-slate-800 max-w-[90%] ml-auto relative">
                        <div className="whitespace-pre-wrap font-sans">
                          {whatsAppForm.messageTemplate
                            .replace(/{CustomerName}/g, 'John Doe')
                            .replace(/{TripName}/g, 'Kashmir Adventure')
                            .replace(/{BookingID}/g, 'BKG-XYZ123')
                            .replace(/{MobileNumber}/g, '9876543210')
                            .replace(/{TripDate}/g, '25 Oct 2026')
                            .replace(/{SeatCount}/g, '2')
                            .replace(/{AmountPaid}/g, '15,000')
                            .replace(/{PickupLocation}/g, 'Mysuru Bus Stand')}
                        </div>
                        {whatsAppForm.imageUrl && (
                          <div className="mt-2 text-blue-500 underline text-xs break-all">
                            {whatsAppForm.imageUrl}
                          </div>
                        )}
                        <div className="text-[10px] text-right text-slate-400 mt-1">10:42 AM</div>
                      </div>
                      {whatsAppForm.imageUrl && (
                        <div className="bg-white p-1 rounded-lg shadow-sm mb-2 rounded-tr-none max-w-[90%] ml-auto relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={whatsAppForm.imageUrl} alt="Preview" className="rounded-md w-full h-auto" />
                          <div className="text-[10px] text-right text-slate-400 mt-1 absolute bottom-2 right-2 bg-black/40 text-white px-1 rounded">10:42 AM</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Social Integration' && (
              <motion.div key="social" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black font-outfit text-slate-800">Social Media Integration</h3>
                    <p className="text-slate-500 text-sm mt-1">Connect your Instagram account and customize sync behavior.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Account Status / Connect Section */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card bg-white p-6 border border-slate-200/80 shadow-md rounded-3xl">
                      <h4 className="font-bold text-lg mb-6 font-outfit text-slate-800">Account Connection</h4>
                      
                      {instagramSettings?.connected ? (
                        <div className="space-y-6 text-center">
                          <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-amber-500 p-1 bg-slate-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={instagramSettings.profilePicture} 
                              alt={instagramSettings.username} 
                              className="w-full h-full object-cover rounded-full"
                            />
                          </div>
                          
                          <div>
                            <h5 className="font-black text-slate-800 text-lg">@{instagramSettings.username}</h5>
                            <span className="inline-block px-2.5 py-0.5 mt-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-amber-200">
                              {instagramSettings.accountType}
                            </span>
                          </div>

                          <div className="divide-y divide-slate-100 border-t border-b border-slate-100 text-xs text-left py-2 space-y-2">
                            <div className="flex justify-between py-2">
                              <span className="text-slate-500">Status</span>
                              <span className={`font-bold ${instagramSettings.connectionStatus === 'CONNECTED' ? 'text-green-600' : 'text-rose-600'}`}>
                                {instagramSettings.connectionStatus}
                              </span>
                            </div>
                            <div className="flex justify-between py-2">
                              <span className="text-slate-500">Source</span>
                              <span className="font-semibold text-slate-700">
                                {instagramSettings.isDemo ? 'Simulation (Demo)' : 'Live API'}
                              </span>
                            </div>
                            <div className="flex justify-between py-2">
                              <span className="text-slate-500">Last Sync</span>
                              <span className="font-mono text-slate-700 font-bold">
                                {instagramSettings.lastSyncTime ? new Date(instagramSettings.lastSyncTime).toLocaleString() : 'Never'}
                              </span>
                            </div>
                          </div>

                          {instagramSettings.error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-750 rounded-2xl text-xs text-left font-medium space-y-2">
                              <div><strong>Connection/Sync Error:</strong> {instagramSettings.error}</div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={handleSyncInstagram}
                                  disabled={syncingInstagram}
                                  className="px-2.5 py-1 bg-red-650 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                                >
                                  {syncingInstagram ? 'Syncing...' : 'Retry Sync'}
                                </button>
                                {!instagramSettings.isDemo && (
                                  <button 
                                    onClick={handleConnectRealInstagram}
                                    className="px-2.5 py-1 bg-slate-905 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    Reconnect
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 gap-2 pt-2">
                            {!instagramSettings.isDemo && (
                              <>
                                <button 
                                  onClick={handleRefreshToken}
                                  disabled={refreshingToken}
                                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                  {refreshingToken ? 'Refreshing...' : 'Refresh Token'}
                                </button>
                                <button 
                                  onClick={handleConnectRealInstagram}
                                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs transition-all cursor-pointer border border-slate-200"
                                >
                                  Reconnect Account
                                </button>
                              </>
                            )}

                            <button 
                              onClick={handleDisconnectInstagram}
                              className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl text-xs transition-colors border border-red-200 cursor-pointer"
                            >
                              Disconnect Account
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6 text-center py-4">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-center mx-auto text-slate-400">
                            <HiOutlineShare className="w-8 h-8" />
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm text-slate-600 font-medium">No Instagram account currently connected.</p>
                            <p className="text-xs text-slate-400">Connect an account to automatically sync your reels, posts, and announcements onto the homepage feed.</p>
                          </div>

                          <div className="space-y-3">
                            <button 
                              onClick={handleConnectRealInstagram}
                              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm transition-all shadow-md cursor-pointer"
                            >
                              Connect Live Account
                            </button>
                            <button 
                              onClick={handleConnectDemoInstagram}
                              disabled={connectingDemo}
                              className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-2xl text-sm transition-colors border border-amber-200 cursor-pointer"
                            >
                              {connectingDemo ? 'Connecting...' : 'Connect Demo / Simulator'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Meta API Credentials Card */}
                    <div className="glass-card bg-white p-6 border border-slate-200/80 shadow-md rounded-3xl space-y-4">
                      <h4 className="font-bold text-lg font-outfit text-slate-800">Meta API Credentials</h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">Set up your Instagram Basic Display App credentials. Get these from your Facebook Meta Developer Console.</p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1">Instagram API Integration Type</label>
                          <select 
                            value={instaApiType}
                            onChange={(e: any) => setInstaApiType(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-2.5 outline-none focus:border-amber-400 focus:bg-white transition-all text-xs"
                          >
                            <option value="GRAPH_API">Instagram Graph API (Professional/Business/Creator Account - Recommended)</option>
                            <option value="BASIC_DISPLAY">Instagram Basic Display API (Personal/Legacy Account)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1">Instagram / Facebook App ID</label>
                          <input 
                            type="text"
                            value={instaClientId}
                            onChange={(e) => setInstaClientId(e.target.value)}
                            placeholder="e.g. 18247927492..."
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-2.5 outline-none focus:border-amber-400 focus:bg-white transition-all text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1">App Client Secret</label>
                          <input 
                            type="password"
                            value={instaClientSecret}
                            onChange={(e) => setInstaClientSecret(e.target.value)}
                            placeholder="••••••••••••••••"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-2.5 outline-none focus:border-amber-400 focus:bg-white transition-all text-xs"
                          />
                        </div>

                        <div className="bg-slate-50/50 border border-slate-200/85 p-3 rounded-2xl text-[10px] text-slate-500 font-medium">
                          <strong>Redirect URI:</strong> <span className="font-mono">{window.location.origin}/admin/instagram-callback</span>
                        </div>

                        <button 
                          onClick={async () => {
                            const token = localStorage.getItem('tripnova_admin_token');
                            if (!token) return;
                            if (instaClientId.includes('@')) {
                              toast.error('The App ID (Client ID) cannot be an email address. Please enter a numeric Meta App ID.');
                              return;
                            }
                            try {
                              const res = await api.instagram.updateSettings({
                                clientId: instaClientId,
                                clientSecret: instaClientSecret,
                                apiType: instaApiType
                              }, token);
                              setInstagramSettings(res);
                              toast.success('Instagram App credentials and integration type updated!');
                            } catch (e: any) {
                              toast.error('Failed to update credentials');
                            }
                          }}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                          Save Credentials
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sync Settings Section */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card bg-white p-6 border border-slate-200/80 shadow-md rounded-3xl space-y-6">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                        <h4 className="font-bold text-lg font-outfit text-slate-800">Synchronization Settings</h4>
                        {instagramSettings?.connected && (
                          <button 
                            onClick={handleSyncInstagram}
                            disabled={syncingInstagram}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                          >
                            {syncingInstagram ? 'Syncing...' : 'Sync Now'}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Auto Sync Toggle */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-150">
                          <div>
                            <p className="text-xs font-bold text-slate-800">Enable Auto Sync</p>
                            <p className="text-[10px] text-slate-400">Fetch new posts periodically in background</p>
                          </div>
                          <button 
                            type="button" 
                            disabled={!instagramSettings?.connected}
                            onClick={() => handleToggleSyncSetting('autoSync')}
                            className={`w-10 h-5 rounded-full relative transition-colors ${
                              !instagramSettings?.connected ? 'opacity-50 cursor-not-allowed' : ''
                            } ${instagramSettings?.autoSync ? 'bg-amber-500' : 'bg-slate-300'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${instagramSettings?.autoSync ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        {/* Sync Reels */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-150">
                          <div>
                            <p className="text-xs font-bold text-slate-800">Sync Reels</p>
                            <p className="text-[10px] text-slate-400">Include short Instagram reels in sync list</p>
                          </div>
                          <button 
                            type="button" 
                            disabled={!instagramSettings?.connected}
                            onClick={() => handleToggleSyncSetting('syncReels')}
                            className={`w-10 h-5 rounded-full relative transition-colors ${instagramSettings?.syncReels ? 'bg-amber-500' : 'bg-slate-300'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${instagramSettings?.syncReels ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        {/* Sync Posts */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-150">
                          <div>
                            <p className="text-xs font-bold text-slate-800">Sync Posts</p>
                            <p className="text-[10px] text-slate-400">Include image carousels and static posts</p>
                          </div>
                          <button 
                            type="button" 
                            disabled={!instagramSettings?.connected}
                            onClick={() => handleToggleSyncSetting('syncPosts')}
                            className={`w-10 h-5 rounded-full relative transition-colors ${instagramSettings?.syncPosts ? 'bg-amber-500' : 'bg-slate-300'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${instagramSettings?.syncPosts ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        {/* Sync Images */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-150">
                          <div>
                            <p className="text-xs font-bold text-slate-800">Sync Images Only</p>
                            <p className="text-[10px] text-slate-400">Filter and save static photo content</p>
                          </div>
                          <button 
                            type="button" 
                            disabled={!instagramSettings?.connected}
                            onClick={() => handleToggleSyncSetting('syncImages')}
                            className={`w-10 h-5 rounded-full relative transition-colors ${instagramSettings?.syncImages ? 'bg-amber-500' : 'bg-slate-300'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${instagramSettings?.syncImages ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        {/* Sync Videos */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-150">
                          <div>
                            <p className="text-xs font-bold text-slate-800">Sync Videos Only</p>
                            <p className="text-[10px] text-slate-400">Filter and save regular video formats</p>
                          </div>
                          <button 
                            type="button" 
                            disabled={!instagramSettings?.connected}
                            onClick={() => handleToggleSyncSetting('syncVideos')}
                            className={`w-10 h-5 rounded-full relative transition-colors ${instagramSettings?.syncVideos ? 'bg-amber-500' : 'bg-slate-300'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${instagramSettings?.syncVideos ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>

                        {/* Limit of media to show */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-2">
                          <label className="text-xs font-bold text-slate-800 block">Recent Posts Count Limit</label>
                          <select 
                            disabled={!instagramSettings?.connected}
                            value={instagramSettings?.syncLimit || 12}
                            onChange={(e) => handleSyncLimitChange(parseInt(e.target.value))}
                            className="w-full border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:border-amber-400 bg-white font-semibold text-slate-700"
                          >
                            <option value={6}>6 items</option>
                            <option value={12}>12 items</option>
                            <option value={24}>24 items</option>
                            <option value={48}>48 items</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Social Media Updates' && (
              <motion.div key="socialUpdates" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-black font-outfit text-slate-800">Social Media Updates</h3>
                    <p className="text-slate-500 text-sm mt-1">Manage manual social feeds, reels, reviews and announcements directly.</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setBulkUrls('');
                        setBulkCategory('reels');
                        setBulkModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all shadow-sm cursor-pointer"
                    >
                      Bulk Import
                    </button>
                    <button 
                      onClick={() => {
                        setSocialForm({
                          id: '',
                          url: '',
                          title: '',
                          description: '',
                          category: 'reels',
                          thumbnailUrl: '',
                          isFeatured: false,
                          orderIndex: 0
                        });
                        setSocialModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer"
                    >
                      Add Media Update
                    </button>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
                  <div className="flex gap-2 shrink-0 overflow-x-auto pb-1 sm:pb-0">
                    {['all', 'reels', 'videos', 'announcements', 'reviews', 'trips'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSocialFilter(cat)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                          socialFilter === cat
                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Search updates..."
                    value={socialSearch}
                    onChange={(e) => setSocialSearch(e.target.value)}
                    className="w-full sm:max-w-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-amber-400 focus:bg-white transition-all text-slate-800 font-semibold"
                  />
                </div>

                {/* Grid List */}
                {socialUpdates.filter(item => {
                  if (socialFilter !== 'all' && item.category !== socialFilter) return false;
                  if (socialSearch && !item.title.toLowerCase().includes(socialSearch.toLowerCase()) && !item.description.toLowerCase().includes(socialSearch.toLowerCase())) return false;
                  return true;
                }).length === 0 ? (
                  <div className="text-center py-20 bg-white border border-slate-200/60 rounded-3xl p-8 max-w-md mx-auto shadow-sm">
                    <HiOutlineShare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="font-bold text-lg text-slate-800 mb-1">No Updates Published</h3>
                    <p className="text-xs text-slate-400">Add a new manual update or run a bulk copy-paste upload of Instagram reels or YouTube Shorts URLs.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {socialUpdates
                      .filter(item => {
                        if (socialFilter !== 'all' && item.category !== socialFilter) return false;
                        if (socialSearch && !item.title.toLowerCase().includes(socialSearch.toLowerCase()) && !item.description.toLowerCase().includes(socialSearch.toLowerCase())) return false;
                        return true;
                      })
                      .map((item, idx) => {
                        return (
                          <div 
                            key={item.id} 
                            className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            <div className="relative aspect-video bg-slate-100 overflow-hidden">
                              {item.thumbnailUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-350 text-xs font-semibold">No Thumbnail</div>
                              )}
                              {item.isFeatured && (
                                <span className="absolute top-3 left-3 bg-amber-500 text-slate-900 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-amber-400">
                                  Featured
                                </span>
                              )}
                              <span className="absolute top-3 right-3 bg-slate-900/60 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest">
                                {item.type}
                              </span>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-100 inline-block">
                                  {item.category}
                                </span>
                                <h4 className="font-extrabold text-sm text-slate-800 line-clamp-1">{item.title}</h4>
                                <p className="text-slate-400 text-[11px] line-clamp-3 leading-relaxed">{item.description}</p>
                              </div>

                              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => handleReorderSocialUpdate(item.id, 'up')}
                                    disabled={idx === 0}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-30 cursor-pointer"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    onClick={() => handleReorderSocialUpdate(item.id, 'down')}
                                    disabled={idx === socialUpdates.length - 1}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 disabled:opacity-30 cursor-pointer"
                                  >
                                    ↓
                                  </button>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      setSocialForm({
                                        id: item.id,
                                        url: item.url,
                                        title: item.title,
                                        description: item.description,
                                        category: item.category,
                                        thumbnailUrl: item.thumbnailUrl || '',
                                        isFeatured: item.isFeatured,
                                        orderIndex: item.orderIndex
                                      });
                                      setSocialModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteSocialUpdate(item.id)}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </motion.div>
            )}

            {/* MODAL: Add / Edit Update */}
            {socialModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 relative"
                >
                  <button 
                    onClick={() => setSocialModalOpen(false)}
                    className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <HiOutlineX className="w-4 h-4" />
                  </button>

                  {/* Form Block */}
                  <form onSubmit={handleSaveSocialUpdate} className="space-y-4">
                    <h3 className="font-black text-xl text-slate-800 font-outfit mb-4">
                      {socialForm.id ? 'Edit Social Update' : 'New Social Media Update'}
                    </h3>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Media URL (Instagram / YouTube shorts)</label>
                      <input 
                        type="text"
                        value={socialForm.url}
                        onChange={(e) => setSocialForm({ ...socialForm, url: e.target.value })}
                        placeholder="https://www.instagram.com/reel/..."
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-2.5 outline-none focus:border-amber-400 focus:bg-white transition-all text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Title</label>
                      <input 
                        type="text"
                        value={socialForm.title}
                        onChange={(e) => setSocialForm({ ...socialForm, title: e.target.value })}
                        required
                        placeholder="Update Title"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-2.5 outline-none focus:border-amber-400 focus:bg-white transition-all text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Category</label>
                      <select 
                        value={socialForm.category}
                        onChange={(e) => setSocialForm({ ...socialForm, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-2.5 outline-none focus:border-amber-400 focus:bg-white transition-all text-xs"
                      >
                        <option value="reels">Reels</option>
                        <option value="videos">Videos</option>
                        <option value="announcements">Announcements</option>
                        <option value="reviews">Reviews</option>
                        <option value="trips">Trips</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Custom Thumbnail URL (Optional)</label>
                      <input 
                        type="text"
                        value={socialForm.thumbnailUrl}
                        onChange={(e) => setSocialForm({ ...socialForm, thumbnailUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-2.5 outline-none focus:border-amber-400 focus:bg-white transition-all text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Description</label>
                      <textarea 
                        value={socialForm.description}
                        onChange={(e) => setSocialForm({ ...socialForm, description: e.target.value })}
                        rows={3}
                        placeholder="Update description detail..."
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-2.5 outline-none focus:border-amber-400 focus:bg-white transition-all text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-3 py-2">
                      <span className="text-xs font-bold text-slate-700">Set as Featured Update</span>
                      <button 
                        type="button" 
                        onClick={() => setSocialForm({ ...socialForm, isFeatured: !socialForm.isFeatured })}
                        className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${socialForm.isFeatured ? 'bg-amber-500' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${socialForm.isFeatured ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      Publish Update
                    </button>
                  </form>

                  {/* Preview Card Block */}
                  <div className="flex flex-col justify-center bg-slate-50/50 border border-slate-100 rounded-3xl p-6 space-y-4">
                    <h4 className="font-extrabold text-sm text-slate-650 tracking-wider uppercase font-outfit">Live Preview</h4>
                    
                    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                      <div className="relative aspect-video bg-slate-200 flex items-center justify-center overflow-hidden">
                        {socialForm.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={socialForm.thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                        ) : socialForm.url && socialForm.url.includes('youtube.com/shorts/') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`https://img.youtube.com/vi/${socialForm.url.split('/shorts/')[1]?.split('?')[0]}/hqdefault.jpg`} alt="YT Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No media preview</div>
                        )}
                        <span className="absolute top-2 left-2 bg-amber-500 text-slate-900 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                          {socialForm.isFeatured ? 'Featured' : 'Standard'}
                        </span>
                        <span className="absolute top-2 right-2 bg-slate-900/70 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                          {socialForm.url.includes('youtube.com/shorts/') ? 'VIDEO' : socialForm.url.includes('instagram.com') ? 'REEL' : 'POST'}
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 inline-block">
                          {socialForm.category}
                        </span>
                        <h5 className="font-black text-xs text-slate-800 line-clamp-1">{socialForm.title || 'Untitled Update'}</h5>
                        <p className="text-slate-400 text-[10px] line-clamp-2 leading-relaxed">{socialForm.description || 'No description added yet.'}</p>
                      </div>
                    </div>

                    <div className="bg-slate-100/50 p-3.5 rounded-2xl text-[10px] text-slate-500 leading-relaxed font-medium">
                      💡 <strong>Smart Auto-detect:</strong> Pasting a YouTube Shorts URL automatically pulls its official high-definition cover thumbnail and sets the media format to Video!
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* MODAL: Bulk Upload */}
            {bulkModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xl w-full max-w-xl relative"
                >
                  <button 
                    onClick={() => setBulkModalOpen(false)}
                    className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <HiOutlineX className="w-4 h-4" />
                  </button>

                  <div className="space-y-4">
                    <h3 className="font-black text-xl text-slate-800 font-outfit">
                      Bulk Social Updates Import
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">Paste multiple social media links (Instagram reels, YouTube shorts, reviews) one per line. They will be automatically parsed, categorized, and added to the social feed.</p>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Select Category for these URLs</label>
                      <select 
                        value={bulkCategory}
                        onChange={(e) => setBulkCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold rounded-xl p-2.5 outline-none focus:border-amber-400 focus:bg-white transition-all text-xs"
                      >
                        <option value="reels">Reels</option>
                        <option value="videos">Videos</option>
                        <option value="announcements">Announcements</option>
                        <option value="reviews">Reviews</option>
                        <option value="trips">Trips</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Pasted URLs (One per line)</label>
                      <textarea 
                        value={bulkUrls}
                        onChange={(e) => setBulkUrls(e.target.value)}
                        rows={6}
                        placeholder="https://www.instagram.com/reel/C_Reel1/&#10;https://youtube.com/shorts/Shorts1/&#10;https://www.instagram.com/reel/C_Reel2/"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono rounded-xl p-3 outline-none focus:border-amber-400 focus:bg-white transition-all text-xs"
                      />
                    </div>

                    <button 
                      onClick={handleBulkUploadSocialUpdates}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      Import & Publish Links
                    </button>
                  </div>
                </motion.div>
              </div>
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
                onClick={() => {
                  setSelectedBookingScreenshot(null);
                  setAdminNotes('');
                }}
                className="w-10 h-10 rounded-full hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <HiOutlineXCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 max-h-[50vh] flex flex-col items-center justify-center p-2 mb-6">
              <img 
                src={selectedBookingScreenshot.paymentScreenshot?.startsWith('http') 
                  ? selectedBookingScreenshot.paymentScreenshot 
                  : `${getApiBaseClean()}${selectedBookingScreenshot.paymentScreenshot}`} 
                alt="Payment screenshot proof"
                className="max-w-full max-h-[40vh] object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Image+Not+Found';
                }}
              />
              <a 
                href={selectedBookingScreenshot.paymentScreenshot?.startsWith('http') 
                  ? selectedBookingScreenshot.paymentScreenshot 
                  : `${getApiBaseClean()}${selectedBookingScreenshot.paymentScreenshot}`} 
                download={`payment-${selectedBookingScreenshot.bookingRef}`} 
                target="_blank" 
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-white/20"
              >
                <HiOutlineDownload className="w-5 h-5" /> Download Screenshot
              </a>
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
                <span className="text-[10px] font-extrabold text-slate-450 uppercase block">Total Price / Paid / Pending</span>
                <span className="font-bold text-slate-800">
                  ₹{selectedBookingScreenshot.totalAmount?.toLocaleString()}
                  {" / "}
                  <span className="text-[#00C853]">₹{(selectedBookingScreenshot.paidAmount || 0).toLocaleString()}</span>
                  {" / "}
                  <span className="text-rose-500">₹{(selectedBookingScreenshot.totalAmount - (selectedBookingScreenshot.paidAmount || 0)).toLocaleString()}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-450 uppercase block">Status</span>
                <span className="font-bold text-violet-600 uppercase tracking-widest">{selectedBookingScreenshot.status}</span>
              </div>
            </div>

            {/* Payment history list */}
            {selectedBookingScreenshot.paymentHistory && selectedBookingScreenshot.paymentHistory.length > 0 && (
              <div className="mb-6 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-3">Payment Submissions</h4>
                <div className="space-y-3">
                  {selectedBookingScreenshot.paymentHistory.map((ph: any) => (
                    <div key={ph.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">Amount: ₹{ph.amount.toLocaleString()} ({ph.method})</p>
                        <p className="text-slate-400 text-[10px]">Date: {new Date(ph.date || ph.createdAt).toLocaleDateString()}</p>
                        {ph.notes && <p className="text-slate-450 text-[10px] italic">Notes: {ph.notes}</p>}
                        {ph.screenshot && (
                          <a href={ph.screenshot.startsWith('http') ? ph.screenshot : `${getApiBaseClean()}${ph.screenshot}`} target="_blank" rel="noopener noreferrer" className="text-violet-600 font-bold hover:underline block mt-1">
                            View Screenshot Proof
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {ph.status === 'PENDING' ? (
                          <>
                            <button 
                              onClick={async () => {
                                const token = localStorage.getItem('tripnova_admin_token');
                                if (!token) return;
                                try {
                                  await api.bookings.updateStatus(selectedBookingScreenshot.id, 'CONFIRMED', token, adminNotes);
                                  toast.success('Payment verified!');
                                  setSelectedBookingScreenshot(null);
                                  fetchData();
                                } catch (e: any) {
                                  toast.error(e.message);
                                }
                              }}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors cursor-pointer"
                            >
                              Verify
                            </button>
                            <button 
                              onClick={async () => {
                                if (!adminNotes.trim()) {
                                  toast.error('Please enter a rejection reason in Admin Notes');
                                  return;
                                }
                                const token = localStorage.getItem('tripnova_admin_token');
                                if (!token) return;
                                try {
                                  await api.bookings.updateStatus(selectedBookingScreenshot.id, 'REJECTED', token, adminNotes);
                                  toast.success('Payment rejected');
                                  setSelectedBookingScreenshot(null);
                                  fetchData();
                                } catch (e: any) {
                                  toast.error(e.message);
                                }
                              }}
                              className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg font-bold hover:bg-red-100 transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            ph.status === 'VERIFIED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {ph.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block font-outfit">Admin Notes (Used for verification/rejection)</label>
              <textarea 
                placeholder="Internal notes or rejection reasons..." 
                className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-violet-400 bg-slate-50/50 resize-none" 
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  updateBookingStatus(selectedBookingScreenshot.id, 'CONFIRMED', adminNotes);
                  setSelectedBookingScreenshot(null);
                  setAdminNotes('');
                }} 
                className="flex-1 bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/10 cursor-pointer"
              >
                <HiOutlineCheckCircle className="w-5 h-5" /> Confirm Overall Booking
              </button>
              <button 
                onClick={() => {
                  if (!adminNotes.trim()) {
                    toast.error('Please provide a reason for rejection in Admin Notes');
                    return;
                  }
                  updateBookingStatus(selectedBookingScreenshot.id, 'REJECTED', adminNotes);
                  setSelectedBookingScreenshot(null);
                  setAdminNotes('');
                }} 
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <HiOutlineXCircle className="w-5 h-5" /> Reject Overall Booking
              </button>
            </div>

            {/* Record Manual Payment Form */}
            <div className="border-t border-slate-100 pt-4 mt-6">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-3">Record Direct / Manual Payment</h4>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[120px]">
                  <label className="text-[10px] text-slate-450 font-bold block mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 5000" 
                    value={adminPayAmount} 
                    onChange={e => setAdminPayAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-violet-400 bg-slate-50"
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="text-[10px] text-slate-450 font-bold block mb-1">Method</label>
                  <select 
                    value={adminPayMethod} 
                    onChange={e => setAdminPayMethod(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-violet-400 bg-white font-semibold text-slate-700"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
                <div className="flex-[2] min-w-[180px]">
                  <label className="text-[10px] text-slate-450 font-bold block mb-1">Notes</label>
                  <input 
                    type="text" 
                    placeholder="Payment details / notes" 
                    value={adminPayNotes} 
                    onChange={e => setAdminPayNotes(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-violet-400 bg-slate-50"
                  />
                </div>
                <button 
                  onClick={async () => {
                    if (!adminPayAmount || parseFloat(adminPayAmount) <= 0) {
                      toast.error('Please enter a valid amount');
                      return;
                    }
                    const token = localStorage.getItem('tripnova_admin_token');
                    if (!token) return;
                    try {
                      await fetchAPI(`/bookings/${selectedBookingScreenshot.id}/payments`, {
                        method: 'POST',
                        body: JSON.stringify({
                          amount: parseFloat(adminPayAmount),
                          method: adminPayMethod,
                          notes: adminPayNotes
                        }),
                        token
                      });
                      toast.success('Manual payment recorded successfully!');
                      setAdminPayAmount('');
                      setAdminPayNotes('');
                      setSelectedBookingScreenshot(null);
                      fetchData();
                    } catch (e: any) {
                      toast.error(e.message);
                    }
                  }}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer shadow-md"
                >
                  Record
                </button>
              </div>
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

      {/* MODAL: Edit Vote */}
      {editingVote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-black text-xl text-slate-800">Edit Vote Destination</h3>
                <p className="text-xs text-slate-400">Update details for {editingVote.name}</p>
              </div>
              <button 
                onClick={() => setEditingVote(null)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <HiOutlineXCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveVote} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Destination Name</label>
                <input 
                  required
                  value={voteForm.name}
                  onChange={e => setVoteForm({...voteForm, name: e.target.value})}
                  className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Description</label>
                <textarea 
                  required
                  value={voteForm.description}
                  onChange={e => setVoteForm({...voteForm, description: e.target.value})}
                  className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 h-24 resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Total Votes</label>
                <input 
                  type="number"
                  min="0"
                  required
                  value={voteForm.voteCount}
                  onChange={e => setVoteForm({...voteForm, voteCount: parseInt(e.target.value) || 0})}
                  className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900"
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3.5 mt-4">Save Changes</button>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Add/Edit Administrator Account */}
      {viewingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl relative my-8">
            <button onClick={() => setViewingUser(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
              <HiOutlineX className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center text-2xl font-black">
                {viewingUser.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="text-2xl font-black font-outfit text-slate-800">{viewingUser.fullName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-slate-500">{viewingUser.mobileNumber}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-sm font-bold text-violet-600">Total Spent: ₹{viewingUser.totalSpent?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <HiOutlineTicket className="w-5 h-5 text-violet-500" />
                Booking History
              </h3>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {viewingUser.bookings?.map((b: any) => (
                  <div key={b.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold font-mono text-slate-400">#{b.bookingRef}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                          b.status === 'REJECTED' || b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg">{b.trip?.title}</h4>
                      <p className="text-sm text-slate-500 mt-1">Booked on: {new Date(b.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-slate-800">₹{b.totalAmount.toLocaleString()}</div>
                      <div className="text-xs text-slate-500 mt-1 font-medium">{b.seatCount} Seat{b.seatCount > 1 ? 's' : ''}</div>
                      {b.paymentScreenshot && (
                        <a href={b.paymentScreenshot} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-violet-600 hover:text-violet-700">
                          View Receipt <HiOutlineExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {(!viewingUser.bookings || viewingUser.bookings.length === 0) && (
                  <div className="text-center py-8 text-slate-400 font-medium">No bookings found for this customer.</div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

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
      {/* MODAL: Add Update Video */}
      {isAddingUpdate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-black text-xl text-slate-800">Add Video Update</h3>
                <p className="text-xs text-slate-400">Upload a video feed for the homepage.</p>
              </div>
              <button 
                onClick={() => setIsAddingUpdate(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <HiOutlineXCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="space-y-4 max-h-[80vh] overflow-y-auto px-2">
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Title</label>
                <input 
                  required
                  value={updateForm.title}
                  onChange={e => setUpdateForm({...updateForm, title: e.target.value})}
                  className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 w-full"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Video Upload</label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
                  <input 
                    type="file" 
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska" 
                    onChange={handleVideoUpload}
                    disabled={isUploadingVideo}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-bold
                      file:bg-violet-50 file:text-violet-700
                      hover:file:bg-violet-100 disabled:opacity-50 cursor-pointer"
                  />
                  {isUploadingVideo && <p className="text-xs font-bold text-violet-600 mt-2 animate-pulse">Uploading and compressing video... please wait (up to 100MB)</p>}
                  {updateForm.videoUrl && !isUploadingVideo && (
                    <div className="mt-3 w-full rounded-xl overflow-hidden aspect-video bg-black">
                      <video src={updateForm.videoUrl} controls className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Category</label>
                  <input 
                    value={updateForm.category}
                    onChange={e => setUpdateForm({...updateForm, category: e.target.value})}
                    placeholder="e.g. Travel, Review, Guide"
                    className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 w-full"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Status</label>
                  <select 
                    value={updateForm.status}
                    onChange={e => setUpdateForm({...updateForm, status: e.target.value})}
                    className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 w-full font-bold"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Description</label>
                <textarea 
                  value={updateForm.description}
                  onChange={e => setUpdateForm({...updateForm, description: e.target.value})}
                  className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 h-24 resize-none w-full"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isUploadingVideo || !updateForm.videoUrl} 
                className="btn-primary w-full py-3.5 mt-4 disabled:opacity-50"
              >
                {editingUpdate ? 'Save Changes' : 'Publish Video'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
      
      {/* MODAL: Add/Edit Blog */}
      {isAddingBlog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-black text-xl text-slate-800">{editingBlog ? 'Edit Blog Post' : 'Write New Blog'}</h3>
                <p className="text-xs text-slate-400">Share your travel experiences and tips.</p>
              </div>
              <button 
                onClick={() => { setIsAddingBlog(false); setEditingBlog(null); }}
                className="w-10 h-10 rounded-full hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <HiOutlineXCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveBlog} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Title</label>
                  <input required value={blogForm.title} onChange={e => setBlogForm({...blogForm, title: e.target.value})} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Category</label>
                  <input required value={blogForm.category} onChange={e => setBlogForm({...blogForm, category: e.target.value})} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" placeholder="e.g. Travel Guide" />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Tags (comma separated)</label>
                  <input value={blogForm.tags} onChange={e => setBlogForm({...blogForm, tags: e.target.value})} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" placeholder="Trekking, Nature, Mountains" />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Cover Image URL</label>
                  <input value={blogForm.coverImage} onChange={e => setBlogForm({...blogForm, coverImage: e.target.value})} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900" placeholder="https://..." />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Short Excerpt</label>
                <textarea required value={blogForm.excerpt} onChange={e => setBlogForm({...blogForm, excerpt: e.target.value})} className="input-field border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 h-20 resize-none" />
              </div>
              <div className="mb-12">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 block">Rich Content</label>
                <div className="h-64 mb-10 text-slate-900">
                  <ReactQuill theme="snow" value={blogForm.content} onChange={(val: string) => setBlogForm({...blogForm, content: val})} className="h-full rounded-xl bg-white" />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full py-3.5 mt-8">Save Blog Post</button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

