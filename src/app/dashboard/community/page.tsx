'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  StarIcon,
  TagIcon,
  ThumbUpIcon,
  ThumbDownIcon,
  PlusIcon,
  ChatBubbleLeftIcon,
  GiftIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

interface Review {
  id: string
  rating: number
  title: string
  content: string
  pros: string[]
  cons: string[]
  wouldRecommend: boolean
  createdAt: string
  user: {
    id: string
    name: string
  }
}

interface DiscountCode {
  id: string
  code: string
  description: string
  discountType: string
  discountValue: number | null
  upvotes: number
  downvotes: number
  expiresAt: string | null
  product: {
    id: string
    name: string
    category: string
  }
  submittedBy: {
    id: string
    name: string
  }
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'reviews' | 'discounts'>('reviews')
  const [reviews, setReviews] = useState<Review[]>([])
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews()
    } else {
      fetchDiscountCodes()
    }
  }, [activeTab])

  const fetchReviews = async () => {
    try {
      // For now, we'll show mock data since we need to implement product-specific reviews
      setReviews([
        {
          id: '1',
          rating: 5,
          title: 'Excellent for team collaboration',
          content: 'Slack has transformed how our team communicates. The integration capabilities are outstanding.',
          pros: ['Great integrations', 'User-friendly interface', 'Reliable'],
          cons: ['Can be expensive for large teams'],
          wouldRecommend: true,
          createdAt: new Date().toISOString(),
          user: { id: '1', name: 'John Doe' }
        },
        {
          id: '2',
          rating: 4,
          title: 'Good value for money',
          content: 'Notion is versatile and powerful. Takes some time to learn but worth it.',
          pros: ['Very flexible', 'Good templates', 'Affordable'],
          cons: ['Learning curve', 'Can be slow sometimes'],
          wouldRecommend: true,
          createdAt: new Date().toISOString(),
          user: { id: '2', name: 'Jane Smith' }
        }
      ])
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDiscountCodes = async () => {
    try {
      const response = await fetch('/api/community/discount-codes')
      if (response.ok) {
        const data = await response.json()
        setDiscountCodes(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch discount codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (codeId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/community/discount-codes/${codeId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ voteType })
      })

      if (response.ok) {
        // Refresh discount codes
        fetchDiscountCodes()
      }
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i}>
        {i < rating ? (
          <StarIconSolid className="h-4 w-4 text-yellow-400" />
        ) : (
          <StarIcon className="h-4 w-4 text-gray-300" />
        )}
      </span>
    ))
  }

  if (loading) {
    return (
      <DashboardLayout title="Community">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Community">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Community Hub</h2>
            <p className="text-gray-600">Share reviews, discount codes, and tips with the community</p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            <PlusIcon className="h-4 w-4 mr-2" />
            Contribute
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-6 text-sm font-medium border-b-2 flex items-center ${
                  activeTab === 'reviews'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                Product Reviews
              </button>
              <button
                onClick={() => setActiveTab('discounts')}
                className={`py-4 px-6 text-sm font-medium border-b-2 flex items-center ${
                  activeTab === 'discounts'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <GiftIcon className="h-5 w-5 mr-2" />
                Discount Codes
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <span className="text-sm text-gray-500">by {review.user.name}</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{review.title}</h3>
                        <p className="text-gray-700 mb-4">{review.content}</p>
                        
                        {review.pros.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-green-800 mb-1">Pros:</h4>
                            <ul className="text-sm text-green-700 list-disc list-inside">
                              {review.pros.map((pro, index) => (
                                <li key={index}>{pro}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {review.cons.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-red-800 mb-1">Cons:</h4>
                            <ul className="text-sm text-red-700 list-disc list-inside">
                              {review.cons.map((con, index) => (
                                <li key={index}>{con}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{review.wouldRecommend ? '👍 Recommends' : '👎 Doesn\'t recommend'}</span>
                          <span>•</span>
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'discounts' && (
              <div className="space-y-4">
                {discountCodes.map((code) => (
                  <div key={code.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                            {code.product.name}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-100 text-gray-800">
                            {code.code}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{code.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>by {code.submittedBy.name}</span>
                          {code.expiresAt && (
                            <>
                              <span>•</span>
                              <span>Expires {new Date(code.expiresAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleVote(code.id, 'upvote')}
                          className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded"
                        >
                          <ThumbUpIcon className="h-4 w-4" />
                          <span>{code.upvotes}</span>
                        </button>
                        <button
                          onClick={() => handleVote(code.id, 'downvote')}
                          className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                          <ThumbDownIcon className="h-4 w-4" />
                          <span>{code.downvotes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {discountCodes.length === 0 && (
                  <div className="text-center py-12">
                    <GiftIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No discount codes yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Be the first to share a discount code with the community!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
