import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

// Update user profile
export const PATCH = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const { name, email } = body

    // Validate input
    if (email && email !== user.email) {
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (existingUser && existingUser.id !== user.id) {
        return Response.json(
          { success: false, error: 'Email already in use' },
          { status: 409 }
        )
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(email && { email: email.toLowerCase() })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        isEmailVerified: true
      }
    })

    const response: ApiResponse = {
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    }

    return Response.json(response)
  } catch (error) {
    console.error('Update profile error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
})
