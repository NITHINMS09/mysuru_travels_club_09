import prisma from '../config/database';

export interface InstagramSettings {
  connected: boolean;
  username: string;
  profilePicture: string;
  accountType: string;
  connectionStatus: string;
  lastSyncTime: string | null;
  autoSync: boolean;
  syncReels: boolean;
  syncPosts: boolean;
  syncImages: boolean;
  syncVideos: boolean;
  syncLimit: number;
  syncFrequencyHours: number;
  isDemo: boolean;
  error: string | null;
  clientId?: string;
  clientSecret?: string;
  apiType?: 'GRAPH_API' | 'BASIC_DISPLAY';
  businessAccountId?: string;
  facebookPageId?: string;
}

// Utility to get or create site settings
async function getSettingValue(key: string, defaultValue: string): Promise<string> {
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  if (!setting) {
    await prisma.siteSetting.create({
      data: { key, value: defaultValue, category: 'instagram' }
    });
    return defaultValue;
  }
  return setting.value;
}

async function setSettingValue(key: string, value: string): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value, category: 'instagram' },
    update: { value }
  });
}

export class InstagramService {
  /**
   * Retrieves all Instagram settings from the database
   */
  static async getSettings(): Promise<InstagramSettings> {
    const connected = (await getSettingValue('instagram_connected', 'false')) === 'true';
    const username = await getSettingValue('instagram_username', '');
    const profilePicture = await getSettingValue('instagram_profile_picture', '/logo.png');
    const accountType = await getSettingValue('instagram_account_type', 'PERSONAL');
    const connectionStatus = await getSettingValue('instagram_connection_status', 'DISCONNECTED');
    const lastSyncStr = await getSettingValue('instagram_last_sync_time', '');
    const autoSync = (await getSettingValue('instagram_auto_sync', 'true')) === 'true';
    const syncReels = (await getSettingValue('instagram_sync_reels', 'true')) === 'true';
    const syncPosts = (await getSettingValue('instagram_sync_posts', 'true')) === 'true';
    const syncImages = (await getSettingValue('instagram_sync_images', 'true')) === 'true';
    const syncVideos = (await getSettingValue('instagram_sync_videos', 'true')) === 'true';
    const syncLimit = parseInt(await getSettingValue('instagram_sync_limit', '12'), 10);
    const syncFrequencyHours = parseInt(await getSettingValue('instagram_sync_frequency', '6'), 10);
    const isDemo = (await getSettingValue('instagram_is_demo', 'false')) === 'true';
    const error = await getSettingValue('instagram_error', '');
    const clientId = await getSettingValue('instagram_client_id', '');
    const clientSecret = await getSettingValue('instagram_client_secret', '');
    const apiType = await getSettingValue('instagram_api_type', 'GRAPH_API') as 'GRAPH_API' | 'BASIC_DISPLAY';
    const businessAccountId = await getSettingValue('instagram_business_account_id', '');
    const facebookPageId = await getSettingValue('instagram_facebook_page_id', '');

    return {
      connected,
      username,
      profilePicture,
      accountType,
      connectionStatus,
      lastSyncTime: lastSyncStr || null,
      autoSync,
      syncReels,
      syncPosts,
      syncImages,
      syncVideos,
      syncLimit,
      syncFrequencyHours,
      isDemo,
      error: error || null,
      clientId,
      clientSecret: clientSecret ? '••••••••••••••••' : '',
      apiType,
      businessAccountId,
      facebookPageId
    };
  }

