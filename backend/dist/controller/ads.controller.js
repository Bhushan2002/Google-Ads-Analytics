"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssetGroupAssets = exports.getAds = exports.getKeywords = exports.getAdGroups = exports.getCampaignOverview = exports.getCampaignAnalytics = exports.getAccessibleAccounts = void 0;
const google_ads_api_1 = require("google-ads-api");
const auth_controller_1 = require("./auth.controller");
const handleErrors_1 = require("../helper/handleErrors");
// Helper: Get Google Ads API client
const getClient = () => {
    return new google_ads_api_1.GoogleAdsApi({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        developer_token: process.env.GOOGLE_DEVELOPER_TOKEN,
    });
};
// Helper: Get refresh token
const getRefreshToken = () => (0, auth_controller_1.getStoredRefreshToken)();
// Helper: Get all accessible customer IDs with details
const getAllAccessibleCustomers = async (refreshToken) => {
    const client = getClient();
    // gett the root account the user directly authenticated with
    const response = await client.listAccessibleCustomers(refreshToken);
    const rootCustomerIds = response.resource_names;
    if (!rootCustomerIds || rootCustomerIds.length === 0) {
        return [];
    }
    const accessibleAccounts = [];
    for (const rootResourceName of rootCustomerIds) {
        const rootId = rootResourceName.replace("customers/", "");
        try {
            const customer = client.Customer({
                customer_id: rootId,
                login_customer_id: rootId,
                refresh_token: refreshToken,
            });
            // This signle query fetchs the account and all direct sub-accounts
            const clients = await customer.query(`
        SELECT
          customer_client.client_customer,
          customer_client.descriptive_name,
          customer_client.manager,
          customer_client.test_account,
          customer_client.status
        FROM customer_client
        WHERE customer_client.level <= 1
          `);
            for (const row of clients) {
                const c = row.customer_client;
                // we only want to display enabled client account to the user
                // if (!c.manager && c.status === "ENABLED") {
                if (!c.manager) {
                    const accountId = c.client_customer.replace("customers/", "");
                    // avoid duplicates if multiple root accounts have access to the same client
                    if (!accessibleAccounts.find((a) => a.id === accountId)) {
                        accessibleAccounts.push({
                            id: accountId,
                            descriptiveName: c.descriptive_name || `Account ${accountId}`,
                            isTestAccount: c.test_account || false,
                            isManager: false,
                            status: c.status,
                            loginCustomerId: rootId,
                        });
                    }
                }
            }
        }
        catch (error) {
            console.error(`Error fetching hierarchy for root account ${rootResourceName}:`, error?.message || error);
            const errorStr = JSON.stringify(error);
            if (errorStr.includes("DEVELOPER_TOKEN_NOT_APPROVED")) {
                accessibleAccounts.push({
                    id: rootId,
                    descriptiveName: `⚠️ Restricted Root: ${rootId}`,
                    isTestAccount: false,
                    isManager: true,
                    status: "RESTRICTED",
                    loginCustomerId: rootId,
                });
            }
        }
    }
    return accessibleAccounts;
};
// Helper: Get the first accessible customer ID automatically
// const getDefaultCustomerId = async (refreshToken: string): Promise<string | null> => {
//   const customers = await getAllAccessibleCustomers(refreshToken);
//   return customers.length > 0 ? customers[0].id : null;
// };
// // Helper: Get an authenticated customer instance (auto-discovers customer ID if not provided)
// const getCustomer = async (customerIdOverride?: string) => {
//   const refreshToken = await getRefreshToken();
//   if (!refreshToken) return null;
//   const client = getClient();
//   let customerId = customerIdOverride;
//   if (!customerId) {
//     customerId = await getDefaultCustomerId(refreshToken) || undefined;
//   }
//   if (!customerId) return null;
//   return client.Customer({
//     customer_id: customerId,
//     refresh_token: refreshToken,
//   });
// };
// GET /api/ads/accounts
// Returns all accessible Google Ads accounts
const getAccessibleAccounts = async (req, res) => {
    try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
            res.status(401).json({ error: "Google Ads account not connected." });
            return;
        }
        const customers = await getAllAccessibleCustomers(refreshToken);
        if (customers.length === 0) {
            res.status(404).json({
                error: "No accessible client accounts found.",
                errorType: "NO_CLIENT_ACCOUNTS",
                message: "Only manager accounts or inactive accounts were found. Please use an active client account.",
            });
            return;
        }
        res.json({ success: true, data: customers });
    }
    catch (error) {
        console.error("Google Ads Accounts Error:", error);
        res
            .status(500)
            .json({ error: `Failed to fetch accounts: ${error?.message}` });
    }
};
exports.getAccessibleAccounts = getAccessibleAccounts;
// GET /api/ads/campaigns/:customerId
// Returns per-campaign metrics for the last 30 days
const getCampaignAnalytics = async (req, res) => {
    try {
        const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
        const loginCustomerId = Array.isArray(req.query.loginCustomerId) ? req.query.loginCustomerId[0] : req.query.loginCustomerId; // Extracted from URL query
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
            res.status(401).json({ error: "Not connected" });
            return;
        }
        const client = getClient();
        const customer = client.Customer({
            customer_id: customerId,
            login_customer_id: loginCustomerId || customerId, // Apply the MCC context
            refresh_token: refreshToken,
        });
        const campaigns = await customer.query(`
      SELECT 
        campaign.id, 
        campaign.name, 
        campaign.status,
        metrics.clicks, 
        metrics.impressions,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
      ORDER BY metrics.clicks DESC
    `);
        res.json({ success: true, data: campaigns });
    }
    catch (error) {
        (0, handleErrors_1.handleGoogleAdsError)(error, res);
    }
};
exports.getCampaignAnalytics = getCampaignAnalytics;
// GET /api/ads/overview/:customerId
// Returns aggregated totals + daily time-series for charts
const getCampaignOverview = async (req, res) => {
    try {
        const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
        const loginCustomerId = Array.isArray(req.query.loginCustomerId) ? req.query.loginCustomerId[0] : req.query.loginCustomerId; // Extracted from URL query
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
            res.status(401).json({ error: "Not connected" });
            return;
        }
        const client = getClient();
        const customer = client.Customer({
            customer_id: customerId,
            login_customer_id: loginCustomerId || customerId, // Apply the MCC context
            refresh_token: refreshToken,
        });
        const totals = await customer.query(`
      SELECT 
        metrics.clicks,
        metrics.impressions,
        metrics.conversions,
        metrics.cost_micros
      FROM customer
      WHERE segments.date DURING LAST_30_DAYS
    `);
        const daily = await customer.query(`
      SELECT 
        segments.date,
        metrics.clicks,
        metrics.impressions,
        metrics.conversions,
        metrics.cost_micros
      FROM customer
      WHERE segments.date DURING LAST_30_DAYS
      ORDER BY segments.date ASC
    `);
        let totalClicks = 0, totalImpressions = 0, totalConversions = 0, totalCostMicros = 0;
        if (totals && totals.length > 0) {
            for (const row of totals) {
                totalClicks += Number(row.metrics?.clicks || 0);
                totalImpressions += Number(row.metrics?.impressions || 0);
                totalConversions += Number(row.metrics?.conversions || 0);
                totalCostMicros += Number(row.metrics?.cost_micros || 0);
            }
        }
        const dailyData = (daily || []).map((row) => ({
            date: row.segments?.date || "",
            clicks: Number(row.metrics?.clicks || 0),
            impressions: Number(row.metrics?.impressions || 0),
            conversions: Number(row.metrics?.conversions || 0),
            cost: Number(row.metrics?.cost_micros || 0) / 1000000,
        }));
        res.json({
            success: true,
            data: {
                totals: {
                    clicks: totalClicks,
                    impressions: totalImpressions,
                    conversions: totalConversions,
                    cost: totalCostMicros / 1000000,
                },
                daily: dailyData,
            },
        });
    }
    catch (error) {
        (0, handleErrors_1.handleGoogleAdsError)(error, res);
    }
};
exports.getCampaignOverview = getCampaignOverview;
// GET /api/ads/ad-groups/:customerId
// Returns all ad groups for the account
const getAdGroups = async (req, res) => {
    try {
        const customerId = Array.isArray(req.params.customerId)
            ? req.params.customerId[0]
            : req.params.customerId;
        const loginCustomerId = Array.isArray(req.query.loginCustomerId)
            ? req.query.loginCustomerId[0]
            : req.query.loginCustomerId;
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
            res.status(401).json({ error: "Not connected" });
            return;
        }
        const client = getClient();
        const customer = client.Customer({
            customer_id: customerId,
            login_customer_id: loginCustomerId || customerId,
            refresh_token: refreshToken,
        });
        const adGroups = await customer.query(`
      SELECT
        ad_group.id,
        ad_group.name,
        ad_group.status,
        campaign.id,
        campaign.name
      FROM ad_group
      ORDER BY ad_group.name ASC
    `);
        const formattedAdGroups = adGroups.map((row) => ({
            id: row.ad_group?.id,
            name: row.ad_group?.name,
            status: row.ad_group?.status,
            campaignId: row.campaign?.id,
            campaignName: row.campaign?.name,
        }));
        res.json({ success: true, data: formattedAdGroups });
    }
    catch (error) {
        (0, handleErrors_1.handleGoogleAdsError)(error, res);
    }
};
exports.getAdGroups = getAdGroups;
// GET /api/ads/keywords/:customerId
// Returns keywords with metrics
const getKeywords = async (req, res) => {
    try {
        const customerId = Array.isArray(req.params.customerId)
            ? req.params.customerId[0]
            : req.params.customerId;
        const loginCustomerId = Array.isArray(req.query.loginCustomerId)
            ? req.query.loginCustomerId[0]
            : req.query.loginCustomerId;
        const adGroupId = req.query.adGroupId;
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
            res.status(401).json({ error: "Not connected" });
            return;
        }
        const client = getClient();
        const customer = client.Customer({
            customer_id: customerId,
            login_customer_id: loginCustomerId || customerId,
            refresh_token: refreshToken,
        });
        let whereClause = "WHERE segments.date DURING LAST_30_DAYS";
        if (adGroupId) {
            whereClause += ` AND ad_group.id = ${adGroupId}`;
        }
        const keywords = await customer.query(`
      SELECT
        ad_group_criterion.criterion_id,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.status,
        ad_group_criterion.negative,
        ad_group.id,
        ad_group.name,
        metrics.clicks,
        metrics.impressions,
        metrics.ctr,
        metrics.cost_micros
      FROM keyword_view
      ${whereClause}
      ORDER BY metrics.clicks DESC
    `);
        const formattedKeywords = keywords.map((row) => ({
            id: row.ad_group_criterion?.criterion_id,
            keyword: row.ad_group_criterion?.keyword?.text,
            matchType: row.ad_group_criterion?.keyword?.match_type,
            status: row.ad_group_criterion?.status,
            isNegative: row.ad_group_criterion?.negative || false,
            adGroupId: row.ad_group?.id,
            adGroupName: row.ad_group?.name,
            metrics: {
                clicks: Number(row.metrics?.clicks || 0),
                impressions: Number(row.metrics?.impressions || 0),
                ctr: Number(row.metrics?.ctr || 0),
                cost: Number(row.metrics?.cost_micros || 0) / 1000000,
            },
        }));
        res.json({ success: true, data: formattedKeywords });
    }
    catch (error) {
        (0, handleErrors_1.handleGoogleAdsError)(error, res);
    }
};
exports.getKeywords = getKeywords;
// GET /api/ads/ads/:customerId
// Returns ads with metrics
const getAds = async (req, res) => {
    try {
        const customerId = Array.isArray(req.params.customerId)
            ? req.params.customerId[0]
            : req.params.customerId;
        const loginCustomerId = Array.isArray(req.query.loginCustomerId)
            ? req.query.loginCustomerId[0]
            : req.query.loginCustomerId;
        const adGroupId = req.query.adGroupId;
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
            res.status(401).json({ error: "Not connected" });
            return;
        }
        const client = getClient();
        const customer = client.Customer({
            customer_id: customerId,
            login_customer_id: loginCustomerId || customerId,
            refresh_token: refreshToken,
        });
        let whereClause = "WHERE segments.date DURING LAST_30_DAYS";
        if (adGroupId) {
            whereClause += ` AND ad_group.id = ${adGroupId}`;
        }
        const ads = await customer.query(`
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.ad.type,
        ad_group_ad.ad.final_urls,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.status,
        ad_group.id,
        ad_group.name,
        campaign.id,
        campaign.name,
        metrics.clicks,
        metrics.impressions,
        metrics.ctr,
        metrics.conversions,
        metrics.cost_micros
      FROM ad_group_ad
      ${whereClause}
      ORDER BY metrics.impressions DESC
    `);
        const formattedAds = ads.map((row) => {
            const ad = row.ad_group_ad?.ad;
            const headlines = ad?.responsive_search_ad?.headlines || [];
            const descriptions = ad?.responsive_search_ad?.descriptions || [];
            return {
                id: ad?.id,
                name: ad?.name,
                type: ad?.type,
                finalUrls: ad?.final_urls || [],
                headlines: headlines.map((h) => h.text),
                descriptions: descriptions.map((d) => d.text),
                status: row.ad_group_ad?.status,
                adGroupId: row.ad_group?.id,
                adGroupName: row.ad_group?.name,
                campaignId: row.campaign?.id,
                campaignName: row.campaign?.name,
                metrics: {
                    clicks: Number(row.metrics?.clicks || 0),
                    impressions: Number(row.metrics?.impressions || 0),
                    ctr: Number(row.metrics?.ctr || 0),
                    conversions: Number(row.metrics?.conversions || 0),
                    cost: Number(row.metrics?.cost_micros || 0) / 1000000,
                },
            };
        });
        res.json({ success: true, data: formattedAds });
    }
    catch (error) {
        (0, handleErrors_1.handleGoogleAdsError)(error, res);
    }
};
exports.getAds = getAds;
// GET /api/ads/assets/:customerId
// Returns asset group assets with performance metrics (last 30 days)
const getAssetGroupAssets = async (req, res) => {
    try {
        const customerId = Array.isArray(req.params.customerId)
            ? req.params.customerId[0]
            : req.params.customerId;
        const loginCustomerId = Array.isArray(req.query.loginCustomerId)
            ? req.query.loginCustomerId[0]
            : req.query.loginCustomerId;
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
            res.status(401).json({ error: "Not connected" });
            return;
        }
        const client = getClient();
        const customer = client.Customer({
            customer_id: customerId,
            login_customer_id: loginCustomerId || customerId,
            refresh_token: refreshToken,
        });
        const assets = await customer.query(`
      SELECT
        asset_group.id,
        asset_group.name,
        asset_group.status,
        asset_group_asset.field_type,
        asset_group_asset.status,
        asset_group_asset.performance_label,
        asset.id,
        asset.name,
        asset.type,
        asset.text_asset.text,
        asset.image_asset.full_size.url,
        asset.image_asset.full_size.width_pixels,
        asset.image_asset.full_size.height_pixels,
        asset.last_modified_time,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_micros
      FROM asset_group_asset
      WHERE segments.date DURING LAST_30_DAYS
      ORDER BY metrics.impressions DESC
    `);
        const formattedAssets = assets.map((row) => ({
            id: row.asset?.id,
            name: row.asset?.name,
            type: row.asset?.type,
            fieldType: row.asset_group_asset?.field_type,
            status: row.asset_group_asset?.status,
            performanceLabel: row.asset_group_asset?.performance_label,
            assetGroupId: row.asset_group?.id,
            assetGroupName: row.asset_group?.name,
            assetGroupStatus: row.asset_group?.status,
            text: row.asset?.text_asset?.text,
            imageUrl: row.asset?.image_asset?.full_size?.url,
            imageWidth: row.asset?.image_asset?.full_size?.width_pixels,
            imageHeight: row.asset?.image_asset?.full_size?.height_pixels,
            lastUpdated: row.asset?.last_modified_time,
            metrics: {
                clicks: Number(row.metrics?.clicks || 0),
                impressions: Number(row.metrics?.impressions || 0),
                conversions: Number(row.metrics?.conversions || 0),
                conversionValue: Number(row.metrics?.conversions_value || 0),
                cost: Number(row.metrics?.cost_micros || 0) / 1000000,
            },
        }));
        res.json({ success: true, data: formattedAssets });
    }
    catch (error) {
        (0, handleErrors_1.handleGoogleAdsError)(error, res);
    }
};
exports.getAssetGroupAssets = getAssetGroupAssets;
