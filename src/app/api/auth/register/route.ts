import { NextRequest } from 'next/server'
import { createUser, generateToken, AuthError } from '@/lib/auth'
import { RegisterRequest, ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()
    const { email, password, name } = body

    // Validate input
    if (!email || !password || !name) {
      return Response.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return Response.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Create user
    const user = await createUser(email, password, name)
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const response: ApiResponse = {
      success: true,
      data: {
        user,
        token,
      },
      message: 'Registration successful',
    }

    return Response.json(response, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof AuthError) {
      return Response.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      )
    }

    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
