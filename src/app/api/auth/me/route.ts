import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { ApiResponse } from '@/types'

export const GET = requireAuth(async (request: NextRequest, user) => {
  const response: ApiResponse = {
    success: true,
    data: user,
    message: 'User profile retrieved successfully',
  }

  return Response.json(response)
})
