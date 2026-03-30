import { Request, Response } from "express";
import { GoogleAdsApi } from "google-ads-api";
import { getStoredRefreshToken } from "./auth.controller";
import { handleGoogleAdsError } from "../helper/handleErrors";

// Helper: Get Google Ads API client
const getClient = () => {
  return new GoogleAdsApi({
    client_id: process.env.CLIENT_ID!,
    client_secret: process.env.CLIENT_SECRET!,
    developer_token: process.env.GOOGLE_DEVELOPER_TOKEN!,
  });
};

// Helper: Get refresh token
const getRefreshToken = (): Promise<string | null> => getStoredRefreshToken();

// Helper: Get all accessible customer IDs with details
const getAllAccessibleCustomers = async (refreshToken: string) => {
  const client = getClient();

  // gett the root account the user directly authenticated with
  const response = await client.listAccessibleCustomers(refreshToken);
  const rootCustomerIds = response.resource_names;

  if (!rootCustomerIds || rootCustomerIds.length === 0) {
    return [];
  }

  const accessibleAccounts: any[] = [];

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
        const c = (row as any).customer_client;

        // we only want to display enabled client account to the user

        // if (!c.manager && c.status === "ENABLED") {
          if (!c.manager ) {
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
    } catch (error: any) {
      console.error(
        `Error fetching hierarchy for root account ${rootResourceName}:`,
        error?.message || error,
      );

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
export const getAccessibleAccounts = async (req: Request, res: Response) => {
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
        message:
          "Only manager accounts or inactive accounts were found. Please use an active client account.",
      });
      return;
    }

    res.json({ success: true, data: customers });
  } catch (error: any) {
    console.error("Google Ads Accounts Error:", error);
    res
      .status(500)
      .json({ error: `Failed to fetch accounts: ${error?.message}` });
  }
};

// GET /api/ads/campaigns/:customerId
// Returns per-campaign metrics for the last 30 days
export const getCampaignAnalytics = async (req: Request, res: Response) => {
  try {
    const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
    const loginCustomerId = Array.isArray(req.query.loginCustomerId) ? (req.query.loginCustomerId as string[])[0] : (req.query.loginCustomerId as string); // Extracted from URL query
    
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
  } catch (error: any) {
    handleGoogleAdsError(error, res);
  }
};
// GET /api/ads/overview/:customerId
// Returns aggregated totals + daily time-series for charts
export const getCampaignOverview = async (req: Request, res: Response) => {
  try {
    const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
    const loginCustomerId = Array.isArray(req.query.loginCustomerId) ? (req.query.loginCustomerId as string[])[0] : (req.query.loginCustomerId as string); // Extracted from URL query
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

    let totalClicks = 0,
      totalImpressions = 0,
      totalConversions = 0,
      totalCostMicros = 0;

    if (totals && totals.length > 0) {
      for (const row of totals) {
        totalClicks += Number((row as any).metrics?.clicks || 0);
        totalImpressions += Number((row as any).metrics?.impressions || 0);
        totalConversions += Number((row as any).metrics?.conversions || 0);
        totalCostMicros += Number((row as any).metrics?.cost_micros || 0);
      }
    }

    const dailyData = (daily || []).map((row: any) => ({
      date: row.segments?.date || "",
      clicks: Number(row.metrics?.clicks || 0),
      impressions: Number(row.metrics?.impressions || 0),
      conversions: Number(row.metrics?.conversions || 0),
      cost: Number(row.metrics?.cost_micros || 0) / 1_000_000,
    }));

    res.json({
      success: true,
      data: {
        totals: {
          clicks: totalClicks,
          impressions: totalImpressions,
          conversions: totalConversions,
          cost: totalCostMicros / 1_000_000,
        },
        daily: dailyData,
      },
    });
  } catch (error: any) {
    handleGoogleAdsError(error, res);
  }
};

// GET /api/ads/ad-groups/:customerId
// Returns all ad groups for the account
export const getAdGroups = async (req: Request, res: Response) => {
  try {
    const customerId = Array.isArray(req.params.customerId)
      ? req.params.customerId[0]
      : req.params.customerId;
    const loginCustomerId = Array.isArray(req.query.loginCustomerId)
      ? (req.query.loginCustomerId as string[])[0]
      : (req.query.loginCustomerId as string);

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

    const formattedAdGroups = adGroups.map((row: any) => ({
      id: row.ad_group?.id,
      name: row.ad_group?.name,
      status: row.ad_group?.status,
      campaignId: row.campaign?.id,
      campaignName: row.campaign?.name,
    }));

    res.json({ success: true, data: formattedAdGroups });
  } catch (error: any) {
    handleGoogleAdsError(error, res);
  }
};

// GET /api/ads/keywords/:customerId
// Returns keywords with metrics
export const getKeywords = async (req: Request, res: Response) => {
  try {
    const customerId = Array.isArray(req.params.customerId)
      ? req.params.customerId[0]
      : req.params.customerId;
    const loginCustomerId = Array.isArray(req.query.loginCustomerId)
      ? (req.query.loginCustomerId as string[])[0]
      : (req.query.loginCustomerId as string);
    const adGroupId = req.query.adGroupId as string | undefined;

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

    const formattedKeywords = keywords.map((row: any) => ({
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
        cost: Number(row.metrics?.cost_micros || 0) / 1_000_000,
      },
    }));

    res.json({ success: true, data: formattedKeywords });
  } catch (error: any) {
    handleGoogleAdsError(error, res);
  }
};

// GET /api/ads/ads/:customerId
// Returns ads with metrics
export const getAds = async (req: Request, res: Response) => {
  try {
    const customerId = Array.isArray(req.params.customerId)
      ? req.params.customerId[0]
      : req.params.customerId;
    const loginCustomerId = Array.isArray(req.query.loginCustomerId)
      ? (req.query.loginCustomerId as string[])[0]
      : (req.query.loginCustomerId as string);
    const adGroupId = req.query.adGroupId as string | undefined;

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

    const formattedAds = ads.map((row: any) => {
      const ad = row.ad_group_ad?.ad;
      const headlines = ad?.responsive_search_ad?.headlines || [];
      const descriptions = ad?.responsive_search_ad?.descriptions || [];

      return {
        id: ad?.id,
        name: ad?.name,
        type: ad?.type,
        finalUrls: ad?.final_urls || [],
        headlines: headlines.map((h: any) => h.text),
        descriptions: descriptions.map((d: any) => d.text),
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
          cost: Number(row.metrics?.cost_micros || 0) / 1_000_000,
        },
      };
    });

    res.json({ success: true, data: formattedAds });
  } catch (error: any) {
    handleGoogleAdsError(error, res);
  }
};

// GET /api/ads/assets/:customerId
// Returns asset group assets with performance metrics (last 30 days)
export const getAssetGroupAssets = async (req: Request, res: Response) => {
  try {
    const customerId = Array.isArray(req.params.customerId)
      ? req.params.customerId[0]
      : req.params.customerId;
    const loginCustomerId = Array.isArray(req.query.loginCustomerId)
      ? (req.query.loginCustomerId as string[])[0]
      : (req.query.loginCustomerId as string);

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

    const formattedAssets = assets.map((row: any) => ({
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
        cost: Number(row.metrics?.cost_micros || 0) / 1_000_000,
      },
    }));

    res.json({ success: true, data: formattedAssets });
  } catch (error: any) {
    handleGoogleAdsError(error, res);
  }
};
