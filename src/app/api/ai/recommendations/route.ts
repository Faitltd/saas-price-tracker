import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { AISpendOptimizer } from '@/services/ai-optimizer'
import { ApiResponse } from '@/types'

const aiOptimizer = new AISpendOptimizer()

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const recommendations = await aiOptimizer.generateSpendOptimizationRecommendations(user.id)

    const response: ApiResponse = {
      success: true,
      data: recommendations,
      message: 'AI recommendations generated successfully'
    }

    return Response.json(response)
  } catch (error) {
    console.error('AI recommendations error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to generate AI recommendations' },
      { status: 500 }
    )
  }
})
