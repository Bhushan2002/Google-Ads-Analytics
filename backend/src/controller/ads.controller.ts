import { Request, Response } from 'express';
import { GoogleAdsApi } from 'google-ads-api';
import { getStoredRefreshToken } from './auth.controller';

// Helper: Get Google Ads API client
const getClient = () => {
  return new GoogleAdsApi({
    client_id: process.env.CLIENT_ID!,
    client_secret: process.env.CLIENT_SECRET!,
    developer_token: process.env.GOOGLE_DEVELOPER_TOKEN!,
  });
};

// Helper: Get refresh token (DB or memory fallback via auth.controller)
const getRefreshToken = (): Promise<string | null> => getStoredRefreshToken();

// Helper: Get all accessible customer IDs with details
const getAllAccessibleCustomers = async (refreshToken: string): Promise<Array<{ id: string; descriptiveName?: string; isTestAccount?: boolean; isManager?: boolean; status?: string }>> => {
  const client = getClient();

  // List all accessible customer accounts
  const response = await client.listAccessibleCustomers(refreshToken);
  const customerIds = response.resource_names;

  if (!customerIds || customerIds.length === 0) {
    return [];
  }

  // Get details for each customer
  const customers = [];
  for (const resourceName of customerIds) {
    const customerId = resourceName.replace('customers/', '').replace(/-/g, '');
    try {
      const customer = client.Customer({
        customer_id: customerId,
        refresh_token: refreshToken,
      });

      // Query for customer details including manager status and account status
      const details = await customer.query(`
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.test_account,
          customer.manager,
          customer.status
        FROM customer
        LIMIT 1
      `);

      const customerData = details[0] as any;
      const isManager = customerData?.customer?.manager || false;
      const status = customerData?.customer?.status || 'UNKNOWN';
      const isEnabled = status === 'ENABLED';

      // Only include non-manager accounts that are enabled
      if (!isManager && isEnabled) {
        customers.push({
          id: customerId,
          descriptiveName: customerData?.customer?.descriptive_name || `Account ${customerId}`,
          isTestAccount: customerData?.customer?.test_account || false,
          isManager: false,
          status: status,
        });
      } else {
        console.log(`Skipping account ${customerId}: ${isManager ? 'Manager account' : `Status: ${status}`}`);
      }
    } catch (error: any) {
      console.error(`Error fetching details for account ${customerId}:`, error?.message || error);

      // Check if it's a specific known error
      const errorStr = JSON.stringify(error);
      const isDeveloperTokenError = errorStr.includes('DEVELOPER_TOKEN_NOT_APPROVED') ||
                                     errorStr.includes('only approved for use with test accounts');
      const isManagerError = errorStr.includes('REQUESTED_METRICS_FOR_MANAGER');
      const isDisabledError = errorStr.includes('not yet enabled or has been deactivated');

      // Skip this account if it's a manager or disabled
      if (isManagerError || isDisabledError) {
        console.log(`Skipping account ${customerId}: ${isManagerError ? 'Manager account' : 'Disabled/Inactive'}`);
        continue;
      }

      // For other errors (like developer token), still include but mark as restricted
      if (isDeveloperTokenError) {
        customers.push({
          id: customerId,
          descriptiveName: `⚠️ Restricted: ${customerId} (Test accounts only)`,
          isTestAccount: false,
          isManager: false,
          status: 'RESTRICTED',
        });
      }
    }
  }

  return customers;
};

// Helper: Get the first accessible customer ID automatically
const getDefaultCustomerId = async (refreshToken: string): Promise<string | null> => {
  const customers = await getAllAccessibleCustomers(refreshToken);
  return customers.length > 0 ? customers[0].id : null;
};

// Helper: Get an authenticated customer instance (auto-discovers customer ID if not provided)
const getCustomer = async (customerIdOverride?: string) => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const client = getClient();

  let customerId = customerIdOverride;
  if (!customerId) {
    customerId = await getDefaultCustomerId(refreshToken) || undefined;
  }

  if (!customerId) return null;

  return client.Customer({
    customer_id: customerId,
    refresh_token: refreshToken,
  });
};

// GET /api/ads/accounts
// Returns all accessible Google Ads accounts
export const getAccessibleAccounts = async (req: Request, res: Response) => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      res.status(401).json({ error: 'Google Ads account not connected.' });
      return;
    }

    const customers = await getAllAccessibleCustomers(refreshToken);

    if (customers.length === 0) {
      res.status(404).json({
        error: 'No accessible client accounts found.',
        errorType: 'NO_CLIENT_ACCOUNTS',
        message: 'Only manager accounts or inactive accounts were found. Google Ads API requires client accounts (non-manager accounts) to retrieve metrics. Please create or use a client account under your manager account.',
      });
      return;
    }

    res.json({ success: true, data: customers });

  } catch (error: any) {
    console.error('Google Ads Accounts Error:', error);
    res.status(500).json({ error: `Failed to fetch accounts: ${error?.message || JSON.stringify(error)}` });
  }
};

