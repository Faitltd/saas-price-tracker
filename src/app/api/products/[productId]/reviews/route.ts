import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse, PaginatedResponse } from '@/types'

// Get reviews for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { 
          productId: params.productId,
          isActive: true 
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: false // Don't expose email
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.review.count({
        where: { 
          productId: params.productId,
          isActive: true 
        }
      })
    ])

    const response: PaginatedResponse<typeof reviews[0]> = {
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return Response.json(response)
  } catch (error) {
    console.error('Get reviews error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to retrieve reviews' },
      { status: 500 }
    )
  }
}

// Create a new review
export const POST = requireAuth(async (
  request: NextRequest,
  user,
  { params }: { params: { productId: string } }
) => {
  try {
    const body = await request.json()
    const { rating, title, content, pros, cons, wouldRecommend } = body

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return Response.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (!title || !content) {
      return Response.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.saasProduct.findUnique({
      where: { id: params.productId }
    })

    if (!product) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: params.productId
        }
      }
    })

    if (existingReview) {
      return Response.json(
        { success: false, error: 'You have already reviewed this product' },
        { status: 409 }
      )
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: params.productId,
        rating: parseInt(rating),
        title,
        content,
        pros: pros || [],
        cons: cons || [],
        wouldRecommend: wouldRecommend ?? true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Update product average rating
    const avgRating = await prisma.review.aggregate({
      where: { 
        productId: params.productId,
        isActive: true 
      },
      _avg: { rating: true },
      _count: { rating: true }
    })

    await prisma.saasProduct.update({
      where: { id: params.productId },
      data: {
        averageRating: avgRating._avg.rating || 0,
        reviewCount: avgRating._count.rating || 0
      }
    })

    const response: ApiResponse = {
      success: true,
      data: review,
      message: 'Review created successfully'
    }

    return Response.json(response, { status: 201 })
  } catch (error) {
    console.error('Create review error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    )
  }
})
