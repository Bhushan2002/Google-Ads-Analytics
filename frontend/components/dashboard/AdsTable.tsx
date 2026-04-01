'use client';

import React from 'react';
import { Pencil } from 'lucide-react';

interface AdMetrics {
  clicks?: string | number;
  impressions?: string | number;
  cost_micros?: string | number;
  ctr?: string | number;
  average_cpc?: string | number;
  conversions?: string | number;
}

interface Ad {
  adGroupAd?: {
    ad?: {
      name?: string;
      id?: string | number;
      type?: string;
      finalUrls?: string[];
      responsiveSearchAd?: {
        headlines?: { text?: string }[];
        descriptions?: { text?: string }[];
      };
    };
    status?: string | number;
  };
  ad_group_ad?: {
    ad?: {
      name?: string;
      id?: string | number;
      type?: string;
      final_urls?: string[];
      responsive_search_ad?: {
        headlines?: { text?: string }[];
        descriptions?: { text?: string }[];
      };
    };
    status?: string | number;
  };
  metrics?: AdMetrics;
  adGroup?: {
    resourceName?: string;
    id?: string | number;
    name?: string;
  };
  ad_group?: {
    resourceName?: string;
    id?: string | number;
    name?: string;
  };
  adGroupId?: string | number;
}

interface AdGroup {
  adGroup?: {
    id?: string | number;
    name?: string;
  };
  ad_group?: {
    id?: string | number;
    name?: string;
  };
}

interface AdsTableProps {
  ads: Ad[];
  adGroups: AdGroup[];
  selectedAdGroupId: string;
  onAdGroupChange: (id: string) => void;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(num >= 10_000 ? 0 : 1) + 'k';
  if (num === 0) return '0';
  return num.toLocaleString();
}

function formatCurrency(micros: number): string {
  if (!micros || micros === 0) return '₹0.00';
  return `₹${Math.round(micros / 1_000_000).toFixed(2)}`;
}

function formatPercentage(num: number): string {
  if (!num || num === 0) return '—';
  return `${(num * 100).toFixed(2)}%`;
}

