import { chromium, Browser, Page, BrowserContext } from 'playwright'
import { prisma } from '@/lib/prisma'
import { ScrapingStatus } from '@prisma/client'

interface ScrapingResult {
  success: boolean
  data?: {
    price?: number
    currency?: string
    features?: string[]
    planName?: string
    billingCycle?: string
  }
  error?: string
}

interface ProxyConfig {
  server: string
  username?: string
  password?: string
}

export class WebScraper {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private proxies: ProxyConfig[] = []
  private userAgents: string[] = []

  constructor() {
    this.loadConfiguration()
  }

  private loadConfiguration() {
    // Load proxy configuration
    const proxyUrls = process.env.PROXY_URLS?.split(',').filter(url => url.trim()) || []
    this.proxies = proxyUrls.map(url => ({ server: url.trim() }))

    // Load user agents
    const userAgentString = process.env.USER_AGENTS ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    this.userAgents = userAgentString.split(',').map(ua => ua.trim()).filter(ua => ua)
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)]
  }

  private getRandomProxy(): ProxyConfig | undefined {
    if (this.proxies.length === 0) return undefined
    return this.proxies[Math.floor(Math.random() * this.proxies.length)]
  }

  private async getRandomDelay(): Promise<number> {
    const min = parseInt(process.env.SCRAPING_DELAY_MIN || '1000')
    const max = parseInt(process.env.SCRAPING_DELAY_MAX || '3000')
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  async initialize(): Promise<void> {
    try {
      const proxy = this.getRandomProxy()
      
      this.browser = await chromium.launch({
        headless: true,
        proxy: proxy ? { server: proxy.server } : undefined,
      })

      this.context = await this.browser.newContext({
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        timezoneId: 'America/New_York',
      })

      // Block unnecessary resources to speed up scraping
      await this.context.route('**/*', (route) => {
        const resourceType = route.request().resourceType()
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          route.abort()
        } else {
          route.continue()
        }
      })

    } catch (error) {
      console.error('Failed to initialize scraper:', error)
      throw error
    }
  }

  async scrapeSlackPricing(): Promise<ScrapingResult> {
    if (!this.context) throw new Error('Scraper not initialized')

    try {
      const page = await this.context.newPage()
      await page.goto('https://slack.com/pricing', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })

      // Wait for pricing elements to load
      await page.waitForSelector('[data-qa="pricing_card"]', { timeout: 10000 })

      // Extract pricing information
      const pricingData = await page.evaluate(() => {
        const plans: any[] = []
        const pricingCards = document.querySelectorAll('[data-qa="pricing_card"]')

        pricingCards.forEach((card) => {
          const planName = card.querySelector('h3')?.textContent?.trim()
          const priceElement = card.querySelector('[data-qa="price"]')
          const price = priceElement?.textContent?.match(/\$(\d+(?:\.\d{2})?)/)?.[1]
          const features = Array.from(card.querySelectorAll('li')).map(li => li.textContent?.trim()).filter(Boolean)

          if (planName) {
            plans.push({
              planName,
              price: price ? parseFloat(price) : 0,
              currency: 'USD',
              features,
              billingCycle: 'MONTHLY'
            })
          }
        })

        return plans
      })

      await page.close()
      await this.getRandomDelay()

      return {
        success: true,
        data: pricingData[0] // Return first plan for now
      }

    } catch (error) {
      console.error('Slack scraping failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async scrapeNotionPricing(): Promise<ScrapingResult> {
    if (!this.context) throw new Error('Scraper not initialized')

    try {
      const page = await this.context.newPage()
      await page.goto('https://www.notion.so/pricing', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })

      // Wait for pricing elements to load
      await page.waitForSelector('[data-testid="pricing-plan"]', { timeout: 10000 })

      const pricingData = await page.evaluate(() => {
        const plans: any[] = []
        const pricingCards = document.querySelectorAll('[data-testid="pricing-plan"]')

        pricingCards.forEach((card) => {
          const planName = card.querySelector('h3')?.textContent?.trim()
          const priceText = card.querySelector('[data-testid="price"]')?.textContent
          const price = priceText?.match(/\$(\d+)/)?.[1]
          const features = Array.from(card.querySelectorAll('li')).map(li => li.textContent?.trim()).filter(Boolean)

          if (planName) {
            plans.push({
              planName,
              price: price ? parseFloat(price) : 0,
              currency: 'USD',
              features,
              billingCycle: 'MONTHLY'
            })
          }
        })

        return plans
      })

      await page.close()
      await this.getRandomDelay()

      return {
        success: true,
        data: pricingData[0]
      }

    } catch (error) {
      console.error('Notion scraping failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async scrapeFigmaPricing(): Promise<ScrapingResult> {
    if (!this.context) throw new Error('Scraper not initialized')

    try {
      const page = await this.context.newPage()
      await page.goto('https://www.figma.com/pricing/', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })

      // Wait for pricing elements to load
      await page.waitForSelector('[data-testid="pricing-card"]', { timeout: 10000 })

      const pricingData = await page.evaluate(() => {
        const plans: any[] = []
        const pricingCards = document.querySelectorAll('[data-testid="pricing-card"]')

        pricingCards.forEach((card) => {
          const planName = card.querySelector('h2')?.textContent?.trim()
          const priceElement = card.querySelector('[data-testid="price-amount"]')
          const price = priceElement?.textContent?.match(/\$(\d+)/)?.[1]
          const features = Array.from(card.querySelectorAll('li')).map(li => li.textContent?.trim()).filter(Boolean)

          if (planName) {
            plans.push({
              planName,
              price: price ? parseFloat(price) : 0,
              currency: 'USD',
              features,
              billingCycle: 'MONTHLY'
            })
          }
        })

        return plans
      })

      await page.close()
      await this.getRandomDelay()

      return {
        success: true,
        data: pricingData[0]
      }

    } catch (error) {
      console.error('Figma scraping failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async scrapeProduct(productSlug: string): Promise<ScrapingResult> {
    switch (productSlug) {
      case 'slack':
        return this.scrapeSlackPricing()
      case 'notion':
        return this.scrapeNotionPricing()
      case 'figma':
        return this.scrapeFigmaPricing()
      default:
        return {
          success: false,
          error: `No scraper configured for product: ${productSlug}`
        }
    }
  }

  async updateProductPricing(productId: string, planId: string, scrapingResult: ScrapingResult): Promise<void> {
    try {
      if (scrapingResult.success && scrapingResult.data) {
        const { price, currency, features } = scrapingResult.data

        // Update the pricing plan
        await prisma.pricingPlan.update({
          where: { id: planId },
          data: {
            currentPrice: price,
            currency: currency || 'USD',
            features: features || [],
          }
        })

        // Create price snapshot
        if (price !== undefined) {
          await prisma.priceSnapshot.create({
            data: {
              planId,
              price,
              currency: currency || 'USD',
              features: features || [],
              source: 'web_scraping'
            }
          })
        }

        // Update product scraping status
        await prisma.saasProduct.update({
          where: { id: productId },
          data: {
            scrapingStatus: ScrapingStatus.SUCCESS,
            lastScraped: new Date()
          }
        })

      } else {
        // Update product scraping status to failed
        await prisma.saasProduct.update({
          where: { id: productId },
          data: {
            scrapingStatus: ScrapingStatus.FAILED,
            lastScraped: new Date()
          }
        })
      }
    } catch (error) {
      console.error('Failed to update product pricing:', error)
      throw error
    }
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close()
      this.context = null
    }
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}
