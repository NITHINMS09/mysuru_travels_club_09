import { Router } from 'express';
import { InstagramService } from '../services/instagramService';
import { authenticateAdmin } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();

// GET settings (admin protected)
router.get('/settings', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const settings = await InstagramService.getSettings();
    res.json(settings);
  } catch (err: any) {
    console.error('Fetch Instagram settings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST update settings (admin protected)
router.post('/settings', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const updated = await InstagramService.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    console.error('Update Instagram settings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST connect demo account (admin protected)
router.post('/connect-demo', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const settings = await InstagramService.connectDemo();
    res.json({ success: true, settings });
  } catch (err: any) {
    console.error('Connect Demo Instagram error:', err);
    res.status(500).json({ error: err.message || 'Connection failed' });
  }
});

// POST disconnect account (admin protected)
router.post('/disconnect', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const settings = await InstagramService.disconnect();
    res.json({ success: true, settings });
  } catch (err: any) {
    console.error('Disconnect Instagram error:', err);
    res.status(500).json({ error: 'Disconnection failed' });
  }
});

// POST manual sync (admin protected)
router.post('/sync', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const success = await InstagramService.syncInstagramMedia();
    if (success) {
      const settings = await InstagramService.getSettings();
      res.json({ success: true, settings });
    } else {
      res.status(400).json({ error: 'Sync failed, check settings status logs' });
    }
  } catch (err: any) {
    console.error('Manual sync Instagram error:', err);
    res.status(500).json({ error: err.message || 'Sync failed' });
  }
});

