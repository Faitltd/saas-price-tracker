import { NextRequest } from 'next/server'
import { DealDiscoveryService } from '@/services/deal-discovery'
import { ApiResponse, PaginatedResponse } from '@/types'

const dealService = new DealDiscoveryService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const productId = searchParams.get('productId')

    let deals: any[]

    if (productId) {
      // Get deals for specific product
      deals = await dealService.getDealsForProduct(productId)
      
      const response: ApiResponse = {
        success: true,
        data: deals,
        message: 'Product deals retrieved successfully'
      }

      return Response.json(response)
    } else {
      // Get all active deals with pagination
      const allDeals = await dealService.getActiveDeals(limit * page)
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      deals = allDeals.slice(startIndex, endIndex)

      const response: PaginatedResponse<typeof deals[0]> = {
        success: true,
        data: deals,
        pagination: {
          page,
          limit,
          total: allDeals.length,
          totalPages: Math.ceil(allDeals.length / limit)
        }
      }

      return Response.json(response)
    }
  } catch (error) {
    console.error('Deals API error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to retrieve deals' },
      { status: 500 }
    )
  }
}
