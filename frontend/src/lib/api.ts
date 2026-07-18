export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const inflightRequests = new Map<string, Promise<any>>();
const responseCache = new Map<string, { expiresAt: number; data: any }>();
const PUBLIC_GET_CACHE_TTL_MS = 30_000;

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { token, ...fetchOpts } = options;
  const method = (fetchOpts.method || 'GET').toUpperCase();
  const isGetRequest = method === 'GET';
  if (!isGetRequest) {
    responseCache.clear();
  }
  const isPublicGetRequest = isGetRequest && !token;
  const cacheKey = `${method}:${token || 'public'}:${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOpts.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (isPublicGetRequest) {
    const cachedEntry = responseCache.get(cacheKey);
    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
      return cachedEntry.data;
    }
  }

  if (isGetRequest && inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...fetchOpts, headers });
    
    let data;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }
    } else {
      const textData = await res.text();
      data = { error: textData || `Unexpected response format (${res.status})` };
    }

    if (!res.ok) {
      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tripnova_admin_token');
          localStorage.removeItem('tripnova_admin_user');
          if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login?expired=true';
          }
        }
        throw new Error("Session expired. Please log in again.");
      }
      if (res.status === 429) {
        throw new Error("Too many requests. Please try again later.");
      }
      throw new Error(data?.error || `API request failed with status ${res.status}`);
    }

    if (isPublicGetRequest) {
      responseCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + PUBLIC_GET_CACHE_TTL_MS,
      });
    }

    return data;
  })();

  if (isGetRequest) {
    inflightRequests.set(cacheKey, requestPromise);
    requestPromise.finally(() => {
      inflightRequests.delete(cacheKey);
    });
  }

  return requestPromise;
}

// Trips
export const api = {
  trips: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI(`/trips${query}`);
    },
    getById: (id: string) => fetchAPI(`/trips/${id}`),
    create: (data: any, token: string) => fetchAPI('/trips', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: any, token: string) => fetchAPI(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    delete: (id: string, token: string) => fetchAPI(`/trips/${id}`, { method: 'DELETE', token }),
  },

  bookings: {
    create: (data: any) => fetchAPI('/bookings', { method: 'POST', body: JSON.stringify(data) }),
    getAll: (token: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI(`/bookings${query}`, { token });
    },
    getByRef: (ref: string) => fetchAPI(`/bookings/ref/${ref}`),
    update: (id: string, data: any, token: string) => fetchAPI(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
    updateStatus: (id: string, status: string, token: string, adminNotes?: string) => fetchAPI(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, adminNotes }), token }),
    delete: (id: string, token: string) => fetchAPI(`/bookings/${id}`, { method: 'DELETE', token }),
    bulkUpdate: (bookingIds: string[], action: 'CONFIRM' | 'REJECT' | 'DELETE', token: string) => fetchAPI('/bookings/bulk-update', { method: 'POST', body: JSON.stringify({ bookingIds, action }), token }),
    uploadScreenshot: async (id: string, formData: FormData) => {
      const res = await fetch(`${API_BASE}/bookings/${id}/screenshot`, {
        method: 'PATCH',
        body: formData,
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: text || 'Screenshot upload failed' };
      }
      if (!res.ok) throw new Error(data.error || 'Screenshot upload failed');
      return data;
    },
  },

  payments: {
    createOrder: (data: any) => fetchAPI('/payments/create-order', { method: 'POST', body: JSON.stringify(data) }),
    verify: (data: any) => fetchAPI('/payments/verify', { method: 'POST', body: JSON.stringify(data) }),
    getAll: (token: string) => fetchAPI('/payments', { token }),
  },

  reviews: {
    getByTrip: (tripId: string) => fetchAPI(`/reviews/trip/${tripId}`),
    create: (data: any) => fetchAPI('/reviews', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string, token: string) => fetchAPI(`/reviews/${id}`, { method: 'DELETE', token }),
  },

  blogs: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI(`/blogs${query}`);
    },
    getBySlug: (slug: string) => fetchAPI(`/blogs/${slug}`),
    create: (data: any, token: string) => fetchAPI('/blogs', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: any, token: string) => fetchAPI(`/blogs/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    delete: (id: string, token: string) => fetchAPI(`/blogs/${id}`, { method: 'DELETE', token }),
  },

  votes: {
    getDestinations: () => fetchAPI('/vote/destinations'),
    suggest: (data: any) => fetchAPI('/vote/destinations', { method: 'POST', body: JSON.stringify(data) }),
    vote: (id: string, voterEmail: string) => fetchAPI(`/vote/${id}/vote`, { method: 'POST', body: JSON.stringify({ voterEmail }) }),
    comment: (id: string, data: any) => fetchAPI(`/vote/${id}/comments`, { method: 'POST', body: JSON.stringify(data) }),
    updateDestination: (id: string, data: any, token: string) => fetchAPI(`/vote/destinations/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    deleteDestination: (id: string, token: string) => fetchAPI(`/vote/destinations/${id}`, { method: 'DELETE', token }),
  },

  chat: {
    getMessages: (tripId: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI(`/chat/${tripId}/messages${query}`);
    },
    getPinned: (tripId: string) => fetchAPI(`/chat/${tripId}/pinned`),
    deleteMessage: (id: string, token: string) => fetchAPI(`/chat/message/${id}`, { method: 'DELETE', token }),
  },

  crew: {
    getAll: () => fetchAPI('/crew'),
    create: (data: any, token: string) => fetchAPI('/crew', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: any, token: string) => fetchAPI(`/crew/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    delete: (id: string, token: string) => fetchAPI(`/crew/${id}`, { method: 'DELETE', token }),
    reorder: (orders: { id: string; displayOrder: number }[], token: string) => fetchAPI('/crew/reorder', { method: 'PATCH', body: JSON.stringify({ orders }), token }),
  },

  settings: {
    getAll: () => fetchAPI('/settings'),
    update: (settings: any, token: string) => fetchAPI('/settings', { method: 'POST', body: JSON.stringify({ settings }), token }),
  },

  whatsappSettings: {
    get: () => fetchAPI('/whatsapp-settings'),
    update: (data: any, token: string) => fetchAPI('/whatsapp-settings', { method: 'POST', body: JSON.stringify(data), token }),
    reset: (token: string) => fetchAPI('/whatsapp-settings/reset', { method: 'POST', token }),
  },

  updates: {
    getAll: () => fetchAPI('/updates'),
    getAdminAll: (token: string) => fetchAPI('/updates/admin', { token }),
    getStats: (token: string) => fetchAPI('/updates/stats', { token }),
    create: (data: any, token: string) => fetchAPI('/updates', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: any, token: string) => fetchAPI(`/updates/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    delete: (id: string, token: string) => fetchAPI(`/updates/${id}`, { method: 'DELETE', token }),
    incrementView: (id: string) => fetchAPI(`/updates/${id}/view`, { method: 'POST' }),
  },

  instagram: {
    getSettings: (token: string) => fetchAPI('/instagram/settings', { token }),
    updateSettings: (data: any, token: string) => fetchAPI('/instagram/settings', { method: 'POST', body: JSON.stringify(data), token }),
    connectDemo: (token: string) => fetchAPI('/instagram/connect-demo', { method: 'POST', token }),
    connectReal: (code: string, redirectUri: string, token: string) => fetchAPI('/instagram/connect', { method: 'POST', body: JSON.stringify({ code, redirectUri }), token }),
    disconnect: (token: string) => fetchAPI('/instagram/disconnect', { method: 'POST', token }),
    sync: (token: string) => fetchAPI('/instagram/sync', { method: 'POST', token }),
    refreshToken: (token: string) => fetchAPI('/instagram/refresh-token', { method: 'POST', token }),
    getFeed: () => fetchAPI('/instagram/feed'),
  },

  socialUpdates: {
    getAll: (params: { category?: string; type?: string; search?: string; page?: number; limit?: number }) => {
      const filteredParams = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== '')
        .reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {});
      const q = new URLSearchParams(filteredParams).toString();
      return fetchAPI(`/social-updates?${q}`);
    },
    getById: (id: string) => fetchAPI(`/social-updates/${id}`),
    create: (data: any, token: string) => fetchAPI('/social-updates', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: any, token: string) => fetchAPI(`/social-updates/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    delete: (id: string, token: string) => fetchAPI(`/social-updates/${id}`, { method: 'DELETE', token }),
    reorder: (orders: { id: string; orderIndex: number }[], token: string) => fetchAPI('/social-updates/reorder', { method: 'POST', body: JSON.stringify({ orders }), token }),
  },

  upload: {
    single: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/upload/single`, {
        method: 'POST',
        body: formData,
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: text || 'Upload failed' };
      }
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data;
    },
    video: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/upload/video`, {
        method: 'POST',
        body: formData,
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: text || 'Video upload failed' };
      }
      if (!res.ok) throw new Error(data.error || 'Video upload failed');
      return data;
    }
  },

  marketplace: {
    getAll: (params?: any) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined) searchParams.append(key, params[key]);
        });
      }
      return fetchAPI(`/marketplace?${searchParams.toString()}`);
    },
    getById: (id: string) => fetchAPI(`/marketplace/${id}`),
    create: (data: any, token: string) => fetchAPI('/marketplace', { method: 'POST', body: JSON.stringify(data), token }),
    update: (id: string, data: any, token: string) => fetchAPI(`/marketplace/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    delete: (id: string, token: string) => fetchAPI(`/marketplace/${id}`, { method: 'DELETE', token }),
  },

  ai: {
    search: (query: string) => fetchAPI(`/ai/search?q=${encodeURIComponent(query)}`),
  },

  users: {
    getAll: (token: string) => fetchAPI('/users', { token }),
  },

  auth: {
    login: (email: string, password: string) => fetchAPI('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    verify: (token: string) => fetchAPI('/auth/admin/verify', { token }),
    dashboard: (token: string) => fetchAPI('/auth/admin/dashboard', { token }),
    getUsers: (token: string) => fetchAPI('/auth/admin/users', { token }),
    updateUser: (email: string, data: any, token: string) => fetchAPI(`/auth/admin/users/${email}`, { method: 'PUT', body: JSON.stringify(data), token }),
    deleteUser: (email: string, token: string) => fetchAPI(`/auth/admin/users/${email}`, { method: 'DELETE', token }),
    getAdmins: (token: string) => fetchAPI('/auth/admin/admins', { token }),
    createAdmin: (data: any, token: string) => fetchAPI('/auth/admin/admins', { method: 'POST', body: JSON.stringify(data), token }),
    updateAdmin: (id: string, data: any, token: string) => fetchAPI(`/auth/admin/admins/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    deleteAdmin: (id: string, token: string) => fetchAPI(`/auth/admin/admins/${id}`, { method: 'DELETE', token }),
  },

  notifications: {
    get: (email: string) => fetchAPI(`/notifications?email=${email}`),
    markRead: (id: string) => fetchAPI(`/notifications/${id}/read`, { method: 'PATCH' }),
  },
};

export default api;
