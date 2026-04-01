'use client';

import React from 'react';
import { Layers } from 'lucide-react';

interface AdGroup {
  ad_group?: {
    resourceName: string;
    id: string;
    name: string;
    status: string;
    type: string;
  };
  campaign?: {
    name: string;
  };
  metrics?: {
    clicks: string | number;
    impressions: string | number;
    cost_micros: string | number;
    conversions: string | number;
  };
}

interface AdGroupTableProps {
  adGroups: AdGroup[];
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(num >= 10_000 ? 0 : 1) + 'k';  
  return num.toLocaleString();
}



export default function AdGroupTable({ adGroups }: AdGroupTableProps) {
  const safeAdGroups = adGroups || [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-[500px] font-sans mt-6">
      <div className="p-6 pb-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-900">Ad Groups</h3>
        </div>
        <p className="text-xs text-gray-400 mt-1">Performance metrics for active ad groups</p>
      </div>

      {safeAdGroups.length === 0 ? (
        <div className="p-8 text-center flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">No ad groups found</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 sticky top-0 z-10 shadow-sm">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Ad Group Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Campaign</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Clicks</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Impressions</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Cost</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Conversions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {safeAdGroups.map((group, index) => {
                const adGroup = group.ad_group;
                const metrics = group.metrics;

                return (
                  <tr key={index} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors duration-150">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-800">{adGroup?.name || 'Unknown'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-500 text-xs font-medium">{group.campaign?.name || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        adGroup?.status === 'ENABLED' ? 'bg-emerald-50 text-emerald-600' :
                        adGroup?.status === 'PAUSED' ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {adGroup?.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-700">
                      {formatNumber(Number(metrics?.clicks || 0))}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-700">
                      {formatNumber(Number(metrics?.impressions || 0))}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-700">
                      ₹{Number(metrics?.cost_micros || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-700 text-indigo-600">
                      {formatNumber(Number(metrics?.conversions || 0))}
                    </td>
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