function formatType(typeRaw: any): string {
  if (typeRaw === null || typeRaw === undefined) return 'Responsive search ad';
  const typeStr = String(typeRaw);
  return typeStr.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function getStatusLabel(status: string | number | undefined): { label: string; color: string } {
  if (!status) return { label: 'Unknown', color: 'bg-gray-50 text-gray-500' };
  const statusMap: Record<string, { label: string; color: string }> = {
    'ENABLED': { label: 'Active', color: 'bg-emerald-50 text-emerald-600' },
    'PAUSED': { label: 'Paused', color: 'bg-amber-50 text-amber-600' },
    'REMOVED': { label: 'Removed', color: 'bg-red-50 text-red-500' },
    '2': { label: 'Active', color: 'bg-emerald-50 text-emerald-600' },
    '3': { label: 'Paused', color: 'bg-amber-50 text-amber-600' },
    '4': { label: 'Removed', color: 'bg-red-50 text-red-500' },
  };
  const key = String(status).toUpperCase();
  return statusMap[key] || { label: key, color: 'bg-gray-50 text-gray-500' };
}

export default function AdsTable({ ads, adGroups, selectedAdGroupId, onAdGroupChange }: AdsTableProps) {
  const safeAds = ads || [];
  
  // Totals calculation
  const totals = {
    clicks: 0,
    impressions: 0,
    cost_micros: 0,
    conversions: 0,
  };

  safeAds.forEach(a => {
    totals.clicks += Number(a.metrics?.clicks || 0);
    totals.impressions += Number(a.metrics?.impressions || 0);
    totals.cost_micros += Number(a.metrics?.cost_micros || 0);
    totals.conversions += Number(a.metrics?.conversions || 0);
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-[500px]">
      <div className="p-6 pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Ads</h3>
          <p className="text-xs text-gray-400 mt-1">Details by ad group</p>
        </div>
        
        {adGroups && adGroups.length > 0 && (
          <select
            value={selectedAdGroupId || ''}
            onChange={(e) => onAdGroupChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Ad Groups</option>
            {adGroups.map((ag: any, i: number) => {
              const group = ag.ad_group || ag.adGroup || ag;
              const id = group?.id;
              const name = group?.name || `Ad Group ${id}`;
              if (!id) return null;
              return (
                <option key={id} value={String(id)}>
                  {name}
                </option>
              );
            })}
          </select>
        )}
      </div>

      {!safeAds || safeAds.length === 0 ? (
        <div className="p-8 text-center flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">No ads data available</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 sticky top-0 z-10 shadow-sm">
               
                <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider min-w-[280px]">Ad</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Ad group</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Ad type</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Clicks</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Impr.</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">CTR</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Avg CPC</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Cost</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Conv. rate</th>
              </tr>
            </thead>
            <tbody>
              {safeAds.map((a, i) => {
                const adGroupAd = a.ad_group_ad || a.adGroupAd;
                const group = a.ad_group || a.adGroup;
                
                // Construct Ad Title from Headlines
                const adData = adGroupAd?.ad;
                const responsiveAd = adData?.responsive_search_ad || adData?.responsiveSearchAd;
                const headlines = responsiveAd?.headlines?.map(h => h.text).filter(Boolean) || [];
                const descriptions = responsiveAd?.descriptions?.map(d => d.text).filter(Boolean) || [];
                const finalUrls = adData?.final_urls || adData?.finalUrls || [];
                
                let adName = adData?.name;
                if (!adName) {
                  if (headlines.length > 0) adName = headlines[0];
                  else adName = 'Untitled Ad';
                }
                
                const extraHeadlinesCount = headlines.length > 1 ? headlines.length - 1 : 0;
                
                const typeInfo = formatType(adData?.type);
                const statusStr = String(adGroupAd?.status || 'UNKNOWN');
                const isEnabled = statusStr.toUpperCase() === 'ENABLED' || statusStr === '2';
                const statusObj = getStatusLabel(adGroupAd?.status);

                const clicks = Number(a.metrics?.clicks || 0);
                const impressions = Number(a.metrics?.impressions || 0);
                const cost = Number(a.metrics?.cost_micros || 0);
                const ctr = Number(a.metrics?.ctr || 0);
                const avgCpc = Number(a.metrics?.average_cpc || 0);
                const conversions = Number(a.metrics?.conversions || 0);
                const cRate = clicks > 0 ? conversions / clicks : 0;

                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="py-4 px-2 align-top max-w-[320px] whitespace-normal">
                      <div className="flex items-start gap-2 group">
                        <div className="flex-1 pt-0.5">
                          <span className="text-blue-700 hover:underline text-[13px] leading-snug block mb-0.5 cursor-pointer">
                            {adName} {extraHeadlinesCount > 0 && <span className="text-gray-500 no-underline whitespace-nowrap">+{extraHeadlinesCount} more</span>}
                          </span>
                          {finalUrls.length > 0 && (
                            <div className="text-green-700 text-xs mb-0.5 truncate">{finalUrls[0].replace(/^https?:\/\//, '').split('/')[0]}</div>
                          )}
                          {descriptions.length > 0 && (
                            <div className="text-gray-500 text-xs leading-relaxed mb-1 line-clamp-2">
                              {descriptions[0]}
                            </div>
                          )}
                          
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top pt-5">
                       <span className="text-gray-800">
                        {group?.name || 'Unknown Ad Group'}
                      </span>
                    </td>

                    <td className="py-4 px-4 align-top pt-4">
                      <div className="flex flex-col text-gray-700 text-xs">
                        <span className={`px-2 py-1 rounded-full text-[11px] font-medium w-fit ${statusObj.color}`}>
                          {statusObj.label}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top pt-5 text-gray-700">
                      {typeInfo}
                    </td>

                    <td className="py-4 px-4 text-right align-top pt-5 text-gray-700">{formatNumber(clicks)}</td>
                    <td className="py-4 px-4 text-right align-top pt-5 text-gray-700">{formatNumber(impressions)}</td>
                    <td className="py-4 px-4 text-right align-top pt-5 text-gray-700">{formatPercentage(ctr)}</td>
                    <td className="py-4 px-4 text-right align-top pt-5 text-gray-700">{formatPercentage(avgCpc) === '—' ? '—' : `₹${(avgCpc/1_000_000).toFixed(2)}`}</td>
                    <td className="py-4 px-4 text-right align-top pt-5 text-gray-700">{formatCurrency(cost)}</td>
                    <td className="py-4 px-4 text-right align-top pt-5 text-gray-700">{formatPercentage(cRate)}</td>
                  </tr>
                );
              })}
              
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
