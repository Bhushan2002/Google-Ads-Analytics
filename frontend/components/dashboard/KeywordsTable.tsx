'use client'

import React, { useState, useMemo } from 'react'

interface Keyword {
  id: string | number
  keyword: string
  matchType: string
  status: string
  isNegative: boolean
  adGroupId: string | number
  adGroupName: string
  metrics: {
    clicks: number
    impressions: number
    ctr: number
    cost: number
  }
}

interface KeywordsTableProps {
  keywords: Keyword[]
  loading?: boolean
}

const ITEMS_PER_PAGE = 10

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(num >= 10_000 ? 0 : 1) + 'k'
  return num.toLocaleString()
}

function formatCurrency(num: number): string {
  return '$' + num.toFixed(2)
}

export default function KeywordsTable({ keywords, loading }: KeywordsTableProps) {
  const [activeTab, setActiveTab] = useState<'keywords' | 'negative'>('keywords')
  const [currentPage, setCurrentPage] = useState(1)

  const regularKeywords = keywords.filter(k => !k.isNegative)
  const negativeKeywords = keywords.filter(k => k.isNegative)
  const displayedKeywords = activeTab === 'keywords' ? regularKeywords : negativeKeywords

  // Reset to page 1 when tab changes
  const handleTabChange = (tab: 'keywords' | 'negative') => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  // Pagination logic
  const totalPages = Math.ceil(displayedKeywords.length / ITEMS_PER_PAGE)
  const paginatedKeywords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return displayedKeywords.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [displayedKeywords, currentPage])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="p-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-6 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Keywords</h3>
          <p className="text-xs text-gray-400 mt-1">Performance metrics for the last 30 days</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => handleTabChange('keywords')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'keywords'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Keywords ({regularKeywords.length})
          </button>
          <button
            onClick={() => handleTabChange('negative')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'negative'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Negative keywords ({negativeKeywords.length})
          </button>
        </div>
      </div>

      {displayedKeywords.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-400 text-sm">
            {activeTab === 'keywords' ? 'No keywords found' : 'No negative keywords found'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Keyword</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Cost</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Clicks</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">CTR</th>
                </tr>
              </thead>
              <tbody>
                {paginatedKeywords.map((k, i) => {
                  return (
                    <tr
                      key={k.id || i}
                      className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors duration-150"
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-800">{k.keyword || 'Unknown'}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-700">
                        {formatCurrency(k.metrics.cost)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-700">
                        {formatNumber(k.metrics.clicks)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-700">
                        {(k.metrics.ctr * 100).toFixed(2)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
              <div className="text-xs text-gray-500">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, displayedKeywords.length)} of {displayedKeywords.length}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-8 h-8 text-xs font-medium rounded-md transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
