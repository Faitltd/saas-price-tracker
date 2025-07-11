import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse, PaginatedResponse } from '@/types'

// Get user's alerts
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const skip = (page - 1) * limit

    const where: any = { userId: user.id }
    if (unreadOnly) {
      where.isRead = false
    }

    const [alerts, total] = await Promise.all([
      prisma.priceAlert.findMany({
        where,
        include: {
          plan: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.priceAlert.count({ where })
    ])

    const response: PaginatedResponse<typeof alerts[0]> = {
      success: true,
      data: alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return Response.json(response)
  } catch (error) {
    console.error('Get alerts error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to retrieve alerts' },
      { status: 500 }
    )
  }
})

// Mark alerts as read
export const PATCH = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const { alertIds, markAllAsRead } = body

    if (markAllAsRead) {
      // Mark all user's alerts as read
      await prisma.priceAlert.updateMany({
        where: { 
          userId: user.id,
          isRead: false 
        },
        data: { isRead: true }
      })

      return Response.json({
        success: true,
        message: 'All alerts marked as read'
      })
    }

    if (!alertIds || !Array.isArray(alertIds)) {
      return Response.json(
        { success: false, error: 'Alert IDs array is required' },
        { status: 400 }
      )
    }

    // Mark specific alerts as read
    await prisma.priceAlert.updateMany({
      where: {
        id: { in: alertIds },
        userId: user.id
      },
      data: { isRead: true }
    })

    const response: ApiResponse = {
      success: true,
      message: `${alertIds.length} alerts marked as read`
    }

    return Response.json(response)
  } catch (error) {
    console.error('Mark alerts as read error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to mark alerts as read' },
      { status: 500 }
    )
  }
})
