import { NextRequest } from 'next/server'
import { mockProducts } from '@/lib/mock-data'
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

    // Filter mock products
    let filteredProducts = mockProducts

    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category)
    }

    if (search) {
      filteredProducts = filteredProducts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    const total = filteredProducts.length
    const products = filteredProducts.slice(skip, skip + limit)

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
    const categories = Array.from(new Set(mockProducts.map(p => p.category)))
      .map(category => ({
        name: category,
        count: mockProducts.filter(p => p.category === category).length,
      }))

    const response: ApiResponse = {
      success: true,
      data: categories,
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
