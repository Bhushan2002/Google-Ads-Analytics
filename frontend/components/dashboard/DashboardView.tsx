"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import OverviewCards from "./OverviewCards";
import ClicksChart from "./ClicksChart";
import ImpressionsChart from "./ImpressionsChart";
import CampaignTable from "./CampaignTable";
import AssetGroupTable from "./AssetGroupTable";
import KeywordsTable from "./KeywordsTable";
import AdsTable from "./AdsTable";

const API_BASE = "http://localhost:9000/api";

interface OverviewData {
  totals: {
    clicks: number;
    impressions: number;
    conversions: number;
    cost: number;
  };
  daily: {
    date: string;
    clicks: number;
    impressions: number;
    conversions: number;
    cost: number;
  }[];
}

interface OverviewData {
  totals: {
    clicks: number;
    impressions: number;
    conversions: number;
    cost: number;
  };
  daily: {
    date: string;
    clicks: number;
    impressions: number;
    conversions: number;
    cost: number;
  }[];
}

interface Account {
  id: string;
  descriptiveName: string;
  isTestAccount?: boolean;
  loginCustomerId: string;
}

interface DashboardViewProps {
  isConnected?: boolean;
}

export default function DashboardView({
  isConnected = true,
}: DashboardViewProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [adGroups, setAdGroups] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAdGroupId, setSelectedAdGroupId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);

  // Auto-fetch accounts when connected
  useEffect(() => {
    if (isConnected) {
      fetchAccounts();
    }
  }, [isConnected]);

  // Auto-fetch data when account is selected
  useEffect(() => {
    if (isConnected && selectedAccount && accounts.length > 0) {
      fetchData(selectedAccount);
    }
  }, [isConnected, selectedAccount, accounts]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/ads/accounts`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorType(data.errorType || null);
        throw new Error(
          data.message || data.error || "Failed to fetch accounts",
        );
      }

      setAccounts(data.data || []);

      // Auto-select the first account
      if (data.data && data.data.length > 0) {
        setSelectedAccount(data.data[0].id);
      }
    } catch (err: any) {
      console.error("Fetch accounts error:", err);
      setError(err.message || "Failed to load accounts");
    }
  };

  const fetchData = async (id: string) => {
    setLoading(true);
    setError(null);
    setErrorType(null);

    const account = accounts.find((a) => a.id === id);
    const loginCustomerId = account ? account?.loginCustomerId || id : id;

    const overviewUrl = `${API_BASE}/ads/overview/${id}?loginCustomerId=${loginCustomerId}`;
    const campaignsUrl = `${API_BASE}/ads/campaigns/${id}?loginCustomerId=${loginCustomerId}`;
    const keywordsUrl = `${API_BASE}/ads/keywords/${id}?loginCustomerId=${loginCustomerId}`;
    const adsUrl = `${API_BASE}/ads/ads/${id}?loginCustomerId=${loginCustomerId}`;
    const adGroupsUrl = `${API_BASE}/ads/ad-groups/${id}?loginCustomerId=${loginCustomerId}`;
    const assetsUrl = `${API_BASE}/ads/assets/${id}?loginCustomerId=${loginCustomerId}`;

    try {
      const [overviewRes, campaignsRes, keywordsRes, adsRes, adGroupsRes, assetsRes] =
        await Promise.all([
          fetch(overviewUrl),
          fetch(campaignsUrl),
          fetch(keywordsUrl),
          fetch(adsUrl),
          fetch(adGroupsUrl),
          fetch(assetsUrl),
        ]);

      const overviewJson = await overviewRes.json();
      const campaignsJson = await campaignsRes.json();
      const keywordsJson = await keywordsRes.json();
      const adsJson = await adsRes.json();
      const adGroupsJson = await adGroupsRes.json();
      const assetsJson = await assetsRes.json();

      if (!overviewRes.ok || !overviewJson.success) {
        setErrorType(overviewJson.errorType || null);
        throw new Error(
          overviewJson.message ||
            overviewJson.error ||
            "Failed to fetch overview",
        );
      }
      if (!campaignsRes.ok || !campaignsJson.success) {
        setErrorType(campaignsJson.errorType || null);
        throw new Error(
          campaignsJson.message ||
            campaignsJson.error ||
            "Failed to fetch campaigns",
        );
      }

      setOverview(overviewJson.data);
      setCampaigns(campaignsJson.data || []);
      setKeywords(keywordsJson.data || []);
      setAds(adsJson.data || []);
      setAdGroups(adGroupsJson.data || []);
      setAssets(assetsJson.data || []);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/google/url`);
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      toast.error(
        "Failed to reach backend. Is the server running on port 9000?",
      );
    }
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/google/disconnect`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Account disconnected");
        setTimeout(() => {
          window.location.href = "/";
        }, 800);
      } else {
        toast.error("Failed to disconnect account");
      }
    } catch (err) {
      toast.error(
        "Failed to reach backend. Is the server running on port 9000?",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/70">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Google Ads Analytics
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Campaign performance overview
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isConnected && accounts.length > 1 && (
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                disabled={loading}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.descriptiveName}
                  </option>
                ))}
              </select>
            )}
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors duration-150"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnect}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-150 whitespace-nowrap"
              >
                Connect Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {!isConnected ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 max-w-md mx-auto mt-10 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Connect Google Ads
            </h2>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              Connect your Google Ads account to view your campaign performance,
              track metrics, and analyze your advertising data.
            </p>
            <button
              onClick={handleConnect}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2.5 text-sm font-medium rounded-lg w-full transition-colors"
            >
              Connect Google Account
            </button>
          </div>
        ) : (
          <>
            {/* Error state */}
            {error && !loading && (
              <div
                className={`rounded-xl border p-6 text-center shadow-sm ${
                  errorType === "DEVELOPER_TOKEN_RESTRICTED" ||
                  errorType === "MANAGER_ACCOUNT" ||
                  errorType === "NO_CLIENT_ACCOUNTS"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                {errorType === "DEVELOPER_TOKEN_RESTRICTED" ? (
                  <>
                    <div className="text-4xl mb-3">🔒</div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                      Test Accounts Only
                    </h3>
                    <p className="text-yellow-700 text-sm font-medium mb-3">
                      {error}
                    </p>
                    <div className="bg-yellow-100 rounded-lg p-4 text-left text-sm text-yellow-800 space-y-2 max-w-2xl mx-auto">
                      <p className="font-semibold">
                        To access your data, you need to:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>
                          Use a <strong>Google Ads Test Account</strong>{" "}
                          (Manager account with test access)
                        </li>
                        <li>
                          OR apply for <strong>Basic/Standard access</strong>{" "}
                          for your developer token at:
                          <a
                            href="https://ads.google.com/aw/apicenter"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline ml-1"
                          >
                            Google Ads API Center
                          </a>
                        </li>
                      </ol>
                      <p className="text-xs text-yellow-600 mt-3 pt-2 border-t border-yellow-300">
                        💡 <strong>Note:</strong> During development, it's
                        recommended to use a test account to avoid this
                        restriction.
                      </p>
                    </div>
                  </>
                ) : errorType === "MANAGER_ACCOUNT" ? (
                  <>
                    <div className="text-4xl mb-3">🏢</div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                      Manager Account Selected
                    </h3>
                    <p className="text-yellow-700 text-sm font-medium mb-3">
                      {error}
                    </p>
                    <div className="bg-yellow-100 rounded-lg p-4 text-left text-sm text-yellow-800 space-y-2 max-w-2xl mx-auto">
                      <p className="font-semibold">
                        What are Manager Accounts?
                      </p>
                      <p>
                        Manager accounts (also called MCC accounts) are used to
                        manage multiple client accounts. They don't have
                        campaigns or metrics themselves.
                      </p>
                      <p className="font-semibold mt-2">To view your data:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>
                          If you have <strong>client accounts</strong> under
                          this manager, they should appear in the dropdown
                        </li>
                        <li>
                          If not, create a <strong>client account</strong> under
                          your manager account in Google Ads
                        </li>
                      </ul>
                    </div>
                  </>
                ) : errorType === "NO_CLIENT_ACCOUNTS" ? (
                  <>
                    <div className="text-4xl mb-3">📋</div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                      No Client Accounts Found
                    </h3>
                    <p className="text-yellow-700 text-sm font-medium mb-3">
                      {error}
                    </p>
                    <div className="bg-yellow-100 rounded-lg p-4 text-left text-sm text-yellow-800 space-y-2 max-w-2xl mx-auto">
                      <p className="font-semibold">What to do:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>
                          Go to{" "}
                          <a
                            href="https://ads.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Google Ads
                          </a>
                        </li>
                        <li>
                          Create a <strong>client account</strong> under your
                          manager account
                        </li>
                        <li>
                          Make sure the account is{" "}
                          <strong>enabled/active</strong>
                        </li>
                        <li>Reconnect and try again</li>
                      </ol>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                    <p className="text-red-400 text-xs mt-1">
                      Please check your account connection or try again.
                    </p>
                    <button
                      onClick={() =>
                        selectedAccount && fetchData(selectedAccount)
                      }
                      className="mt-3 px-4 py-1.5 text-xs font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Retry
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl border border-gray-200 p-5 h-40 animate-pulse"
                    >
                      <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
                      <div className="h-8 bg-gray-200 rounded w-24 mb-4" />
                      <div className="h-12 bg-gray-100 rounded" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 h-80 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-32 mb-3" />
                    <div className="h-8 bg-gray-200 rounded w-24 mb-4" />
                    <div className="h-56 bg-gray-100 rounded" />
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6 h-80 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-32 mb-3" />
                    <div className="h-8 bg-gray-200 rounded w-24 mb-4" />
                    <div className="h-56 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            )}

            {/* Empty/loading state for accounts */}
            {!loading && !error && !overview && accounts.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
                <div className="text-5xl mb-4">📊</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Fetching your accounts...
                </h2>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  Please wait while we retrieve your Google Ads accounts.
                </p>
              </div>
            )}

            {/* Data loaded */}
            {!loading && overview && (
              <>
                <h2 className="text-lg font-semibold text-gray-800">
                  Overview
                </h2>

                <CampaignTable campaigns={campaigns} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <KeywordsTable keywords={keywords} />
                  <AdsTable
                    ads={
                      selectedAdGroupId
                        ? ads.filter(
                            (a) => String(a.adGroupId) === selectedAdGroupId,
                          )
                        : ads
                    }
                    adGroups={adGroups}
                    selectedAdGroupId={selectedAdGroupId}
                    onAdGroupChange={setSelectedAdGroupId}
                  />

                  {/* <OverviewCards
                    totals={overview.totals}
                    daily={overview.daily}
                  /> */}
                </div>
                <AssetGroupTable assets={assets} />
                <div className="grid grid-cols-2 gap-4  ">
                  <ClicksChart daily={overview.daily} />
                  <ImpressionsChart daily={overview.daily} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
