'use client'

import React from 'react'

interface AdGroup {
  id: string | number
  name: string
  status: string
  campaignId: string | number
  campaignName: string
}

interface Ad {
  id: string | number
  name: string
  type: string
  finalUrls: string[]
  headlines: string[]
  descriptions: string[]
  status: string
  adGroupId: string | number
  adGroupName: string
  campaignId: string | number
  campaignName: string
  metrics: {
    clicks: number
    impressions: number
    ctr: number
    conversions: number
    cost: number
  }
}

interface AdsTableProps {
  ads: Ad[]
  adGroups: AdGroup[]
  selectedAdGroupId: string
  onAdGroupChange: (adGroupId: string) => void
  loading?: boolean
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(num >= 10_000 ? 0 : 1) + 'k'
  return num.toLocaleString()
}

function getStatusLabel(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    'ENABLED': { label: 'Enabled', color: 'bg-emerald-50 text-emerald-600' },
    'PAUSED': { label: 'Paused', color: 'bg-amber-50 text-amber-600' },
    'REMOVED': { label: 'Removed', color: 'bg-red-50 text-red-500' },
  }
  return statusMap[status] || { label: status, color: 'bg-gray-50 text-gray-500' }
}

function AdPreviewCard({ ad }: { ad: Ad }) {
  const headline = ad.headlines[0] || 'Ad Headline'
  const description = ad.descriptions[0] || 'Ad description text'
  const displayUrl = ad.finalUrls[0]
    ? new URL(ad.finalUrls[0]).hostname.replace('www.', '')
    : 'example.com'

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-sm">
      <div className="text-xs text-gray-500 mb-1">Ad</div>
      <a
        href={ad.finalUrls[0] || '#'}
        className="text-blue-600 hover:underline text-base font-medium block mb-1"
        target="_blank"
        rel="noopener noreferrer"
      >
        {headline}
      </a>
      <div className="text-green-700 text-sm mb-1">{displayUrl}</div>
      <p className="text-gray-600 text-sm line-clamp-2">{description}</p>
    </div>
  )
}

export default function AdsTable({
  ads,
  adGroups,
  selectedAdGroupId,
  onAdGroupChange,
  loading
}: AdsTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ads</h3>
            <p className="text-xs text-gray-400 mt-1">Performance metrics for the last 30 days</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedAdGroupId}
              onChange={(e) => onAdGroupChange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Ad Groups</option>
              {adGroups.map((ag) => (
                <option key={ag.id} value={String(ag.id)}>
                  {ag.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {ads.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-400 text-sm">No ads found</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {ads.map((ad, i) => {
            const status = getStatusLabel(ad.status)
            return (
              <div
                key={ad.id || i}
                className="p-6 hover:bg-blue-50/30 transition-colors duration-150"
              >
                {/* Ad Preview */}
                <div className="mb-4">
                  <AdPreviewCard ad={ad} />
                </div>

                {/* Status & Info */}
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                  <span className="text-xs text-gray-400 truncate">
                    {ad.adGroupName}
                  </span>
                </div>

                {/* Ad Metrics - 2x2 grid */}
                {/* <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Impressions</div>
                    <div className="text-lg font-semibold text-gray-900">{formatNumber(ad.metrics.impressions)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Clicks</div>
                    <div className="text-lg font-semibold text-gray-900">{formatNumber(ad.metrics.clicks)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">CTR</div>
                    <div className="text-lg font-semibold text-gray-900">{(ad.metrics.ctr * 100).toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Conversions</div>
                    <div className="text-lg font-semibold text-gray-900">{formatNumber(ad.metrics.conversions)}</div>
                  </div>
                </div> */}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