  /**
   * Updates settings toggles and sync limits
   */
  static async updateSettings(settings: Partial<InstagramSettings>): Promise<InstagramSettings> {
    if (settings.autoSync !== undefined) await setSettingValue('instagram_auto_sync', settings.autoSync ? 'true' : 'false');
    if (settings.syncReels !== undefined) await setSettingValue('instagram_sync_reels', settings.syncReels ? 'true' : 'false');
    if (settings.syncPosts !== undefined) await setSettingValue('instagram_sync_posts', settings.syncPosts ? 'true' : 'false');
    if (settings.syncImages !== undefined) await setSettingValue('instagram_sync_images', settings.syncImages ? 'true' : 'false');
    if (settings.syncVideos !== undefined) await setSettingValue('instagram_sync_videos', settings.syncVideos ? 'true' : 'false');
    if (settings.syncLimit !== undefined) await setSettingValue('instagram_sync_limit', settings.syncLimit.toString());
    if (settings.syncFrequencyHours !== undefined) await setSettingValue('instagram_sync_frequency', settings.syncFrequencyHours.toString());
    if (settings.clientId !== undefined) await setSettingValue('instagram_client_id', settings.clientId);
    if (settings.clientSecret !== undefined && settings.clientSecret !== '••••••••••••••••') {
      await setSettingValue('instagram_client_secret', settings.clientSecret);
    }
    if (settings.apiType !== undefined) await setSettingValue('instagram_api_type', settings.apiType);

    return this.getSettings();
  }

  /**
   * Connects a simulated/mock Instagram account for demo purposes
   */
  static async connectDemo(): Promise<InstagramSettings> {
    await setSettingValue('instagram_connected', 'true');
    await setSettingValue('instagram_is_demo', 'true');
    await setSettingValue('instagram_username', 'mysurutravels_insta');
    await setSettingValue('instagram_profile_picture', '/logo.png');
    await setSettingValue('instagram_account_type', 'CREATOR');
    await setSettingValue('instagram_connection_status', 'CONNECTED');
    await setSettingValue('instagram_error', '');
    await setSettingValue('instagram_last_sync_time', '');

    // Instantly load mock media
    await this.syncInstagramMedia();

    return this.getSettings();
  }

  /**
   * Connects a real Instagram account with a long-lived access token
   */
  static async connectReal(
    accessToken: string,
    username: string,
    accountType: string,
    apiType: 'GRAPH_API' | 'BASIC_DISPLAY' = 'GRAPH_API',
    businessAccountId: string = '',
    facebookPageId: string = '',
    profilePic?: string
  ): Promise<InstagramSettings> {
    await setSettingValue('instagram_connected', 'true');
    await setSettingValue('instagram_is_demo', 'false');
    await setSettingValue('instagram_access_token', accessToken);
    await setSettingValue('instagram_username', username);
    await setSettingValue('instagram_profile_picture', profilePic || '/logo.png');
    await setSettingValue('instagram_account_type', accountType);
    await setSettingValue('instagram_connection_status', 'CONNECTED');
    await setSettingValue('instagram_error', '');
    await setSettingValue('instagram_api_type', apiType);
    await setSettingValue('instagram_business_account_id', businessAccountId);
    await setSettingValue('instagram_facebook_page_id', facebookPageId);
    
    // Set token expiration (approx 60 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);
    await setSettingValue('instagram_token_expires_at', expiresAt.toISOString());

    // Trigger sync
    await this.syncInstagramMedia();

    return this.getSettings();
  }

  /**
   * Disconnects the connected Instagram account
   */
  static async disconnect(): Promise<InstagramSettings> {
    await setSettingValue('instagram_connected', 'false');
    await setSettingValue('instagram_is_demo', 'false');
    await setSettingValue('instagram_username', '');
    await setSettingValue('instagram_profile_picture', '/logo.png');
    await setSettingValue('instagram_account_type', 'PERSONAL');
    await setSettingValue('instagram_connection_status', 'DISCONNECTED');
    await setSettingValue('instagram_access_token', '');
    await setSettingValue('instagram_token_expires_at', '');
    await setSettingValue('instagram_error', '');
    await setSettingValue('instagram_last_sync_time', '');
    await setSettingValue('instagram_api_type', 'GRAPH_API');
    await setSettingValue('instagram_business_account_id', '');
    await setSettingValue('instagram_facebook_page_id', '');

    // Delete all cached media on disconnection
    await prisma.instagramMedia.deleteMany({});

    return this.getSettings();
  }

