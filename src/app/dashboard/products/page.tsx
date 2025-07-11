'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  website: string
  category: string
  subcategory: string | null
  plans: Plan[]
}

interface Plan {
  id: string
  name: string
  description: string | null
  currentPrice: string | null
  currency: string
  billingCycle: string
  hasFreeTier: boolean
  features: string[]
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [trackedPlans, setTrackedPlans] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchProducts()
    fetchTrackedPlans()
  }, [searchTerm, selectedCategory])

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      
      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.data)
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.data.map((p: Product) => p.category))]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrackedPlans = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/user/tracked-plans', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const planIds = new Set(data.data.map((tp: any) => tp.planId))
        setTrackedPlans(planIds)
      }
    } catch (error) {
      console.error('Failed to fetch tracked plans:', error)
    }
  }

  const handleTrackPlan = async (planId: string, productName: string, planName: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/user/tracked-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      })

      if (response.ok) {
        setTrackedPlans(prev => new Set([...prev, planId]))
        // Show success message (you could add a toast notification here)
        alert(`Started tracking ${productName} ${planName}`)
      }
    } catch (error) {
      console.error('Failed to track plan:', error)
      alert('Failed to track plan. Please try again.')
    }
  }

  const handleUntrackPlan = async (planId: string, productName: string, planName: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/user/tracked-plans?planId=${planId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setTrackedPlans(prev => {
          const newSet = new Set(prev)
          newSet.delete(planId)
          return newSet
        })
        alert(`Stopped tracking ${productName} ${planName}`)
      }
    } catch (error) {
      console.error('Failed to untrack plan:', error)
      alert('Failed to untrack plan. Please try again.')
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

  if (loading) {
    return (
      <DashboardLayout title="Browse Products">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Browse Products">
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                    {product.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
                    )}
                  </div>
                  <a
                    href={product.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  >
                    Visit →
                  </a>
                </div>

                {/* Pricing Plans */}
                <div className="mt-4 space-y-3">
                  {product.plans.slice(0, 3).map((plan) => (
                    <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{plan.name}</h4>
                            {plan.hasFreeTier && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Free
                              </span>
                            )}
                          </div>
                          <p className="text-lg font-semibold text-indigo-600 mt-1">
                            {formatPrice(plan.currentPrice, plan.currency, plan.billingCycle)}
                          </p>
                          {plan.description && (
                            <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                          )}
                        </div>
                        <div className="ml-4">
                          {trackedPlans.has(plan.id) ? (
                            <button
                              onClick={() => handleUntrackPlan(plan.id, product.name, plan.name)}
                              className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
                            >
                              <CheckIcon className="h-4 w-4 mr-1" />
                              Tracking
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTrackPlan(plan.id, product.name, plan.name)}
                              className="flex items-center px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm"
                            >
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Track
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Features */}
                      {plan.features && plan.features.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-1">
                            {plan.features.slice(0, 3).map((feature, index) => (
                              <span
                                key={index}
                                className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                              >
                                {feature}
                              </span>
                            ))}
                            {plan.features.length > 3 && (
                              <span className="inline-block text-gray-500 text-xs px-2 py-1">
                                +{plan.features.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {product.plans.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{product.plans.length - 3} more plans available
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search terms or filters.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
