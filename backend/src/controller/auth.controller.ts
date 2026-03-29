import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAccount } from '../models/GoogleAccount';
import { isDatabaseConnected } from '../config/database';

const oauth2Client = new OAuth2Client(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// In-memory fallback when MongoDB is unavailable
let memoryRefreshToken: string | null = null;

// 1. Generate the Google OAuth URL
export const getAuthUrl = (req: Request, res: Response) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/adwords'],
    prompt: 'consent select_account',
  });
  res.json({ url });
};

// 2. Handle Google's OAuth redirect — exchange code and save refresh token
export const handleGoogleCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const oauthError = req.query.error as string;

  if (oauthError) {
    console.error('Google OAuth denied:', oauthError);
    const msg = encodeURIComponent(`Google OAuth denied: ${oauthError}`);
    return res.redirect(`http://localhost:3000/?status=error&message=${msg}`);
  }

  if (!code) {
    return res.redirect('http://localhost:3000/?status=error&message=No+authorization+code+received');
  }

  try {
    console.log('Exchanging auth code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Tokens received. Has refresh_token:', !!tokens.refresh_token);

    if (tokens.refresh_token) {
      if (isDatabaseConnected()) {
        // DB is available — save to MongoDB
        await GoogleAccount.findOneAndUpdate(
          { userId: 'test-user-1' },
          { refreshToken: tokens.refresh_token, connectedAt: new Date() },
          { upsert: true, new: true }
        );
        console.log('✅ Refresh token saved to MongoDB.');
      } else {
        // DB not available — save to memory as fallback
        memoryRefreshToken = tokens.refresh_token;
        console.warn('⚠️  MongoDB not connected. Refresh token saved to memory (temporary).');
        console.warn('   → Fix your MongoDB Atlas IP whitelist to persist across restarts.');
      }
      return res.redirect('http://localhost:3000/?status=success');
    } else {
      // No new refresh token — check if one already exists
      const existing = await getStoredRefreshToken();
      if (existing) {
        console.log('No new refresh token returned, but existing token found — OK.');
        return res.redirect('http://localhost:3000/?status=success');
      }

      const msg = encodeURIComponent(
        'No refresh token received. Please disconnect and reconnect your Google account.'
      );
      return res.redirect(`http://localhost:3000/?status=error&message=${msg}`);
    }
  } catch (err: any) {
    console.error('OAuth Callback Error:', err?.message || err);
    const msg = encodeURIComponent(err?.message || 'OAuth token exchange failed');
    return res.redirect(`http://localhost:3000/?status=error&message=${msg}`);
  }
};

// Helper: get stored refresh token (DB first, memory fallback)
export const getStoredRefreshToken = async (): Promise<string | null> => {
  if (isDatabaseConnected()) {
    const account = await GoogleAccount.findOne({ userId: 'test-user-1' });
    return account?.refreshToken || memoryRefreshToken;
  }
  return memoryRefreshToken;
};

// 3. Check if Google account is connected
export const checkConnection = async (req: Request, res: Response) => {
  try {
    const token = await getStoredRefreshToken();
    if (token) {
      res.json({ connected: true });
    } else {
      res.json({ connected: false });
    }
  } catch (error) {
    console.error('Check Connection Error:', error);
    // Fallback to memory
    res.json({ connected: !!memoryRefreshToken });
  }
};

// 4. Disconnect Google account
export const disconnectAccount = async (req: Request, res: Response) => {
  try {
    memoryRefreshToken = null; // always clear memory
    if (isDatabaseConnected()) {
      await GoogleAccount.deleteOne({ userId: 'test-user-1' });
    }
    res.json({ success: true, message: 'Account disconnected successfully' });
  } catch (error) {
    console.error('Disconnect Error:', error);
    res.status(500).json({ success: false, error: 'Failed to disconnect account' });
  }
};