  /**
   * Syncs Instagram posts / reels
   */
  static async syncInstagramMedia(): Promise<boolean> {
    const settings = await this.getSettings();
    if (!settings.connected) {
      return false;
    }

    try {
      if (settings.isDemo) {
        await this.syncDemoMedia(settings);
      } else {
        await this.syncLiveMedia(settings);
      }

      // Update sync time
      await setSettingValue('instagram_last_sync_time', new Date().toISOString());
      await setSettingValue('instagram_error', '');
      await setSettingValue('instagram_connection_status', 'CONNECTED');
      return true;
    } catch (err: any) {
      console.error('Instagram Sync Error:', err);
      await setSettingValue('instagram_error', err.message || 'Sync failed');
      await setSettingValue('instagram_connection_status', 'SYNC_ERROR');
      return false;
    }
  }

  /**
   * Generate high-quality mock data for demo simulation mode
   */
  private static async syncDemoMedia(settings: InstagramSettings) {
    // Premium Travel Mock Feeds
    const mockMediaList = [
      {
        instagramId: 'mock_reel_1',
        mediaType: 'VIDEO',
        mediaUrl: '/videos/hero-bg.mp4', // Premium video clip
        thumbnailUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0612b1b?q=80&w=600&auto=format&fit=crop', // Royal Palace View
        permalink: 'https://www.instagram.com/reel/C_PalaceIlluminationDemo/',
        caption: 'Experience the magical illumination of the majestic Mysore Palace! 🏰✨ The golden light sparkles across the heritage city every Sunday evening. A must-see on our Mysuru heritage tour! #MysuruTourism #HeritageCity #MysorePalace #IncredibleIndia',
        timestamp: new Date(Date.now() - 3600000 * 2) // 2 hours ago
      },
      {
        instagramId: 'mock_reel_2',
        mediaType: 'VIDEO',
        mediaUrl: '/videos/hero-bg.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=600&auto=format&fit=crop', // Nature hills safari view
        permalink: 'https://www.instagram.com/reel/C_ChamundiHillsMorning/',
        caption: 'Chasing sunrises at Chamundi Hills! 🌅☁️ Panoramic views of Mysuru wrapped in early morning mist. Feel the cool breeze at Nandi Bull temple! Join our upcoming weekend expedition. #ChamundiHills #SunsetViews #SunriseChaser #MysuruTravels',
        timestamp: new Date(Date.now() - 3600000 * 24) // 1 day ago
      },
      {
        instagramId: 'mock_post_3',
        mediaType: 'IMAGE',
        mediaUrl: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=600&auto=format&fit=crop', // Masala Dosa
        thumbnailUrl: null,
        permalink: 'https://www.instagram.com/p/C_MysoreMasalaDosa/',
        caption: 'Crispy, butter-laden, and smeared with the legendary spicy red chutney! 🥞🌶️ Finding the absolute best Mysore Masala Dosa in town. Foodie walks are now included in all tour packages! #MysoreMasalaDosa #SouthIndianFood #FoodieGram #TravelKarnataka',
        timestamp: new Date(Date.now() - 3600000 * 48) // 2 days ago
      },
      {
        instagramId: 'mock_reel_4',
        mediaType: 'VIDEO',
        mediaUrl: '/videos/hero-bg.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1549366021-9f761d450615?q=80&w=600&auto=format&fit=crop', // Safari elephant
        permalink: 'https://www.instagram.com/reel/C_KabiniWildlifeSafari/',
        caption: 'A majestic encounter in the heart of Kabini Forest! 🐘🌿 Spotting elephants, deers, and the elusive black panther during our open-jeep wildlife safari. Book your jungle gateway now! #KabiniSafari #WildlifePhotography #ElephantsOfIndia #JungleVibes',
        timestamp: new Date(Date.now() - 3600000 * 72) // 3 days ago
      },
      {
        instagramId: 'mock_post_5',
        mediaType: 'IMAGE',
        mediaUrl: 'https://images.unsplash.com/photo-1561361513-2d000a50f0db?q=80&w=600&auto=format&fit=crop', // Silk sarees
        thumbnailUrl: null,
        permalink: 'https://www.instagram.com/p/C_MysoreSilkHandloom/',
        caption: 'Behind the scenes at the local silk weaving cooperative. 🧵🌟 Watching pure gold thread and fine silk transform into gorgeous Mysore Silk Sarees. Supporting local artisans and heritage weavers. #MysoreSilk #ArtisansOfIndia #HandloomSaree #CultureTrip',
        timestamp: new Date(Date.now() - 3600000 * 96) // 4 days ago
      },
      {
        instagramId: 'mock_reel_6',
        mediaType: 'VIDEO',
        mediaUrl: '/videos/hero-bg.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=600&auto=format&fit=crop', // Waterfall
        permalink: 'https://www.instagram.com/reel/C_ChunchanakatteFalls/',
        caption: 'Mist, roar, and magic at Chunchanakatte Falls! 🌊🌲 The Cauvery River cascading down in full glory. The perfect spot for photography and weekend relaxation. Our travelers loved this hidden gem! #ChunchanakatteFalls #WaterfallsOfKarnataka #NatureLovers #TravelGram',
        timestamp: new Date(Date.now() - 3600000 * 120) // 5 days ago
      }
    ];

    // Filter based on toggles
    let filtered = mockMediaList.filter(item => {
      const isVideo = item.mediaType === 'VIDEO';
      const isReel = isVideo && item.permalink.includes('/reel/');
      
      if (isReel && !settings.syncReels) return false;
      if (!isReel && isVideo && !settings.syncVideos) return false;
      if (!isVideo && !settings.syncImages) return false;
      if (!settings.syncPosts && item.mediaType === 'IMAGE') return false;

      return true;
    });

    // Truncate to limit
    filtered = filtered.slice(0, settings.syncLimit);

    // Save to Database
    await prisma.$transaction(async (tx) => {
      // Clear existing cached feed first
      await tx.instagramMedia.deleteMany({});

      // Bulk create
      for (const item of filtered) {
        await tx.instagramMedia.create({
          data: {
            instagramId: item.instagramId,
            mediaType: item.mediaType,
            mediaUrl: item.mediaUrl,
            thumbnailUrl: item.thumbnailUrl,
            permalink: item.permalink,
            caption: item.caption,
            timestamp: item.timestamp
          }
        });
      }
    });
  }

