import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse, PaginatedResponse } from '@/types'

// Get community discount codes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const productId = searchParams.get('productId')
    const skip = (page - 1) * limit

    const where: any = {
      isActive: true,
      isVerified: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]
    }

    if (productId) {
      where.productId = productId
    }

    const [discountCodes, total] = await Promise.all([
      prisma.discountCode.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true
            }
          },
          submittedBy: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { upvotes: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.discountCode.count({ where })
    ])

    const response: PaginatedResponse<typeof discountCodes[0]> = {
      success: true,
      data: discountCodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }

    return Response.json(response)
  } catch (error) {
    console.error('Get discount codes error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to retrieve discount codes' },
      { status: 500 }
    )
  }
}

// Submit a new discount code
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const { 
      productId, 
      code, 
      description, 
      discountType, 
      discountValue, 
      expiresAt,
      minimumSpend,
      usageLimit 
    } = body

    // Validate input
    if (!productId || !code || !description) {
      return Response.json(
        { success: false, error: 'Product ID, code, and description are required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.saasProduct.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if code already exists for this product
    const existingCode = await prisma.discountCode.findFirst({
      where: {
        productId,
        code: code.toUpperCase(),
        isActive: true
      }
    })

    if (existingCode) {
      return Response.json(
        { success: false, error: 'This discount code already exists for this product' },
        { status: 409 }
      )
    }

    // Create discount code
    const discountCode = await prisma.discountCode.create({
      data: {
        productId,
        submittedById: user.id,
        code: code.toUpperCase(),
        description,
        discountType: discountType || 'PERCENTAGE',
        discountValue: discountValue ? parseFloat(discountValue) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        minimumSpend: minimumSpend ? parseFloat(minimumSpend) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        isVerified: false // Requires admin verification
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        submittedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const response: ApiResponse = {
      success: true,
      data: discountCode,
      message: 'Discount code submitted successfully. It will be verified by our team.'
    }

    return Response.json(response, { status: 201 })
  } catch (error) {
    console.error('Submit discount code error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to submit discount code' },
      { status: 500 }
    )
  }
})
