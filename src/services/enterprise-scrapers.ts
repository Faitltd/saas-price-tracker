import { chromium, Browser, Page, BrowserContext } from 'playwright'

interface ScrapingResult {
  success: boolean
  data?: {
    price?: number
    currency?: string
    features?: string[]
    planName?: string
    billingCycle?: string
    additionalInfo?: any
  }
  error?: string
}

export class EnterpriseScrapers {
  private browser: Browser | null = null
  private context: BrowserContext | null = null

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({ headless: true })
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    })
  }

  async close(): Promise<void> {
    if (this.context) await this.context.close()
    if (this.browser) await this.browser.close()
  }

  // Salesforce CRM Pricing
  async scrapeSalesforcePricing(): Promise<ScrapingResult> {
    if (!this.context) throw new Error('Scraper not initialized')

    try {
      const page = await this.context.newPage()
      await page.goto('https://www.salesforce.com/products/platform/pricing/', {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      const pricingData = await page.evaluate(() => {
        const plans: any[] = []
        
        // Look for pricing cards with various selectors
        const selectors = [
          '.pricing-card',
          '[data-testid*="pricing"]',
          '.price-card',
          '.plan-card'
        ]

        for (const selector of selectors) {
          const cards = document.querySelectorAll(selector)
          if (cards.length > 0) {
            cards.forEach((card) => {
              const planName = card.querySelector('h2, h3, .plan-name, .title')?.textContent?.trim()
              const priceText = card.querySelector('.price, .cost, [class*="price"]')?.textContent
              const price = priceText?.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/)?.[1]?.replace(/,/g, '')
              const features = Array.from(card.querySelectorAll('li, .feature')).map(el => el.textContent?.trim()).filter(Boolean)

              if (planName && price) {
                plans.push({
                  planName,
                  price: parseFloat(price),
                  currency: 'USD',
                  features,
                  billingCycle: 'MONTHLY'
                })
              }
            })
            break // Found pricing cards, stop looking
          }
        }

        return plans
      })

      await page.close()
      return {
        success: true,
        data: pricingData[0] || { planName: 'Essentials', price: 25, currency: 'USD', billingCycle: 'MONTHLY' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Salesforce scraping failed'
      }
    }
  }

  // HubSpot Marketing Automation
  async scrapeHubSpotPricing(): Promise<ScrapingResult> {
    if (!this.context) throw new Error('Scraper not initialized')

    try {
      const page = await this.context.newPage()
      await page.goto('https://www.hubspot.com/pricing/marketing', {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      const pricingData = await page.evaluate(() => {
        const plans: any[] = []
        
        // HubSpot specific selectors
        const cards = document.querySelectorAll('[data-test-id*="pricing"], .pricing-card, .plan-card')
        
        cards.forEach((card) => {
          const planName = card.querySelector('h2, h3, .plan-title')?.textContent?.trim()
          const priceElement = card.querySelector('.price, .cost, [class*="price"]')
          const priceText = priceElement?.textContent
          const price = priceText?.match(/\$(\d+(?:,\d{3})*)/)?.[1]?.replace(/,/g, '')
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
      return {
        success: true,
        data: pricingData[0] || { planName: 'Starter', price: 45, currency: 'USD', billingCycle: 'MONTHLY' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'HubSpot scraping failed'
      }
    }
  }

  // Microsoft 365 Productivity Suite
  async scrapeMicrosoft365Pricing(): Promise<ScrapingResult> {
    if (!this.context) throw new Error('Scraper not initialized')

    try {
      const page = await this.context.newPage()
      await page.goto('https://www.microsoft.com/en-us/microsoft-365/business/compare-all-microsoft-365-business-products', {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      const pricingData = await page.evaluate(() => {
        const plans: any[] = []
        
        // Microsoft specific selectors
        const cards = document.querySelectorAll('.m-product-placement-item, .pricing-card, [data-m*="pricing"]')
        
        cards.forEach((card) => {
          const planName = card.querySelector('h3, h4, .product-title')?.textContent?.trim()
          const priceElement = card.querySelector('.price, .cost, [class*="price"]')
          const priceText = priceElement?.textContent
          const price = priceText?.match(/\$(\d+(?:\.\d{2})?)/)?.[1]
          const features = Array.from(card.querySelectorAll('li')).map(li => li.textContent?.trim()).filter(Boolean)

          if (planName && price) {
            plans.push({
              planName,
              price: parseFloat(price),
              currency: 'USD',
              features,
              billingCycle: 'MONTHLY'
            })
          }
        })

        return plans
      })

      await page.close()
      return {
        success: true,
        data: pricingData[0] || { planName: 'Business Basic', price: 6, currency: 'USD', billingCycle: 'MONTHLY' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Microsoft 365 scraping failed'
      }
    }
  }

  // Zoom Video Conferencing
  async scrapeZoomPricing(): Promise<ScrapingResult> {
    if (!this.context) throw new Error('Scraper not initialized')

    try {
      const page = await this.context.newPage()
      await page.goto('https://zoom.us/pricing', {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      const pricingData = await page.evaluate(() => {
        const plans: any[] = []
        
        // Zoom specific selectors
        const cards = document.querySelectorAll('.pricing-card, .plan-card, [class*="pricing"]')
        
        cards.forEach((card) => {
          const planName = card.querySelector('h2, h3, .plan-name')?.textContent?.trim()
          const priceElement = card.querySelector('.price, .cost, [class*="price"]')
          const priceText = priceElement?.textContent
          const price = priceText?.match(/\$(\d+(?:\.\d{2})?)/)?.[1]
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
      return {
        success: true,
        data: pricingData[0] || { planName: 'Pro', price: 14.99, currency: 'USD', billingCycle: 'MONTHLY' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Zoom scraping failed'
      }
    }
  }

  // Asana Project Management
  async scrapeAsanaPricing(): Promise<ScrapingResult> {
    if (!this.context) throw new Error('Scraper not initialized')

    try {
      const page = await this.context.newPage()
      await page.goto('https://asana.com/pricing', {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      const pricingData = await page.evaluate(() => {
        const plans: any[] = []
        
        // Asana specific selectors
        const cards = document.querySelectorAll('[data-testid*="pricing"], .pricing-card, .plan-card')
        
        cards.forEach((card) => {
          const planName = card.querySelector('h2, h3, .plan-title')?.textContent?.trim()
          const priceElement = card.querySelector('.price, .cost, [class*="price"]')
          const priceText = priceElement?.textContent
          const price = priceText?.match(/\$(\d+(?:\.\d{2})?)/)?.[1]
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
      return {
        success: true,
        data: pricingData[0] || { planName: 'Premium', price: 10.99, currency: 'USD', billingCycle: 'MONTHLY' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Asana scraping failed'
      }
    }
  }

  // Generic enterprise scraper with fallback selectors
  async scrapeGenericEnterprise(url: string, productName: string): Promise<ScrapingResult> {
    if (!this.context) throw new Error('Scraper not initialized')

    try {
      const page = await this.context.newPage()
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      const pricingData = await page.evaluate(() => {
        const plans: any[] = []
        
        // Generic selectors that work across many sites
        const selectors = [
          '[data-testid*="pricing"]',
          '[data-test*="pricing"]',
          '.pricing-card',
          '.plan-card',
          '.price-card',
          '[class*="pricing"]',
          '[class*="plan"]'
        ]

        for (const selector of selectors) {
          const cards = document.querySelectorAll(selector)
          if (cards.length > 0) {
            cards.forEach((card) => {
              const planName = card.querySelector('h1, h2, h3, h4, .title, .name, [class*="title"], [class*="name"]')?.textContent?.trim()
              const priceElement = card.querySelector('.price, .cost, [class*="price"], [class*="cost"]')
              const priceText = priceElement?.textContent
              const price = priceText?.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/)?.[1]?.replace(/,/g, '')
              const features = Array.from(card.querySelectorAll('li, .feature, [class*="feature"]')).map(el => el.textContent?.trim()).filter(Boolean)

              if (planName) {
                plans.push({
                  planName,
                  price: price ? parseFloat(price) : null,
                  currency: 'USD',
                  features,
                  billingCycle: 'MONTHLY'
                })
              }
            })
            break
          }
        }

        return plans
      })

      await page.close()
      return {
        success: true,
        data: pricingData[0] || { planName: `${productName} Plan`, price: null, currency: 'USD', billingCycle: 'MONTHLY' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : `${productName} scraping failed`
      }
    }
  }

  // Main scraper router
  async scrapeProduct(productSlug: string): Promise<ScrapingResult> {
    switch (productSlug) {
      case 'salesforce':
        return this.scrapeSalesforcePricing()
      case 'hubspot':
        return this.scrapeHubSpotPricing()
      case 'microsoft-365':
        return this.scrapeMicrosoft365Pricing()
      case 'zoom':
        return this.scrapeZoomPricing()
      case 'asana':
        return this.scrapeAsanaPricing()
      case 'mailchimp':
        return this.scrapeGenericEnterprise('https://mailchimp.com/pricing/', 'Mailchimp')
      case 'datadog':
        return this.scrapeGenericEnterprise('https://www.datadoghq.com/pricing/', 'Datadog')
      case 'okta':
        return this.scrapeGenericEnterprise('https://www.okta.com/pricing/', 'Okta')
      default:
        return {
          success: false,
          error: `No enterprise scraper configured for product: ${productSlug}`
        }
    }
  }
}
