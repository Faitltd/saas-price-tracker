'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  totalTrackedProducts: number
  totalSubscriptions: number
  monthlySpend: number
  potentialSavings: number
  recentAlerts: number
}

interface RecentAlert {
  id: string
  title: string
  message: string
  createdAt: string
  alertType: string
}

interface AIRecommendation {
  type: string
  title: string
  description: string
  potentialSavings: number
  confidence: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTrackedProducts: 0,
    totalSubscriptions: 0,
    monthlySpend: 0,
    potentialSavings: 0,
    recentAlerts: 0
  })
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([])
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Fetch real dashboard data
      const [statsRes, alertsRes, recommendationsRes] = await Promise.all([
        fetch('/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/user/alerts?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/ai/recommendations', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.data)
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json()
        setRecentAlerts(alertsData.data || [])
      }

      if (recommendationsRes.ok) {
        const recData = await recommendationsRes.json()
        setRecommendations(recData.data || [])
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'PRICE_INCREASE':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" />
      case 'PRICE_DECREASE':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-green-500" />
      default:
        return <BellIcon className="h-5 w-5 text-blue-500" />
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tracked Products
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalTrackedProducts}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Monthly Spend
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(stats.monthlySpend)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <SparklesIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Potential Savings
                    </dt>
                    <dd className="text-lg font-medium text-green-600">
                      {formatCurrency(stats.potentialSavings)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BellIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Recent Alerts
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.recentAlerts}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Recommendations */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                AI Recommendations
              </h3>
              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="border-l-4 border-indigo-400 bg-indigo-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <SparklesIcon className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-indigo-800">
                            {rec.title}
                          </h4>
                          <p className="mt-1 text-sm text-indigo-700">
                            {rec.description}
                          </p>
                          <div className="mt-2 flex items-center text-sm text-indigo-600">
                            <span>Potential savings: {formatCurrency(rec.potentialSavings)}</span>
                            <span className="ml-2">• Confidence: {Math.round(rec.confidence * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recommendations available yet.</p>
              )}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Alerts
              </h3>
              {recentAlerts.length > 0 ? (
                <div className="space-y-3">
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getAlertIcon(alert.alertType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {alert.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recent alerts.</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href="/dashboard/products"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-200 rounded-lg hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                    <ChartBarIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" />
                    Browse Products
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Discover new SaaS products to track and compare pricing.
                  </p>
                </div>
              </a>

              <a
                href="/dashboard/insights"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-200 rounded-lg hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                    <SparklesIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" />
                    AI Insights
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Get personalized recommendations to optimize your SaaS spend.
                  </p>
                </div>
              </a>

              <a
                href="/dashboard/settings"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-200 rounded-lg hover:border-gray-300"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
                    <BellIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" />
                    Manage Alerts
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Configure your notification preferences and alert settings.
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
