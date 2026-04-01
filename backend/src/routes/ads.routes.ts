import { Router } from 'express';
import { getAuthUrl, handleGoogleCallback, checkConnection, disconnectAccount } from '../controller/auth.controller';
import {
    getCampaignAnalytics,
    getCampaignOverview,
    getAccessibleAccounts,
    getKeywordsAnalytics,
    getAdsAnalytics,
    getAdGroupsAnalytics,
    getAssetsAnalytics,

} from '../controller/ads.controller';

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
router.get('/ads/keywords/:customerId', getKeywordsAnalytics);
router.get('/ads/ads/:customerId', getAdsAnalytics);
router.get('/ads/ad-groups/:customerId', getAdGroupsAnalytics);
router.get('/ads/assets/:customerId', getAssetsAnalytics);

export default router;