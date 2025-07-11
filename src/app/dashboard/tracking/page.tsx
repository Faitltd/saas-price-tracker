'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  ChartBarIcon,
  BellIcon,
  CogIcon,
  TrashIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

interface TrackedPlan {
  id: string
  alertOnPriceIncrease: boolean
  alertOnPriceDecrease: boolean
  alertOnNewFeatures: boolean
  alertOnDeals: boolean
  targetPrice: number | null
  createdAt: string
  plan: {
    id: string
    name: string
    currentPrice: string | null
    currency: string
    billingCycle: string
    product: {
      id: string
      name: string
      category: string
      logoUrl: string | null
    }
    priceHistory: Array<{
      price: string
      createdAt: string
    }>
  }
}

export default function TrackingPage() {
  const [trackedPlans, setTrackedPlans] = useState<TrackedPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<TrackedPlan | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    fetchTrackedPlans()
  }, [])

  const fetchTrackedPlans = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/user/tracked-plans', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setTrackedPlans(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch tracked plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUntrack = async (planId: string, productName: string) => {
    if (!confirm(`Stop tracking ${productName}?`)) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/user/tracked-plans?planId=${planId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setTrackedPlans(prev => prev.filter(tp => tp.plan.id !== planId))
        alert(`Stopped tracking ${productName}`)
      }
    } catch (error) {
      console.error('Failed to untrack plan:', error)
      alert('Failed to untrack plan. Please try again.')
    }
  }

  const updateAlertSettings = async (trackedPlanId: string, settings: any) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/user/tracked-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: selectedPlan?.plan.id,
          ...settings
        })
      })

      if (response.ok) {
        await fetchTrackedPlans()
        setShowSettings(false)
        alert('Alert settings updated successfully')
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
      alert('Failed to update settings. Please try again.')
    }
  }

  const formatPrice = (price: string | null, currency: string, billingCycle: string) => {
    if (!price || price === '0') return 'Free'
    
    const amount = parseFloat(price)
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
    
    const cycle = billingCycle === 'MONTHLY' ? '/mo' : billingCycle === 'YEARLY' ? '/yr' : ''
    return `${formatted}${cycle}`
  }

  const getPriceChange = (priceHistory: any[]) => {
    if (priceHistory.length < 2) return null
    
    const current = parseFloat(priceHistory[0].price)
    const previous = parseFloat(priceHistory[1].price)
    const change = current - previous
    const changePercent = (change / previous) * 100
    
    return { change, changePercent }
  }

  if (loading) {
    return (
      <DashboardLayout title="My Tracking">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="My Tracking">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tracked Products</h2>
            <p className="text-gray-600">Monitor pricing changes and get alerts for your favorite SaaS tools</p>
          </div>
          <a
            href="/dashboard/products"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Track More Products
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Tracked Products</h3>
                <p className="text-2xl font-bold text-indigo-600">{trackedPlans.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <BellIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Active Alerts</h3>
                <p className="text-2xl font-bold text-green-600">
                  {trackedPlans.filter(tp => tp.alertOnPriceIncrease || tp.alertOnPriceDecrease).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <EyeIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Categories</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(trackedPlans.map(tp => tp.plan.product.category)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tracked Plans */}
        {trackedPlans.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {trackedPlans.map((tracked) => {
              const priceChange = getPriceChange(tracked.plan.priceHistory)
              
              return (
                <div key={tracked.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {tracked.plan.product.name}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {tracked.plan.product.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{tracked.plan.name} Plan</p>
                      
                      <div className="mt-3">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatPrice(tracked.plan.currentPrice, tracked.plan.currency, tracked.plan.billingCycle)}
                            </p>
                          </div>
                          {priceChange && (
                            <div className={`flex items-center ${priceChange.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {priceChange.change > 0 ? (
                                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                              )}
                              <span className="text-sm font-medium">
                                {priceChange.changePercent.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Alert Settings */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {tracked.alertOnPriceIncrease && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                            Price Increase Alerts
                          </span>
                        )}
                        {tracked.alertOnPriceDecrease && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Price Decrease Alerts
                          </span>
                        )}
                        {tracked.alertOnDeals && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Deal Alerts
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPlan(tracked)
                          setShowSettings(true)
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Settings"
                      >
                        <CogIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleUntrack(tracked.plan.id, tracked.plan.product.name)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Stop tracking"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Tracking since {new Date(tracked.createdAt).toLocaleDateString()}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tracked products</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start tracking SaaS products to monitor pricing changes and get alerts.
            </p>
            <div className="mt-6">
              <a
                href="/dashboard/products"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Browse Products
              </a>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && selectedPlan && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Alert Settings for {selectedPlan.plan.product.name}
                </h3>
                
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  updateAlertSettings(selectedPlan.id, {
                    alertOnPriceIncrease: formData.get('priceIncrease') === 'on',
                    alertOnPriceDecrease: formData.get('priceDecrease') === 'on',
                    alertOnNewFeatures: formData.get('newFeatures') === 'on',
                    alertOnDeals: formData.get('deals') === 'on',
                    targetPrice: formData.get('targetPrice') ? parseFloat(formData.get('targetPrice') as string) : null
                  })
                }}>
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="priceIncrease"
                        defaultChecked={selectedPlan.alertOnPriceIncrease}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Price increase alerts</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="priceDecrease"
                        defaultChecked={selectedPlan.alertOnPriceDecrease}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Price decrease alerts</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="newFeatures"
                        defaultChecked={selectedPlan.alertOnNewFeatures}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">New feature alerts</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="deals"
                        defaultChecked={selectedPlan.alertOnDeals}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Deal alerts</span>
                    </label>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Target Price</label>
                      <input
                        type="number"
                        name="targetPrice"
                        step="0.01"
                        defaultValue={selectedPlan.targetPrice || ''}
                        placeholder="Alert when price drops below..."
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowSettings(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      Save Settings
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
