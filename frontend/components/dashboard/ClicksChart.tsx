'use client'

import React from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface ClicksChartProps {
  daily: {
    date: string
    clicks: number
    impressions: number
    conversions: number
    cost: number
  }[]
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(num >= 10_000 ? 0 : 1) + 'k'
  return num.toLocaleString()
}

export default function ClicksChart({ daily }: ClicksChartProps) {
  const totalClicks = daily.reduce((s, d) => s + d.clicks, 0)

  // Compute % change (first half vs second half)
  const mid = Math.floor(daily.length / 2)
  const firstHalf = daily.slice(0, mid).reduce((s, d) => s + d.clicks, 0)
  const secondHalf = daily.slice(mid).reduce((s, d) => s + d.clicks, 0)
  const change = firstHalf === 0 ? 0 : ((secondHalf - firstHalf) / firstHalf) * 100
  const isPositive = change >= 0

  // Format date labels
  const chartData = daily.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-500">Clicks Over Time</h3>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-3xl font-bold text-gray-900 tracking-tight">
            {formatNumber(totalClicks)}
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-500'
            }`}
          >
            {isPositive ? '+' : ''}{change.toFixed(0)}%
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Daily clicks for the last 30 days</p>
      </div>

      <div className="h-64 w-full" style={{ minWidth: 0, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="conversionsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              interval={Math.max(0, Math.floor(chartData.length / 6) - 1)}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatNumber(v)}
            />
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                padding: '8px 12px',
              }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              formatter={(value: any, name: any) => [formatNumber(Number(value)), name]}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', color: '#64748b' }}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              name="Clicks"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#clicksGradient)"
              dot={false}
              animationDuration={1200}
            />
            <Area
              type="monotone"
              dataKey="conversions"
              name="Conversions"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#conversionsGradient)"
              dot={false}
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