  /**
   * Syncs real data from Instagram API
   */
  private static async syncLiveMedia(settings: InstagramSettings) {
    const token = await getSettingValue('instagram_access_token', '');
    if (!token) throw new Error('No access token available');

    // 1. Check if token refresh is needed (older than 30 days)
    const expiresAtStr = await getSettingValue('instagram_token_expires_at', '');
    if (expiresAtStr) {
      const expiresAt = new Date(expiresAtStr);
      const daysUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 3600 * 24);
      if (daysUntilExpiry < 30) {
        try {
          await this.refreshLongLivedToken(token);
        } catch (e) {
          console.warn('Failed to refresh Instagram access token, continuing with sync:', e);
        }
      }
    }

    // 2. Fetch media from Instagram API
    const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';
    const limit = Math.max(10, settings.syncLimit * 2); // Fetch extra items to allow filtering on backend
    const apiType = await getSettingValue('instagram_api_type', 'GRAPH_API');
    const businessAccountId = await getSettingValue('instagram_business_account_id', '');

    const url = apiType === 'GRAPH_API'
      ? `https://graph.facebook.com/v23.0/${businessAccountId}/media?fields=${fields}&limit=${limit}&access_token=${token}`
      : `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${token}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errBody = (await response.json().catch(() => ({}))) as any;
      throw new Error(errBody.error?.message || `Instagram API returned status ${response.status}`);
    }

    const resData = (await response.json()) as any;
    const data = resData.data || [];

    // 3. Process and filter list
    const processed = data
      .map((item: any) => {
        return {
          instagramId: item.id,
          mediaType: item.media_type === 'CAROUSEL_ALBUM' ? 'IMAGE' : item.media_type,
          mediaUrl: item.media_url,
          permalink: item.permalink,
          thumbnailUrl: item.thumbnail_url || null,
          caption: item.caption || '',
          timestamp: new Date(item.timestamp)
        };
      })
      .filter((item: any) => {
        const isVideo = item.mediaType === 'VIDEO';
        const isReel = isVideo && item.permalink.includes('/reel/');

        if (isReel && !settings.syncReels) return false;
        if (!isReel && isVideo && !settings.syncVideos) return false;
        if (!isVideo && !settings.syncImages) return false;
        if (!settings.syncPosts && item.mediaType === 'IMAGE') return false;

        return true;
      })
      .slice(0, settings.syncLimit);

    // 4. Save to Database
    await prisma.$transaction(async (tx) => {
      await tx.instagramMedia.deleteMany({});
      for (const item of processed) {
        await tx.instagramMedia.create({
          data: {
            instagramId: item.instagramId,
            mediaType: item.mediaType,
            mediaUrl: item.mediaUrl,
            thumbnailUrl: item.thumbnailUrl,
            permalink: item.permalink,
            caption: item.caption,
            timestamp: item.timestamp
          }
        });
      }
    });
  }

  /**
   * Refreshes long lived token with Instagram Basic Display API
   */
  private static async refreshLongLivedToken(oldToken: string) {
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${oldToken}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to refresh access token: Status ${response.status}`);
    }
    const resBody = (await response.json()) as any;
    if (resBody.access_token) {
      await setSettingValue('instagram_access_token', resBody.access_token);
      
      const newExpiry = new Date();
      newExpiry.setSeconds(newExpiry.getSeconds() + (resBody.expires_in || 5184000));
      await setSettingValue('instagram_token_expires_at', newExpiry.toISOString());
    }
  }

  /**
   * Manually refreshes the long-lived access token
   */
  static async refreshAccessToken(): Promise<boolean> {
    const token = await getSettingValue('instagram_access_token', '');
    if (!token) throw new Error('No access token available to refresh');

    try {
      await this.refreshLongLivedToken(token);
      await setSettingValue('instagram_error', '');
      await setSettingValue('instagram_connection_status', 'CONNECTED');
      await setSettingValue('instagram_last_sync_time', new Date().toISOString());
      return true;
    } catch (err: any) {
      console.error('Refresh Token Error:', err);
      await setSettingValue('instagram_error', err.message || 'Token refresh failed');
      await setSettingValue('instagram_connection_status', 'TOKEN_REFRESH_FAILED');
      return false;
    }
  }

  /**
   * Background Interval Auto Sync scheduler
   */
  static startAutoSyncScheduler(): void {
    const CHECK_INTERVAL_MS = 10 * 60 * 1000; // Check every 10 minutes
    console.log('⏰ Instagram Auto Sync Scheduler initialized (checks every 10m)');

    setInterval(async () => {
      try {
        const settings = await this.getSettings();
        if (!settings.connected || !settings.autoSync) {
          return;
        }

        // Check if sync frequency is reached
        if (settings.lastSyncTime) {
          const lastSync = new Date(settings.lastSyncTime);
          const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 3600);
          if (hoursSinceSync < settings.syncFrequencyHours) {
            return;
          }
        }

        console.log('🔄 Automatic Instagram sync triggered in background...');
        const success = await this.syncInstagramMedia();
        if (success) {
          console.log('✅ Automatic Instagram sync completed successfully');
        } else {
          console.warn('⚠️ Automatic Instagram sync failed');
        }
      } catch (err) {
        console.error('Error running Instagram background sync scheduler:', err);
      }
    }, CHECK_INTERVAL_MS);
  }
}