// GET /api/ads/campaigns/:customerId
// Returns per-campaign metrics for the last 30 days
export const getCampaignAnalytics = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const customerIdString = Array.isArray(customerId) ? customerId[0] : customerId;

    const customer = await getCustomer(customerIdString);
    if (!customer) {
      res.status(401).json({ error: 'Google Ads account not connected or no accessible accounts found.' });
      return;
    }

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
    console.error('Google Ads API Error:', error);

    // Check for specific error types
    const errorStr = JSON.stringify(error);
    const isDeveloperTokenError = errorStr.includes('DEVELOPER_TOKEN_NOT_APPROVED') ||
                                   errorStr.includes('only approved for use with test accounts');
    const isManagerError = errorStr.includes('REQUESTED_METRICS_FOR_MANAGER');
    const isDisabledError = errorStr.includes('not yet enabled or has been deactivated');

    if (isManagerError) {
      res.status(400).json({
        error: 'Cannot fetch metrics for manager account',
        errorType: 'MANAGER_ACCOUNT',
        message: 'This is a manager account. Google Ads API requires you to query client accounts (sub-accounts) instead. Please select a client account from the dropdown.',
        details: error?.message || JSON.stringify(error)
      });
      return;
    }

    if (isDisabledError) {
      res.status(400).json({
        error: 'Account is disabled or inactive',
        errorType: 'ACCOUNT_DISABLED',
        message: 'This account is not yet enabled or has been deactivated. Please use an active account.',
        details: error?.message || JSON.stringify(error)
      });
      return;
    }

    if (isDeveloperTokenError) {
      res.status(403).json({
        error: 'Developer token restricted to test accounts only',
        errorType: 'DEVELOPER_TOKEN_RESTRICTED',
        message: 'Your Google Ads developer token is in test mode and can only access test accounts. Please use a test account or apply for Basic/Standard access.',
        details: error?.message || JSON.stringify(error)
      });
      return;
    }

    res.status(500).json({ error: `Failed to fetch campaigns: ${error?.message || JSON.stringify(error)}` });
  }
};

// GET /api/ads/overview/:customerId
// Returns aggregated totals + daily time-series for charts
export const getCampaignOverview = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const customerIdString = Array.isArray(customerId) ? customerId[0] : customerId;

    const customer = await getCustomer(customerIdString);
    if (!customer) {
      res.status(401).json({ error: 'Google Ads account not connected or no accessible accounts found.' });
      return;
    }

    // 1. Aggregated totals for the overview cards
    const totals = await customer.query(`
      SELECT 
        metrics.clicks,
        metrics.impressions,
        metrics.conversions,
        metrics.cost_micros
      FROM customer
      WHERE segments.date DURING LAST_30_DAYS
    `);

    // 2. Daily time-series for charts
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

    // Aggregate totals from the response
    let totalClicks = 0;
    let totalImpressions = 0;
    let totalConversions = 0;
    let totalCostMicros = 0;

    if (totals && totals.length > 0) {
      for (const row of totals) {
        totalClicks += Number((row as any).metrics?.clicks || 0);
        totalImpressions += Number((row as any).metrics?.impressions || 0);
        totalConversions += Number((row as any).metrics?.conversions || 0);
        totalCostMicros += Number((row as any).metrics?.cost_micros || 0);
      }
    }

    // Format daily data for charts
    const dailyData = (daily || []).map((row: any) => ({
      date: row.segments?.date || '',
      clicks: Number(row.metrics?.clicks || 0),
      impressions: Number(row.metrics?.impressions || 0),
      conversions: Number(row.metrics?.conversions || 0),
      cost: Number(row.metrics?.cost_micros || 0) / 1_000_000, // Convert micros to dollars
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
    console.error('Google Ads Overview Error:', error);

    // Check for specific error types
    const errorStr = JSON.stringify(error);
    const isDeveloperTokenError = errorStr.includes('DEVELOPER_TOKEN_NOT_APPROVED') ||
                                   errorStr.includes('only approved for use with test accounts');
    const isManagerError = errorStr.includes('REQUESTED_METRICS_FOR_MANAGER');
    const isDisabledError = errorStr.includes('not yet enabled or has been deactivated');

    if (isManagerError) {
      res.status(400).json({
        error: 'Cannot fetch metrics for manager account',
        errorType: 'MANAGER_ACCOUNT',
        message: 'This is a manager account. Google Ads API requires you to query client accounts (sub-accounts) instead. Please select a client account from the dropdown.',
        details: error?.message || JSON.stringify(error)
      });
      return;
    }

    if (isDisabledError) {
      res.status(400).json({
        error: 'Account is disabled or inactive',
        errorType: 'ACCOUNT_DISABLED',
        message: 'This account is not yet enabled or has been deactivated. Please use an active account.',
        details: error?.message || JSON.stringify(error)
      });
      return;
    }

    if (isDeveloperTokenError) {
      res.status(403).json({
        error: 'Developer token restricted to test accounts only',
        errorType: 'DEVELOPER_TOKEN_RESTRICTED',
        message: 'Your Google Ads developer token is in test mode and can only access test accounts. Please use a test account or apply for Basic/Standard access.',
        details: error?.message || JSON.stringify(error)
      });
      return;
    }

    res.status(500).json({ error: `Failed to fetch overview: ${error?.message || JSON.stringify(error)}` });
  }
};