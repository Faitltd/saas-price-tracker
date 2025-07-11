import { NextRequest } from 'next/server'
import { authenticateUser, generateToken, AuthError } from '@/lib/auth'
import { LoginRequest, ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return Response.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Authenticate user
    const user = await authenticateUser(email, password)
    
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
      message: 'Login successful',
    }

    return Response.json(response)
  } catch (error) {
    console.error('Login error:', error)
    
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
