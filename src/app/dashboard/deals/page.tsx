'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  TagIcon,
  ClockIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  FireIcon
} from '@heroicons/react/24/outline'

interface Deal {
  id: string
  title: string
  description: string
  dealUrl: string
  originalPrice: number | null
  discountedPrice: number | null
  discountPercent: number | null
  validFrom: string | null
  validUntil: string | null
  source: string
  viewCount: number
  clickCount: number
  product: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    category: string
  } | null
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    fetchDeals()
  }, [])

  const fetchDeals = async () => {
    try {
      const response = await fetch('/api/deals?limit=50')
      const data = await response.json()
      
      if (data.success) {
        setDeals(data.data)
        
        // Extract unique categories
        const uniqueCategories = [...new Set(
          data.data
            .filter((deal: Deal) => deal.product)
            .map((deal: Deal) => deal.product!.category)
        )]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDealClick = async (deal: Deal) => {
    try {
      // Track click
      await fetch(`/api/deals/${deal.id}/click`, { method: 'POST' })
      
      // Open deal URL
      window.open(deal.dealUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Failed to track deal click:', error)
      // Still open the URL even if tracking fails
      window.open(deal.dealUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString()
  }

  const isExpiringSoon = (validUntil: string | null) => {
    if (!validUntil) return false
    const expiryDate = new Date(validUntil)
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    return expiryDate <= threeDaysFromNow
  }

  const filteredDeals = selectedCategory 
    ? deals.filter(deal => deal.product?.category === selectedCategory)
    : deals

  if (loading) {
    return (
      <DashboardLayout title="Deals & Discounts">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Deals & Discounts">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <TagIcon className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">SaaS Deals & Discounts</h2>
              <p className="mt-1 opacity-90">
                Discover the latest deals and save money on your favorite SaaS tools
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="ml-auto text-sm text-gray-500">
              {filteredDeals.length} deals available
            </div>
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDeals.map((deal) => (
            <div key={deal.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Deal Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {deal.product && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {deal.product.name}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {deal.source}
                      </span>
                      {isExpiringSoon(deal.validUntil) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <FireIcon className="h-3 w-3 mr-1" />
                          Expiring Soon
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{deal.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{deal.description}</p>
                  </div>
                </div>

                {/* Pricing Info */}
                {(deal.originalPrice || deal.discountedPrice || deal.discountPercent) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        {deal.discountPercent && (
                          <div className="text-2xl font-bold text-green-600">
                            {deal.discountPercent}% OFF
                          </div>
                        )}
                        {deal.originalPrice && deal.discountedPrice && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-gray-500 line-through">
                              {formatPrice(deal.originalPrice)}
                            </span>
                            <span className="text-lg font-semibold text-green-600">
                              {formatPrice(deal.discountedPrice)}
                            </span>
                          </div>
                        )}
                      </div>
                      <TagIcon className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                )}

                {/* Deal Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    {deal.validUntil && (
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Expires {formatDate(deal.validUntil)}
                      </div>
                    )}
                    <div className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {deal.viewCount} views
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleDealClick(deal)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span>Get Deal</span>
                  <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredDeals.length === 0 && (
          <div className="text-center py-12">
            <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No deals found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedCategory 
                ? `No deals available in the ${selectedCategory} category.`
                : 'No deals are currently available. Check back soon!'
              }
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <TagIcon className="h-6 w-6 text-blue-600 mt-1" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900">About Our Deals</h3>
              <p className="mt-2 text-blue-700">
                We continuously scan the web for the best SaaS deals and discounts. 
                All deals are verified and updated regularly. Click "Get Deal" to be 
                redirected to the official offer page.
              </p>
              <p className="mt-2 text-sm text-blue-600">
                💡 Tip: Enable deal alerts in your settings to get notified when new 
                deals are available for products you're tracking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
