'use client'

import React from 'react'
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis
} from 'recharts'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  color: string
  data: { date: string; value: number }[]
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(num >= 10_000 ? 0 : 1) + 'k'
  return num.toLocaleString()
}

function MetricCard({ title, value, change, color, data }: MetricCardProps) {
  const isPositive = (change ?? 0) >= 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col justify-between min-h-[160px] hover:shadow-md transition-shadow duration-200">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl font-bold text-gray-900 tracking-tight">
            {typeof value === 'number' ? formatNumber(value) : value}
          </span>
          {change !== undefined && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isPositive
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-red-50 text-red-500'
              }`}
            >
              {isPositive ? '+' : ''}{change.toFixed(0)}%
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">Last 30 days</p>
      </div>
      <div className="h-12 mt-2 -mx-1">
        {data.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad-${title})`}
                dot={false}
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

interface OverviewCardsProps {
  totals: {
    clicks: number
    impressions: number
    conversions: number
    cost: number
  }
  daily: {
    date: string
    clicks: number
    impressions: number
    conversions: number
    cost: number
  }[]
}

export default function OverviewCards({ totals, daily }: OverviewCardsProps) {
  // Calculate % change (first half vs second half of the period)
  const calcChange = (key: 'clicks' | 'impressions' | 'conversions' | 'cost') => {
    if (daily.length < 2) return 0
    const mid = Math.floor(daily.length / 2)
    const firstHalf = daily.slice(0, mid).reduce((sum, d) => sum + d[key], 0)
    const secondHalf = daily.slice(mid).reduce((sum, d) => sum + d[key], 0)
    if (firstHalf === 0) return secondHalf > 0 ? 100 : 0
    return ((secondHalf - firstHalf) / firstHalf) * 100
  }

  const cards: MetricCardProps[] = [
    {
      title: 'Clicks',
      value: totals.clicks,
      change: calcChange('clicks'),
      color: '#22c55e',
      data: daily.map(d => ({ date: d.date, value: d.clicks })),
    },
    {
      title: 'Conversions',
      value: totals.conversions,
      change: calcChange('conversions'),
      color: '#ef4444',
      data: daily.map(d => ({ date: d.date, value: d.conversions })),
    },
    {
      title: 'Impressions',
      value: totals.impressions,
      change: calcChange('impressions'),
      color: '#6b7280',
      data: daily.map(d => ({ date: d.date, value: d.impressions })),
    },
    {
      title: 'Total Cost',
      value: `$${formatNumber(totals.cost)}`,
      change: calcChange('cost'),
      color: '#3b82f6',
      data: daily.map(d => ({ date: d.date, value: d.cost })),
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <MetricCard key={card.title} {...card} />
      ))}
    </div>
  )
}
