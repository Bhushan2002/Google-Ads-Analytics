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

// GET /api/ads/keywords/:customerId
// Returns keyword metrics for the last 30 days
export const getKeywordsAnalytics = async (req: Request, res: Response) => {
  try {
    const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
    const loginCustomerId = Array.isArray(req.query.loginCustomerId) ? (req.query.loginCustomerId as string[])[0] : (req.query.loginCustomerId as string);
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

    const keywords = await customer.query(`
      SELECT 
        ad_group_criterion.keyword.text, 
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.status,
        metrics.clicks, 
        metrics.impressions,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_micros
      FROM keyword_view
      WHERE segments.date DURING LAST_30_DAYS
        AND ad_group_criterion.status != 'REMOVED'
      ORDER BY metrics.clicks DESC
      LIMIT 100
    `);

    res.json({ success: true, data: keywords });
  } catch (error: any) {
    handleGoogleAdsError(error, res);
  }
};

// GET /api/ads/ads/:customerId
// Returns ad metrics for the last 30 days
export const getAdsAnalytics = async (req: Request, res: Response) => {
  try {
    const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
    const loginCustomerId = Array.isArray(req.query.loginCustomerId) ? (req.query.loginCustomerId as string[])[0] : (req.query.loginCustomerId as string);
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

    const ads = await customer.query(`
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.status,
        ad_group_ad.ad.type,
        ad_group_ad.ad.final_urls,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group.id,
        ad_group.name,
        metrics.clicks,
        metrics.impressions,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_micros,
        metrics.conversions
      FROM ad_group_ad
      WHERE segments.date DURING LAST_30_DAYS
        AND ad_group_ad.status != 'REMOVED'
      ORDER BY metrics.clicks DESC
      LIMIT 100
    `);

    // Add mapped adGroupId prop for easier filtering on frontend
    const mappedAds = ads.map((ad: any) => ({
      ...ad,
      adGroupId: ad.ad_group?.id || ''
    }));

    res.json({ success: true, data: mappedAds });
  } catch (error: any) {
    handleGoogleAdsError(error, res);
  }
};

// GET /api/ads/ad-groups/:customerId
// Returns ad groups
export const getAdGroupsAnalytics = async (req: Request, res: Response) => {
  try {
    const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
    const loginCustomerId = Array.isArray(req.query.loginCustomerId) ? (req.query.loginCustomerId as string[])[0] : (req.query.loginCustomerId as string);
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
        ad_group.status
      FROM ad_group
      WHERE ad_group.status != 'REMOVED'
      LIMIT 100
    `);

    res.json({ success: true, data: adGroups });
  } catch (error: any) {
    handleGoogleAdsError(error, res);
  }
};
