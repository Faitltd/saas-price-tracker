'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  SparklesIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface AIRecommendation {
  type: string
  title: string
  description: string
  potentialSavings: number
  confidence: number
  actionUrl?: string
}

interface AIInsight {
  id: string
  type: string
  title: string
  description: string
  data: any
  confidence: number
  createdAt: string
}

export default function InsightsPage() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'recommendations' | 'insights'>('recommendations')

  useEffect(() => {
    fetchAIData()
  }, [])

  const fetchAIData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      const [recommendationsRes, insightsRes] = await Promise.all([
        fetch('/api/ai/recommendations', { headers }),
        fetch('/api/ai/insights')
      ])

      if (recommendationsRes.ok) {
        const recData = await recommendationsRes.json()
        setRecommendations(recData.data || [])
      }

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json()
        setInsights(insightsData.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch AI data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'downgrade':
        return <TrendingDownIcon className="h-6 w-6 text-green-500" />
      case 'alternative':
        return <SparklesIcon className="h-6 w-6 text-blue-500" />
      case 'bundle':
        return <CurrencyDollarIcon className="h-6 w-6 text-purple-500" />
      case 'cancel':
        return <TrendingDownIcon className="h-6 w-6 text-red-500" />
      default:
        return <LightBulbIcon className="h-6 w-6 text-yellow-500" />
    }
  }

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'downgrade':
        return 'bg-green-50 border-green-200'
      case 'alternative':
        return 'bg-blue-50 border-blue-200'
      case 'bundle':
        return 'bg-purple-50 border-purple-200'
      case 'cancel':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-yellow-50 border-yellow-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0)

  if (loading) {
    return (
      <DashboardLayout title="AI Insights">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="AI Insights">
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <SparklesIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">AI Recommendations</h3>
                <p className="text-2xl font-bold text-indigo-600">{recommendations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Potential Savings</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalPotentialSavings)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Market Insights</h3>
                <p className="text-2xl font-bold text-blue-600">{insights.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'recommendations'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                AI Recommendations
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'insights'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Market Insights
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-6 ${getRecommendationColor(rec.type)}`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {getRecommendationIcon(rec.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">{rec.title}</h3>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-green-600">
                                {formatCurrency(rec.potentialSavings)}
                              </p>
                              <p className="text-sm text-gray-500">potential savings</p>
                            </div>
                          </div>
                          <p className="mt-2 text-gray-700">{rec.description}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-500">
                                Confidence: {Math.round(rec.confidence * 100)}%
                              </span>
                              <span className="text-sm text-gray-500 capitalize">
                                Type: {rec.type.replace('_', ' ')}
                              </span>
                            </div>
                            {rec.actionUrl && (
                              <a
                                href={rec.actionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                              >
                                Take Action
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No recommendations yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start tracking some SaaS products to get personalized recommendations.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-6">
                {insights.length > 0 ? (
                  insights.map((insight) => (
                    <div key={insight.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <ChartBarIcon className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">{insight.title}</h3>
                            <span className="text-sm text-gray-500">
                              {Math.round(insight.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="mt-2 text-gray-700">{insight.description}</p>
                          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                            <span className="capitalize">Type: {insight.type.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No market insights available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Market insights will appear here as we analyze SaaS pricing trends.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        {recommendations.length === 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-indigo-900">
                  Get Personalized AI Recommendations
                </h3>
                <p className="mt-1 text-indigo-700">
                  Start tracking SaaS products and connect your subscriptions to receive AI-powered 
                  spend optimization recommendations tailored to your usage patterns.
                </p>
                <div className="mt-4">
                  <a
                    href="/dashboard/products"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Browse Products
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
