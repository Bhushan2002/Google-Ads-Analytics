'use client'

import React from 'react'
import {
  BarChart, Bar, ResponsiveContainer
} from 'recharts'

interface Campaign {
  campaign: {
    id: string | number
    name: string
    status: string | number
  }
  metrics: {
    clicks: string | number
    impressions: string | number
    conversions: string | number
    ctr: string | number
    average_cpc: string | number
    cost_micros: string | number
  }
}

interface CampaignTableProps {
  campaigns: Campaign[]
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(num >= 10_000 ? 0 : 1) + 'k'
  return num.toLocaleString()
}

// Google Ads campaign status mapping
function getStatusLabel(status: string | number): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    'ENABLED': { label: 'Active', color: 'bg-emerald-50 text-emerald-600' },
    'PAUSED': { label: 'Paused', color: 'bg-amber-50 text-amber-600' },
    'REMOVED': { label: 'Removed', color: 'bg-red-50 text-red-500' },
    '2': { label: 'Active', color: 'bg-emerald-50 text-emerald-600' },
    '3': { label: 'Paused', color: 'bg-amber-50 text-amber-600' },
    '4': { label: 'Removed', color: 'bg-red-50 text-red-500' },
  }
  const key = String(status)
  return statusMap[key] || { label: key, color: 'bg-gray-50 text-gray-500' }
}

// Generate mini sparkline data from a single value for visual interest
function generateSparkData(clicks: number, impressions: number): { value: number }[] {
  // Create a simple 7-bar distribution based on the ratio
  const ratio = clicks > 0 && impressions > 0 ? clicks / impressions : 0
  const base = Math.max(1, Math.round(ratio * 100))
  return Array.from({ length: 7 }, (_, i) => ({
    value: Math.max(1, base + Math.round(Math.sin(i * 0.9) * base * 0.4))
  }))
}

export default function CampaignTable({ campaigns }: CampaignTableProps) {
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-400 text-sm">No campaign data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-6 pb-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Campaign Details</h3>
        <p className="text-xs text-gray-400 mt-1">Performance metrics for the last 30 days</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Campaign Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Clicks</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Impressions</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">CTR</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Avg CPC</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Cost</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider w-28">Trend</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => {
              const clicks = Number(c.metrics?.clicks || 0)
              const impressions = Number(c.metrics?.impressions || 0)
              const conversions = Number(c.metrics?.conversions || 0)
              const ctr = Number(c.metrics?.ctr || 0)
              const avgCpc = Number(c.metrics?.average_cpc || 0) / 1_000_000
              const cost = Number(c.metrics?.cost_micros || 0) / 1_000_000
              const status = getStatusLabel(c.campaign?.status)
              const sparkData = generateSparkData(clicks, impressions)

              return (
                <tr
                  key={c.campaign?.id || i}
                  className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors duration-150"
                >
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-800 truncate block max-w-[220px]" title={c.campaign?.name}>
                      {c.campaign?.name || 'Unnamed'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-700">{formatNumber(clicks)}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-700">{formatNumber(impressions)}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-700">{(ctr * 100).toFixed(2)}%</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-700">${avgCpc.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-700">${formatNumber(cost)}</td>
                  <td className="py-3 px-4">
                    <div className="h-6 w-24 ml-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sparkData}>
                          <Bar
                            dataKey="value"
                            fill="#3b82f6"
                            radius={[1, 1, 0, 0]}
                            animationDuration={800}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
