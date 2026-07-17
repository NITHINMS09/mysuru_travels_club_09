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

  const clientId = dbClientId || process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = dbClientSecret || process.env.INSTAGRAM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(400).json({ 
      error: 'Instagram Client ID and Client Secret are not configured. Please set them in the Social Integration panel.' 
    });
  }

  try {
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
      throw new Error(`Instagram token exchange failed: ${errText}`);
    }

    const tokenData = (await tokenRes.json()) as any;
    const shortLivedToken = tokenData.access_token;
    const userId = tokenData.user_id;

    // 2. Exchange short-lived token for long-lived token
    const exchangeUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`;
    const exchangeRes = await fetch(exchangeUrl);
    if (!exchangeRes.ok) {
      throw new Error(`Failed to exchange long-lived token: Status ${exchangeRes.status}`);
    }

    const exchangeData = (await exchangeRes.json()) as any;
    const longLivedToken = exchangeData.access_token;

    // 3. Fetch profile information
    const profileUrl = `https://graph.instagram.com/me?fields=username,account_type&access_token=${longLivedToken}`;
    const profileRes = await fetch(profileUrl);
    let username = 'instagram_user';
    let accountType = 'PERSONAL';

    if (profileRes.ok) {
      const profileData = (await profileRes.json()) as any;
      username = profileData.username || username;
      accountType = profileData.account_type || accountType;
    }

    // 4. Save connection details in database
    const settings = await InstagramService.connectReal(longLivedToken, username, accountType);
    res.json({ success: true, settings });
  } catch (err: any) {
    console.error('Connect Real Instagram error:', err);
    res.status(500).json({ error: err.message || 'Real Instagram connection failed' });
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
