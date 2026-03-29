import { Response } from "express";

export const handleGoogleAdsError = (error: any, res: Response) => {
  console.error('Google Ads API Error:', error);
  const errorStr = JSON.stringify(error);
  
  if (errorStr.includes('REQUESTED_METRICS_FOR_MANAGER')) {
    return res.status(400).json({
      error: 'Cannot fetch metrics for manager account',
      errorType: 'MANAGER_ACCOUNT',
      message: 'This is a manager account. Please select a client account from the dropdown.'
    });
  }
  if (errorStr.includes('not yet enabled or has been deactivated')) {
    return res.status(400).json({
      error: 'Account is disabled or inactive',
      errorType: 'ACCOUNT_DISABLED',
    });
  }
  if (errorStr.includes('DEVELOPER_TOKEN_NOT_APPROVED') || errorStr.includes('only approved for use with test accounts')) {
    return res.status(403).json({
      error: 'Developer token restricted to test accounts only',
      errorType: 'DEVELOPER_TOKEN_RESTRICTED',
      message: 'Your Google Ads developer token is in test mode and can only access test accounts.'
    });
  }
  
  res.status(500).json({ error: `Failed to fetch data: ${error?.message || 'Unknown error'}` });
};