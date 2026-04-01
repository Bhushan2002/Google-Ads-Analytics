import React from 'react';
import { Settings, Search, MonitorPlay, LayoutTemplate } from 'lucide-react';

interface CampaignSettingsTableProps {
  campaigns: any[];
}

export default function CampaignSettingsTable({ campaigns }: CampaignSettingsTableProps) {
  
  // Helper to format the nasty Google API enum strings (e.g., "MANUAL_CPC" -> "Manual CPC")
  const formatEnum = (val: any) => {
    if (!val) return '-';
    const str = String(val);
    return str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };


  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center h-full mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Settings & Budgets</h3>
        <p className="text-gray-400 text-sm">No campaigns found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 h-full flex flex-col font-sans mt-6">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Campaigns & Budgets</h3>
        </div>
        <p className="text-xs text-gray-400 mt-1">Detailed configuration for your current campaigns</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60 sticky top-0">
              <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Campaign</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Daily Budget</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Bid Strategy</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Search</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Display</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {campaigns.map((camp, index) => (
              <tr key={index} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors duration-150">
                
                {/* Campaign Name & Type */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
      
                    <span className="font-medium text-gray-800">{camp.campaign.name}</span>
                  </div>
                </td>

                {/* Status */}
                <td className="py-3 px-4 text-gray-600">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    camp.campaign.status === 'ENABLED' ? 'bg-emerald-50 text-emerald-600' :
                    camp.campaign.status === 'PAUSED' ? 'bg-amber-50 text-amber-600' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {formatEnum(camp.campaign.status)}
                  </span>
                </td>

                {/* Budget */}
                <td className="py-3 px-4 font-medium text-gray-800">
                  ₹{camp.budgetAmount} <span className="text-xs text-gray-400 font-normal">/day</span>
                </td>

                {/* Bidding Strategy */}
                <td className="py-3 px-4 text-gray-700 font-medium">
                  {formatEnum(camp.bidStrategy)}
                </td>

                {/* Networks (Booleans from the API) */}
                <td className="py-3 px-4">
                  {camp.campaign.network_settings?.target_google_search ? (
                    <span className="text-emerald-600 font-semibold text-xs px-2 py-0.5 rounded-full bg-emerald-50">ON</span>
                  ) : (
                    <span className="text-gray-300">OFF</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {camp.campaign.network_settings?.target_content_network ? (
                    <span className="text-emerald-600 font-semibold text-xs px-2 py-0.5 rounded-full bg-emerald-50">ON</span>
                  ) : (
                    <span className="text-gray-300">OFF</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
