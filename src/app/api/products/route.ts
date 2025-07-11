import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, PaginatedResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      isActive: true,
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get products with plans
    const [products, total] = await Promise.all([
      prisma.saasProduct.findMany({
        where,
        include: {
          plans: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            include: {
              priceHistory: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.saasProduct.count({ where }),
    ])

    const response: PaginatedResponse<typeof products[0]> = {
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }

    return Response.json(response)
  } catch (error) {
    console.error('Products API error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// Get categories for filtering
export async function OPTIONS() {
  try {
    const categories = await prisma.saasProduct.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true },
      orderBy: { category: 'asc' },
    })

    const response: ApiResponse = {
      success: true,
      data: categories.map(cat => ({
        name: cat.category,
        count: cat._count.category,
      })),
    }

    return Response.json(response)
  } catch (error) {
    console.error('Categories API error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
