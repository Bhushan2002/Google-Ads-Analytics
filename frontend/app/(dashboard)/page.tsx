'use client'

import DashboardView from '@/components/dashboard/DashboardView'
import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const status = searchParams.get('status')
    const message = searchParams.get('message')

    if (status === 'success') {
      toast.success('Google Ads account connected!')
      setConnected(true)
      setLoading(false)
      router.replace('/')   // clean up URL
    } else if (status === 'error') {
      const errorText = message
        ? decodeURIComponent(message)
        : 'Failed to connect Google account. Please try again.'
      toast.error(errorText, { duration: 10000 })
      setConnected(false)
      setLoading(false)
      router.replace('/')   // clean up URL
    } else {
      checkConnectionStatus()
    }
  }, [])

  const checkConnectionStatus = async () => {
    try {
      const res = await fetch('http://localhost:9000/api/auth/google/status')
      const data = await res.json()
      setConnected(data.connected)
    } catch (err) {
      console.error('Failed to check connection status:', err)
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/70 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Checking connection status...</p>
        </div>
      </div>
    )
  }

  return <DashboardView isConnected={connected} />
}

export default Dashboard