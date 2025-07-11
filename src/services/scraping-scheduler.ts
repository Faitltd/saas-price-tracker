import { WebScraper } from './scraper'
import { prisma } from '@/lib/prisma'
import { ScrapingStatus } from '@prisma/client'

export class ScrapingScheduler {
  private isRunning = false
  private maxConcurrentScrapes: number

  constructor() {
    this.maxConcurrentScrapes = parseInt(process.env.MAX_CONCURRENT_SCRAPES || '5')
  }

  async startScheduledScraping(): Promise<void> {
    if (this.isRunning) {
      console.log('Scraping scheduler is already running')
      return
    }

    this.isRunning = true
    console.log('🕷️ Starting scheduled scraping...')

    try {
      // Get products that need scraping
      const productsToScrape = await prisma.saasProduct.findMany({
        where: {
          isActive: true,
          OR: [
            { lastScraped: null },
            { 
              lastScraped: {
                lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
              }
            }
          ]
        },
        include: {
          plans: {
            where: { isActive: true },
            take: 1 // Just scrape the first plan for now
          }
        },
        take: this.maxConcurrentScrapes
      })

      console.log(`Found ${productsToScrape.length} products to scrape`)

      // Process products in batches
      const scrapePromises = productsToScrape.map(product => 
        this.scrapeProductWithRetry(product)
      )

      await Promise.allSettled(scrapePromises)
      console.log('✅ Scheduled scraping completed')

    } catch (error) {
      console.error('❌ Scheduled scraping failed:', error)
    } finally {
      this.isRunning = false
    }
  }

  private async scrapeProductWithRetry(product: any, maxRetries = 3): Promise<void> {
    let attempts = 0
    
    while (attempts < maxRetries) {
      const scraper = new WebScraper()
      
      try {
        console.log(`🔍 Scraping ${product.name} (attempt ${attempts + 1})`)
        
        // Update status to in progress
        await prisma.saasProduct.update({
          where: { id: product.id },
          data: { scrapingStatus: ScrapingStatus.IN_PROGRESS }
        })

        await scraper.initialize()
        const result = await scraper.scrapeProduct(product.slug)

        if (result.success && product.plans.length > 0) {
          await scraper.updateProductPricing(product.id, product.plans[0].id, result)
          console.log(`✅ Successfully scraped ${product.name}`)
          
          // Check for price changes and create alerts
          await this.checkPriceChangesAndCreateAlerts(product.plans[0].id, result.data?.price)
          
          break // Success, exit retry loop
        } else {
          throw new Error(result.error || 'Scraping failed')
        }

      } catch (error) {
        attempts++
        console.error(`❌ Failed to scrape ${product.name} (attempt ${attempts}):`, error)
        
        if (attempts >= maxRetries) {
          // Mark as failed after all retries
          await prisma.saasProduct.update({
            where: { id: product.id },
            data: { 
              scrapingStatus: ScrapingStatus.FAILED,
              lastScraped: new Date()
            }
          })
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 5000 * attempts))
        }
      } finally {
        await scraper.close()
      }
    }
  }

  private async checkPriceChangesAndCreateAlerts(planId: string, newPrice?: number): Promise<void> {
    if (!newPrice) return

    try {
      // Get the previous price snapshot
      const previousSnapshot = await prisma.priceSnapshot.findFirst({
        where: { planId },
        orderBy: { createdAt: 'desc' },
        skip: 1 // Skip the current snapshot we just created
      })

      if (previousSnapshot && previousSnapshot.price.toNumber() !== newPrice) {
        const oldPrice = previousSnapshot.price.toNumber()
        const priceChange = newPrice - oldPrice
        const priceChangePercent = (priceChange / oldPrice) * 100

        // Get users tracking this plan
        const trackedUsers = await prisma.userTrackedPlan.findMany({
          where: { 
            planId,
            isActive: true,
            OR: [
              { alertOnPriceIncrease: true, AND: [{ NOT: { targetPrice: null } }] },
              { alertOnPriceDecrease: true, AND: [{ NOT: { targetPrice: null } }] }
            ]
          },
          include: {
            user: true,
            plan: {
              include: {
                product: true
              }
            }
          }
        })

        // Create alerts for relevant users
        for (const trackedPlan of trackedUsers) {
          const shouldAlert = (
            (priceChange > 0 && trackedPlan.alertOnPriceIncrease) ||
            (priceChange < 0 && trackedPlan.alertOnPriceDecrease)
          )

          if (shouldAlert) {
            await prisma.priceAlert.create({
              data: {
                userId: trackedPlan.userId,
                planId,
                alertType: priceChange > 0 ? 'PRICE_INCREASE' : 'PRICE_DECREASE',
                title: `Price ${priceChange > 0 ? 'Increase' : 'Decrease'} Alert: ${trackedPlan.plan.product.name}`,
                message: `The price for ${trackedPlan.plan.product.name} ${trackedPlan.plan.name} has ${priceChange > 0 ? 'increased' : 'decreased'} from $${oldPrice} to $${newPrice} (${priceChangePercent.toFixed(1)}%)`,
                oldPrice: oldPrice,
                newPrice: newPrice,
                priceChange: priceChange,
                priceChangePercent: priceChangePercent
              }
            })

            console.log(`🔔 Created price alert for user ${trackedPlan.user.email}`)
          }
        }
      }
    } catch (error) {
      console.error('Failed to check price changes:', error)
    }
  }

  async scrapeSpecificProduct(productSlug: string): Promise<{ success: boolean; message: string }> {
    const scraper = new WebScraper()
    
    try {
      const product = await prisma.saasProduct.findUnique({
        where: { slug: productSlug },
        include: {
          plans: {
            where: { isActive: true },
            take: 1
          }
        }
      })

      if (!product) {
        return { success: false, message: 'Product not found' }
      }

      if (product.plans.length === 0) {
        return { success: false, message: 'No active plans found for product' }
      }

      console.log(`🔍 Manual scraping of ${product.name}`)
      
      await scraper.initialize()
      const result = await scraper.scrapeProduct(product.slug)

      if (result.success) {
        await scraper.updateProductPricing(product.id, product.plans[0].id, result)
        await this.checkPriceChangesAndCreateAlerts(product.plans[0].id, result.data?.price)
        
        return { 
          success: true, 
          message: `Successfully scraped ${product.name}. Price: $${result.data?.price || 'N/A'}` 
        }
      } else {
        return { 
          success: false, 
          message: result.error || 'Scraping failed' 
        }
      }

    } catch (error) {
      console.error('Manual scraping failed:', error)
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }
    } finally {
      await scraper.close()
    }
  }

  isScrapingInProgress(): boolean {
    return this.isRunning
  }
}
