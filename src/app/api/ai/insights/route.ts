import { NextRequest } from 'next/server'
import { AISpendOptimizer } from '@/services/ai-optimizer'
import { ApiResponse } from '@/types'

const aiOptimizer = new AISpendOptimizer()

export async function GET(request: NextRequest) {
  try {
    const insights = await aiOptimizer.generateMarketInsights()

    const response: ApiResponse = {
      success: true,
      data: insights,
      message: 'Market insights generated successfully'
    }

    return Response.json(response)
  } catch (error) {
    console.error('Market insights error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to generate market insights' },
      { status: 500 }
    )
  }
}
