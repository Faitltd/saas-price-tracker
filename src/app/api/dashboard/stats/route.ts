import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    // Get user's tracked products count
    const trackedProductsCount = await prisma.userTrackedPlan.count({
      where: { 
        userId: user.id,
        isActive: true 
      }
    })

    // Get user's subscriptions count and total spend
    const subscriptions = await prisma.userSubscription.findMany({
      where: { 
        userId: user.id,
        isActive: true 
      },
      select: {
        currentPrice: true,
        billingCycle: true
      }
    })

    const totalSubscriptions = subscriptions.length
    const monthlySpend = subscriptions.reduce((sum, sub) => {
      const price = sub.currentPrice.toNumber()
      return sum + (sub.billingCycle === 'YEARLY' ? price / 12 : price)
    }, 0)

    // Get recent alerts count
    const recentAlertsCount = await prisma.priceAlert.count({
      where: { 
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    })

    // Get unread alerts count
    const unreadAlertsCount = await prisma.priceAlert.count({
      where: { 
        userId: user.id,
        isRead: false
      }
    })

    // Get AI recommendations and calculate potential savings
    const trackedPlans = await prisma.userTrackedPlan.findMany({
      where: { 
        userId: user.id,
        isActive: true 
      },
      include: {
        plan: {
          include: {
            product: true
          }
        }
      }
    })

    // Simple potential savings calculation
    let potentialSavings = 0
    trackedPlans.forEach(tracked => {
      const currentPrice = tracked.plan.currentPrice?.toNumber() || 0
      // Estimate 15% average savings potential
      potentialSavings += currentPrice * 0.15
    })

    // Get category breakdown
    const categoryBreakdown = await prisma.userTrackedPlan.groupBy({
      by: ['planId'],
      where: { 
        userId: user.id,
        isActive: true 
      },
      _count: true
    })

    const planIds = categoryBreakdown.map(item => item.planId)
    const categoryCounts = await prisma.pricingPlan.findMany({
      where: { id: { in: planIds } },
      include: {
        product: {
          select: { category: true }
        }
      }
    })

    const categories = categoryCounts.reduce((acc, plan) => {
      const category = plan.product.category
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get recent price changes - simplified for now
    const recentPriceChanges = await prisma.priceSnapshot.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        plan: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    const stats = {
      totalTrackedProducts: trackedProductsCount,
      totalSubscriptions,
      monthlySpend: Math.round(monthlySpend * 100) / 100,
      potentialSavings: Math.round(potentialSavings * 100) / 100,
      recentAlerts: recentAlertsCount,
      unreadAlerts: unreadAlertsCount,
      categoryBreakdown: categories,
      recentPriceChanges: recentPriceChanges.map(change => ({
        id: change.id,
        productName: change.plan.product.name,
        planName: change.plan.name,
        oldPrice: change.previousPrice?.toNumber() || 0,
        newPrice: change.price.toNumber(),
        changePercent: change.priceChangePercent?.toNumber() || 0,
        date: change.createdAt
      }))
    }

    const response: ApiResponse = {
      success: true,
      data: stats,
      message: 'Dashboard stats retrieved successfully'
    }

    return Response.json(response)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to retrieve dashboard stats' },
      { status: 500 }
    )
  }
})
