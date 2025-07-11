import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth'
import { ScrapingScheduler } from '@/services/scraping-scheduler'
import { ApiResponse } from '@/types'

const scheduler = new ScrapingScheduler()

// Trigger manual scraping (admin only)
export const POST = requireRole(['ADMIN'])(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { productSlug, runAll } = body

    if (scheduler.isScrapingInProgress()) {
      return Response.json(
        { success: false, error: 'Scraping is already in progress' },
        { status: 409 }
      )
    }

    let result: any

    if (productSlug) {
      // Scrape specific product
      result = await scheduler.scrapeSpecificProduct(productSlug)
    } else if (runAll) {
      // Trigger full scraping run
      scheduler.startScheduledScraping() // Run in background
      result = { success: true, message: 'Scheduled scraping started in background' }
    } else {
      return Response.json(
        { success: false, error: 'Either productSlug or runAll must be specified' },
        { status: 400 }
      )
    }

    const response: ApiResponse = {
      success: result.success,
      message: result.message,
      data: result.data
    }

    return Response.json(response)
  } catch (error) {
    console.error('Scraping trigger error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to trigger scraping' },
      { status: 500 }
    )
  }
})

// Get scraping status
export const GET = requireRole(['ADMIN'])(async (request: NextRequest) => {
  try {
    const isRunning = scheduler.isScrapingInProgress()
    
    const response: ApiResponse = {
      success: true,
      data: {
        isRunning,
        status: isRunning ? 'in_progress' : 'idle'
      }
    }

    return Response.json(response)
  } catch (error) {
    console.error('Scraping status error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to get scraping status' },
      { status: 500 }
    )
  }
})
