import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

// Get user preferences
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const preferences = await prisma.userPreference.findUnique({
      where: { userId: user.id }
    })

    const response: ApiResponse = {
      success: true,
      data: preferences || {
        emailNotifications: true,
        smsNotifications: false,
        slackNotifications: false,
        teamsNotifications: false,
        priceIncreaseAlerts: true,
        priceDecreaseAlerts: true,
        dealAlerts: true,
        weeklyDigest: true,
        phoneNumber: null,
        slackWebhookUrl: null,
        teamsWebhookUrl: null
      },
      message: 'User preferences retrieved successfully'
    }

    return Response.json(response)
  } catch (error) {
    console.error('Get preferences error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to retrieve preferences' },
      { status: 500 }
    )
  }
})

// Update user preferences
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const {
      emailNotifications,
      smsNotifications,
      slackNotifications,
      teamsNotifications,
      priceIncreaseAlerts,
      priceDecreaseAlerts,
      dealAlerts,
      weeklyDigest,
      phoneNumber,
      slackWebhookUrl,
      teamsWebhookUrl
    } = body

    const preferences = await prisma.userPreference.upsert({
      where: { userId: user.id },
      update: {
        emailNotifications: emailNotifications ?? true,
        smsNotifications: smsNotifications ?? false,
        slackNotifications: slackNotifications ?? false,
        teamsNotifications: teamsNotifications ?? false,
        priceIncreaseAlerts: priceIncreaseAlerts ?? true,
        priceDecreaseAlerts: priceDecreaseAlerts ?? true,
        dealAlerts: dealAlerts ?? true,
        weeklyDigest: weeklyDigest ?? true,
        phoneNumber: phoneNumber || null,
        slackWebhookUrl: slackWebhookUrl || null,
        teamsWebhookUrl: teamsWebhookUrl || null
      },
      create: {
        userId: user.id,
        emailNotifications: emailNotifications ?? true,
        smsNotifications: smsNotifications ?? false,
        slackNotifications: slackNotifications ?? false,
        teamsNotifications: teamsNotifications ?? false,
        priceIncreaseAlerts: priceIncreaseAlerts ?? true,
        priceDecreaseAlerts: priceDecreaseAlerts ?? true,
        dealAlerts: dealAlerts ?? true,
        weeklyDigest: weeklyDigest ?? true,
        phoneNumber: phoneNumber || null,
        slackWebhookUrl: slackWebhookUrl || null,
        teamsWebhookUrl: teamsWebhookUrl || null
      }
    })

    const response: ApiResponse = {
      success: true,
      data: preferences,
      message: 'Preferences updated successfully'
    }

    return Response.json(response)
  } catch (error) {
    console.error('Update preferences error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
})
