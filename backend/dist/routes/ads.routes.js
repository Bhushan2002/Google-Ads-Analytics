"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controller/auth.controller");
const ads_controller_1 = require("../controller/ads.controller");
const router = (0, express_1.Router)();
// OAuth Routes
router.get('/auth/google/url', auth_controller_1.getAuthUrl);
router.get('/auth/google/callback', auth_controller_1.handleGoogleCallback);
router.get('/google/callback', auth_controller_1.handleGoogleCallback);
router.get('/auth/google/status', auth_controller_1.checkConnection);
router.post('/auth/google/disconnect', auth_controller_1.disconnectAccount);
// Google Ads Routes
router.get('/ads/accounts', ads_controller_1.getAccessibleAccounts);
router.get('/ads/campaigns', ads_controller_1.getCampaignAnalytics);
router.get('/ads/overview', ads_controller_1.getCampaignOverview);
router.get('/ads/campaigns/:customerId', ads_controller_1.getCampaignAnalytics);
router.get('/ads/overview/:customerId', ads_controller_1.getCampaignOverview);
exports.default = router;
