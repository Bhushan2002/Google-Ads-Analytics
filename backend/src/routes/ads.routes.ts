import { Router } from 'express';
import { getAuthUrl, handleGoogleCallback, checkConnection, disconnectAccount } from '../controller/auth.controller';
import { getCampaignAnalytics, getCampaignOverview, getAccessibleAccounts } from '../controller/ads.controller';


const router = Router();

// OAuth Routes
router.get('/auth/google/url', getAuthUrl);
router.get('/auth/google/callback', handleGoogleCallback);
router.get('/google/callback', handleGoogleCallback);
router.get('/auth/google/status', checkConnection);
router.post('/auth/google/disconnect', disconnectAccount);

// Google Ads Routes
router.get('/ads/accounts', getAccessibleAccounts);
router.get('/ads/campaigns', getCampaignAnalytics);
router.get('/ads/overview', getCampaignOverview);
router.get('/ads/campaigns/:customerId', getCampaignAnalytics);
router.get('/ads/overview/:customerId', getCampaignOverview);

export default router;