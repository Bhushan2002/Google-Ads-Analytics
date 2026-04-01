'use client';

import React from 'react';

interface KeywordMetrics {
  clicks?: string | number;
  impressions?: string | number;
  ctr?: string | number;
  average_cpc?: string | number;
  cost_micros?: string | number;
}

interface Keyword {
  adGroupCriterion?: {
    keyword?: {
      text?: string;
      matchType?: string;
    };
    status?: string | number;
  };
  ad_group_criterion?: {
    keyword?: {
      text?: string;
      match_type?: string;
    };
    status?: string | number;
  };
  metrics?: KeywordMetrics;
}

interface KeywordsTableProps {
  keywords: Keyword[];
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(num >= 10_000 ? 0 : 1) + 'k';  
  return num.toLocaleString();
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

export default function KeywordsTable({ keywords }: KeywordsTableProps) {
  const safeKeywords = keywords || [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-[500px]">
      <div className="p-6 pb-4 border-b border-gray-100 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">Keywords</h3>
        <p className="text-xs text-gray-400 mt-1">Top keywords by metrics for the selected account</p>
      </div>

      {safeKeywords.length === 0 ? (
        <div className="p-8 text-center flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">No keyword data available</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 sticky top-0 z-10 shadow-sm">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Keyword</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Clicks</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Impressions</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Cost</th>
              </tr>
            </thead>
            <tbody>
              {safeKeywords.map((k, i) => {
                const criterion = k.ad_group_criterion || k.adGroupCriterion;
                const text = criterion?.keyword?.text || 'Unknown';
                const clicks = Number(k.metrics?.clicks || 0);
                const impressions = Number(k.metrics?.impressions || 0);
                const cost = Number(k.metrics?.cost_micros || 0) / 1_000_000;
                const status = getStatusLabel(criterion?.status);

                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors duration-150">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-800 truncate block max-w-[200px]" title={text}>
                        {text}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-700">{formatNumber(clicks)}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-700">{formatNumber(impressions)}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-700">₹{formatNumber(cost)}</td>
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
