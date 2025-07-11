'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  BellIcon,
  CheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  TagIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

interface Alert {
  id: string
  alertType: string
  title: string
  message: string
  oldPrice: string | null
  newPrice: string | null
  priceChange: string | null
  priceChangePercent: string | null
  isRead: boolean
  createdAt: string
  plan: {
    id: string
    name: string
    product: {
      id: string
      name: string
      category: string
    }
  }
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'price_increase' | 'price_decrease' | 'deals'>('all')
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchAlerts()
  }, [filter])

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const params = new URLSearchParams()
      if (filter === 'unread') params.append('unreadOnly', 'true')
      
      const response = await fetch(`/api/user/alerts?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        let filteredAlerts = data.data || []
        
        // Apply client-side filtering for alert types
        if (filter === 'price_increase') {
          filteredAlerts = filteredAlerts.filter((alert: Alert) => alert.alertType === 'PRICE_INCREASE')
        } else if (filter === 'price_decrease') {
          filteredAlerts = filteredAlerts.filter((alert: Alert) => alert.alertType === 'PRICE_DECREASE')
        } else if (filter === 'deals') {
          filteredAlerts = filteredAlerts.filter((alert: Alert) => alert.alertType === 'DEAL_ALERT')
        }
        
        setAlerts(filteredAlerts)
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (alertIds: string[]) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/user/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ alertIds })
      })

      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alertIds.includes(alert.id) ? { ...alert, isRead: true } : alert
        ))
        setSelectedAlerts(new Set())
      }
    } catch (error) {
      console.error('Failed to mark alerts as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/user/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ markAllAsRead: true })
      })

      if (response.ok) {
        setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })))
        alert('All alerts marked as read')
      }
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error)
    }
  }

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'PRICE_INCREASE':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" />
      case 'PRICE_DECREASE':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-green-500" />
      case 'DEAL_ALERT':
        return <TagIcon className="h-5 w-5 text-blue-500" />
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'PRICE_INCREASE':
        return 'border-l-red-500 bg-red-50'
      case 'PRICE_DECREASE':
        return 'border-l-green-500 bg-green-50'
      case 'DEAL_ALERT':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const formatPrice = (price: string | null) => {
    if (!price) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(price))
  }

  const unreadCount = alerts.filter(alert => !alert.isRead).length

  if (loading) {
    return (
      <DashboardLayout title="Alerts">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Alerts">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Price Alerts</h2>
            <p className="text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All alerts read'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedAlerts.size > 0 && (
              <button
                onClick={() => markAsRead(Array.from(selectedAlerts))}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Mark Selected as Read
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Alerts', count: alerts.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'price_increase', label: 'Price Increases', count: alerts.filter(a => a.alertType === 'PRICE_INCREASE').length },
              { key: 'price_decrease', label: 'Price Decreases', count: alerts.filter(a => a.alertType === 'PRICE_DECREASE').length },
              { key: 'deals', label: 'Deals', count: alerts.filter(a => a.alertType === 'DEAL_ALERT').length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  filter === key
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {label}
                <span className="ml-2 bg-gray-200 text-gray-600 rounded-full px-2 py-1 text-xs">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        {alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 p-4 rounded-lg shadow ${getAlertColor(alert.alertType)} ${
                  !alert.isRead ? 'ring-2 ring-indigo-200' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.has(alert.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedAlerts)
                        if (e.target.checked) {
                          newSelected.add(alert.id)
                        } else {
                          newSelected.delete(alert.id)
                        }
                        setSelectedAlerts(newSelected)
                      }}
                      className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.alertType)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
                        {!alert.isRead && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                            New
                          </span>
                        )}
                      </div>
                      
                      <p className="mt-1 text-sm text-gray-700">{alert.message}</p>
                      
                      {/* Price Change Details */}
                      {alert.oldPrice && alert.newPrice && (
                        <div className="mt-2 flex items-center space-x-4 text-sm">
                          <span className="text-gray-500">
                            {formatPrice(alert.oldPrice)} → {formatPrice(alert.newPrice)}
                          </span>
                          {alert.priceChangePercent && (
                            <span className={`font-medium ${
                              parseFloat(alert.priceChangePercent) > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {parseFloat(alert.priceChangePercent) > 0 ? '+' : ''}
                              {parseFloat(alert.priceChangePercent).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>{alert.plan.product.name} - {alert.plan.name}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => markAsRead([alert.id])}
                    className="ml-4 p-1 text-gray-400 hover:text-gray-600"
                    title={alert.isRead ? 'Mark as unread' : 'Mark as read'}
                  >
                    {alert.isRead ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? "You don't have any alerts yet. Start tracking products to receive price change notifications."
                : `No ${filter.replace('_', ' ')} alerts found.`
              }
            </p>
            {filter === 'all' && (
              <div className="mt-6">
                <a
                  href="/dashboard/products"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Start Tracking Products
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
