import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

// Get user's tracked plans
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const trackedPlans = await prisma.userTrackedPlan.findMany({
      where: { 
        userId: user.id,
        isActive: true 
      },
      include: {
        plan: {
          include: {
            product: true,
            priceHistory: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const response: ApiResponse = {
      success: true,
      data: trackedPlans,
      message: 'Tracked plans retrieved successfully'
    }

    return Response.json(response)
  } catch (error) {
    console.error('Get tracked plans error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to retrieve tracked plans' },
      { status: 500 }
    )
  }
})

// Add a plan to tracking
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const { planId, alertOnPriceIncrease, alertOnPriceDecrease, alertOnNewFeatures, alertOnDeals, targetPrice } = body

    if (!planId) {
      return Response.json(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    // Check if plan exists
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: planId },
      include: { product: true }
    })

    if (!plan) {
      return Response.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Check if already tracking
    const existingTracking = await prisma.userTrackedPlan.findUnique({
      where: {
        userId_planId: {
          userId: user.id,
          planId
        }
      }
    })

    if (existingTracking) {
      // Update existing tracking
      const updatedTracking = await prisma.userTrackedPlan.update({
        where: { id: existingTracking.id },
        data: {
          alertOnPriceIncrease: alertOnPriceIncrease ?? true,
          alertOnPriceDecrease: alertOnPriceDecrease ?? true,
          alertOnNewFeatures: alertOnNewFeatures ?? true,
          alertOnDeals: alertOnDeals ?? true,
          targetPrice: targetPrice ? parseFloat(targetPrice) : null,
          isActive: true
        },
        include: {
          plan: {
            include: { product: true }
          }
        }
      })

      return Response.json({
        success: true,
        data: updatedTracking,
        message: 'Tracking preferences updated successfully'
      })
    }

    // Create new tracking
    const trackedPlan = await prisma.userTrackedPlan.create({
      data: {
        userId: user.id,
        planId,
        alertOnPriceIncrease: alertOnPriceIncrease ?? true,
        alertOnPriceDecrease: alertOnPriceDecrease ?? true,
        alertOnNewFeatures: alertOnNewFeatures ?? true,
        alertOnDeals: alertOnDeals ?? true,
        targetPrice: targetPrice ? parseFloat(targetPrice) : null
      },
      include: {
        plan: {
          include: { product: true }
        }
      }
    })

    const response: ApiResponse = {
      success: true,
      data: trackedPlan,
      message: `Started tracking ${plan.product.name} ${plan.name}`
    }

    return Response.json(response, { status: 201 })
  } catch (error) {
    console.error('Add tracked plan error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to add plan to tracking' },
      { status: 500 }
    )
  }
})

// Remove a plan from tracking
export const DELETE = requireAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId')

    if (!planId) {
      return Response.json(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    const trackedPlan = await prisma.userTrackedPlan.findUnique({
      where: {
        userId_planId: {
          userId: user.id,
          planId
        }
      }
    })

    if (!trackedPlan) {
      return Response.json(
        { success: false, error: 'Tracked plan not found' },
        { status: 404 }
      )
    }

    await prisma.userTrackedPlan.update({
      where: { id: trackedPlan.id },
      data: { isActive: false }
    })

    const response: ApiResponse = {
      success: true,
      message: 'Plan removed from tracking successfully'
    }

    return Response.json(response)
  } catch (error) {
    console.error('Remove tracked plan error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to remove plan from tracking' },
      { status: 500 }
    )
  }
})
