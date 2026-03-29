'use client'

import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface ImpressionsChartProps {
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

export default function ImpressionsChart({ daily }: ImpressionsChartProps) {
  const totalImpressions = daily.reduce((s, d) => s + d.impressions, 0)

  const mid = Math.floor(daily.length / 2)
  const firstHalf = daily.slice(0, mid).reduce((s, d) => s + d.impressions, 0)
  const secondHalf = daily.slice(mid).reduce((s, d) => s + d.impressions, 0)
  const change = firstHalf === 0 ? 0 : ((secondHalf - firstHalf) / firstHalf) * 100
  const isPositive = change >= 0

  const chartData = daily.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-500">Impressions & Cost</h3>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-3xl font-bold text-gray-900 tracking-tight">
            {formatNumber(totalImpressions)}
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
        <p className="text-xs text-gray-400 mt-1">Impressions and cost for the last 30 days</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              interval={Math.max(0, Math.floor(chartData.length / 6) - 1)}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatNumber(v)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${formatNumber(v)}`}
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
              formatter={(value: any, name: any) => {
                if (name === 'Cost') return [`$${Number(value).toFixed(2)}`, name]
                return [formatNumber(Number(value)), name]
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', color: '#64748b' }}
            />
            <Bar
              yAxisId="left"
              dataKey="impressions"
              name="Impressions"
              fill="#3b82f6"
              radius={[3, 3, 0, 0]}
              animationDuration={1200}
            />
            <Bar
              yAxisId="right"
              dataKey="cost"
              name="Cost"
              fill="#60a5fa"
              radius={[3, 3, 0, 0]}
              animationDuration={1200}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