// POST connect real account via OAuth code (admin protected)
router.post('/connect', authenticateAdmin, async (req: AuthRequest, res) => {
  const { code, redirectUri } = req.body;
  if (!code || !redirectUri) {
    return res.status(400).json({ error: 'Code and redirectUri are required' });
  }

  const dbClientId = await prisma.siteSetting.findUnique({ where: { key: 'instagram_client_id' } }).then(s => s?.value);
  const dbClientSecret = await prisma.siteSetting.findUnique({ where: { key: 'instagram_client_secret' } }).then(s => s?.value);

  const clientId = dbClientId || process.env.INSTAGRAM_APP_ID || process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = dbClientSecret || process.env.INSTAGRAM_APP_SECRET || process.env.INSTAGRAM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(400).json({ 
      error: 'Instagram Client ID and Client Secret are not configured. Please set them in the Social Integration panel.' 
    });
  }

  const apiTypeSetting = await prisma.siteSetting.findUnique({ where: { key: 'instagram_api_type' } }).then(s => s?.value) || 'GRAPH_API';

  try {
    let longLivedToken = '';
    let username = 'instagram_user';
    let accountType = 'BUSINESS';
    let profilePic = 'https://cdn.corenexis.com/files/c/8845266721.png';
    let businessAccountId = '';
    let facebookPageId = '';

    if (apiTypeSetting === 'GRAPH_API') {
      // --- Facebook Login / Instagram Graph API Flow ---
      
      // 1. Exchange OAuth code for User Access Token
      const tokenUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`;
      const tokenRes = await fetch(tokenUrl);
      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Facebook OAuth token exchange failed: ${errText}`);
      }
      const tokenData = (await tokenRes.json()) as any;
      const shortLivedToken = tokenData.access_token;

      // 2. Exchange short-lived token for Long-Lived Token (valid for 60 days)
      const exchangeUrl = `https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`;
      const exchangeRes = await fetch(exchangeUrl);
      if (!exchangeRes.ok) {
        throw new Error(`Failed to exchange long-lived Facebook token: Status ${exchangeRes.status}`);
      }
      const exchangeData = (await exchangeRes.json()) as any;
      longLivedToken = exchangeData.access_token;

      // 3. Fetch user's Facebook pages
      const pagesUrl = `https://graph.facebook.com/v23.0/me/accounts?access_token=${longLivedToken}`;
      const pagesRes = await fetch(pagesUrl);
      if (!pagesRes.ok) {
        throw new Error(`Failed to fetch Facebook pages: Status ${pagesRes.status}`);
      }
      const pagesData = (await pagesRes.json()) as any;
      const pages = pagesData.data || [];
      if (pages.length === 0) {
        throw new Error('No Facebook pages found. Your Instagram Creator or Business account must be connected to a Facebook Page.');
      }

      // 4. Find page with a connected Instagram business account
      for (const page of pages) {
        const pageId = page.id;
        const pageInfoUrl = `https://graph.facebook.com/v23.0/${pageId}?fields=instagram_business_account&access_token=${longLivedToken}`;
        const pageInfoRes = await fetch(pageInfoUrl);
        if (pageInfoRes.ok) {
          const pageInfo = (await pageInfoRes.json()) as any;
          if (pageInfo.instagram_business_account) {
            businessAccountId = pageInfo.instagram_business_account.id;
            facebookPageId = pageId;
            break;
          }
        }
      }

      if (!businessAccountId) {
        throw new Error('No connected Instagram Business/Creator account found on your Facebook Pages. Ensure your Instagram account is Professional and linked to your Facebook Page.');
      }

      // 5. Fetch Instagram Business Profile details
      const igProfileUrl = `https://graph.facebook.com/v23.0/${businessAccountId}?fields=username,name,profile_picture_url&access_token=${longLivedToken}`;
      const igProfileRes = await fetch(igProfileUrl);
      if (igProfileRes.ok) {
        const igProfile = (await igProfileRes.json()) as any;
        username = igProfile.username || username;
        profilePic = igProfile.profile_picture_url || profilePic;
      }
      accountType = 'BUSINESS';
    } else {
      // --- Instagram Basic Display API Flow ---

      // 1. Exchange OAuth code for short-lived token
      const tokenForm = new URLSearchParams();
      tokenForm.append('client_id', clientId);
      tokenForm.append('client_secret', clientSecret);
      tokenForm.append('grant_type', 'authorization_code');
      tokenForm.append('redirect_uri', redirectUri);
      tokenForm.append('code', code);

      const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        body: tokenForm,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Instagram Basic Display token exchange failed: ${errText}`);
      }

      const tokenData = (await tokenRes.json()) as any;
      const shortLivedToken = tokenData.access_token;

      // 2. Exchange short-lived token for long-lived token
      const exchangeUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`;
      const exchangeRes = await fetch(exchangeUrl);
      if (!exchangeRes.ok) {
        throw new Error(`Failed to exchange long-lived Instagram token: Status ${exchangeRes.status}`);
      }

      const exchangeData = (await exchangeRes.json()) as any;
      longLivedToken = exchangeData.access_token;

      // 3. Fetch profile details
      const profileUrl = `https://graph.instagram.com/me?fields=username,account_type&access_token=${longLivedToken}`;
      const profileRes = await fetch(profileUrl);
      if (profileRes.ok) {
        const profileData = (await profileRes.json()) as any;
        username = profileData.username || username;
        accountType = profileData.account_type || accountType;
      }
    }

    // 4. Save connection details in database
    const settings = await InstagramService.connectReal(
      longLivedToken,
      username,
      accountType,
      apiTypeSetting as 'GRAPH_API' | 'BASIC_DISPLAY',
      businessAccountId,
      facebookPageId,
      profilePic
    );
    res.json({ success: true, settings });
  } catch (err: any) {
    console.error('Connect Real Instagram error:', err);
    await prisma.siteSetting.upsert({
      where: { key: 'instagram_error' },
      update: { value: err.message || 'Real Instagram connection failed' },
      create: { key: 'instagram_error', value: err.message || 'Real Instagram connection failed', category: 'instagram' }
    });
    await prisma.siteSetting.upsert({
      where: { key: 'instagram_connection_status' },
      update: { value: 'CONNECTION_FAILED' },
      create: { key: 'instagram_connection_status', value: 'CONNECTION_FAILED', category: 'instagram' }
    });
    res.status(500).json({ error: err.message || 'Real Instagram connection failed' });
  }
});

// POST refresh token (admin protected)
router.post('/refresh-token', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const success = await InstagramService.refreshAccessToken();
    const settings = await InstagramService.getSettings();
    if (success) {
      res.json({ success: true, settings });
    } else {
      res.status(400).json({ error: 'Token refresh failed', settings });
    }
  } catch (err: any) {
    console.error('Refresh Instagram token error:', err);
    res.status(500).json({ error: err.message || 'Token refresh failed' });
  }
});

// GET feed (public)
router.get('/feed', async (req, res) => {
  try {
    const feeds = await prisma.instagramMedia.findMany({
      orderBy: { timestamp: 'desc' }
    });
    res.json(feeds);
  } catch (err: any) {
    console.error('Fetch Instagram feed error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
