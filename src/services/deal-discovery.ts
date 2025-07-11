import { prisma } from '@/lib/prisma'

interface DealSource {
  name: string
  apiKey?: string
  baseUrl: string
  enabled: boolean
}

interface ExternalDeal {
  title: string
  description: string
  dealUrl: string
  originalPrice?: number
  discountedPrice?: number
  discountPercent?: number
  validFrom?: Date
  validUntil?: Date
  source: string
  sourceId?: string
}

export class DealDiscoveryService {
  private sources: DealSource[] = []

  constructor() {
    this.initializeSources()
  }

  private initializeSources() {
    // Configure deal sources
    this.sources = [
      {
        name: 'retailmenot',
        apiKey: process.env.RETAILMENOT_API_KEY,
        baseUrl: 'https://api.retailmenot.com/v1',
        enabled: !!process.env.RETAILMENOT_API_KEY
      },
      {
        name: 'manual',
        baseUrl: '',
        enabled: true // Always enabled for manual deals
      }
    ]
  }

  async discoverDeals(): Promise<void> {
    console.log('🔍 Starting deal discovery...')

    try {
      // Get all active SaaS products
      const products = await prisma.saasProduct.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, website: true }
      })

      for (const product of products) {
        await this.discoverDealsForProduct(product)
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      console.log('✅ Deal discovery completed')
    } catch (error) {
      console.error('❌ Deal discovery failed:', error)
    }
  }

  private async discoverDealsForProduct(product: any): Promise<void> {
    try {
      // Try each enabled source
      for (const source of this.sources.filter(s => s.enabled)) {
        const deals = await this.fetchDealsFromSource(source, product)
        
        for (const deal of deals) {
          await this.saveDeal(deal, product.id)
        }
      }
    } catch (error) {
      console.error(`Failed to discover deals for ${product.name}:`, error)
    }
  }

  private async fetchDealsFromSource(source: DealSource, product: any): Promise<ExternalDeal[]> {
    switch (source.name) {
      case 'retailmenot':
        return this.fetchRetailMeNotDeals(product)
      case 'manual':
        return this.getManualDeals(product)
      default:
        return []
    }
  }

  private async fetchRetailMeNotDeals(product: any): Promise<ExternalDeal[]> {
    // RetailMeNot API integration (placeholder - actual API may differ)
    try {
      const apiKey = process.env.RETAILMENOT_API_KEY
      if (!apiKey) return []

      // This is a placeholder implementation
      // Real RetailMeNot API would require proper authentication and endpoints
      const response = await fetch(`https://api.retailmenot.com/v1/coupons?merchant=${encodeURIComponent(product.name)}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.warn(`RetailMeNot API failed for ${product.name}: ${response.statusText}`)
        return []
      }

      const data = await response.json()
      
      // Transform RetailMeNot data to our format
      return data.coupons?.map((coupon: any) => ({
        title: coupon.title || `${product.name} Discount`,
        description: coupon.description || 'Special discount available',
        dealUrl: coupon.url || product.website,
        discountPercent: coupon.discount_percent,
        validFrom: coupon.start_date ? new Date(coupon.start_date) : undefined,
        validUntil: coupon.end_date ? new Date(coupon.end_date) : undefined,
        source: 'retailmenot',
        sourceId: coupon.id
      })) || []

    } catch (error) {
      console.error('RetailMeNot API error:', error)
      return []
    }
  }

  private async getManualDeals(product: any): Promise<ExternalDeal[]> {
    // Return some sample deals for demonstration
    const sampleDeals: { [key: string]: ExternalDeal[] } = {
      'slack': [
        {
          title: '25% off Slack Pro for new customers',
          description: 'Get 25% off your first year of Slack Pro when you sign up for an annual plan',
          dealUrl: 'https://slack.com/pricing',
          originalPrice: 87,
          discountedPrice: 65.25,
          discountPercent: 25,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          source: 'manual'
        }
      ],
      'notion': [
        {
          title: 'Notion Personal Pro - 2 months free',
          description: 'Get 2 months free when you upgrade to Notion Personal Pro',
          dealUrl: 'https://notion.so/pricing',
          discountPercent: 17, // 2 months free = ~17% off annual
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          source: 'manual'
        }
      ],
      'figma': [
        {
          title: 'Figma Professional - Student discount',
          description: 'Students get 50% off Figma Professional plans',
          dealUrl: 'https://figma.com/education/',
          discountPercent: 50,
          validFrom: new Date(),
          source: 'manual'
        }
      ]
    }

    return sampleDeals[product.slug] || []
  }

  private async saveDeal(deal: ExternalDeal, productId: string): Promise<void> {
    try {
      // Check if deal already exists
      const existingDeal = await prisma.deal.findFirst({
        where: {
          productId,
          source: deal.source,
          sourceId: deal.sourceId || undefined,
          title: deal.title
        }
      })

      if (existingDeal) {
        // Update existing deal
        await prisma.deal.update({
          where: { id: existingDeal.id },
          data: {
            description: deal.description,
            dealUrl: deal.dealUrl,
            originalPrice: deal.originalPrice,
            discountedPrice: deal.discountedPrice,
            discountPercent: deal.discountPercent,
            validFrom: deal.validFrom,
            validUntil: deal.validUntil,
            isActive: true
          }
        })
      } else {
        // Create new deal
        await prisma.deal.create({
          data: {
            productId,
            title: deal.title,
            description: deal.description,
            dealUrl: deal.dealUrl,
            originalPrice: deal.originalPrice,
            discountedPrice: deal.discountedPrice,
            discountPercent: deal.discountPercent,
            validFrom: deal.validFrom,
            validUntil: deal.validUntil,
            source: deal.source,
            sourceId: deal.sourceId,
            isActive: true
          }
        })
      }

      console.log(`💰 Saved deal: ${deal.title}`)
    } catch (error) {
      console.error('Failed to save deal:', error)
    }
  }

  async getActiveDeals(limit: number = 20): Promise<any[]> {
    try {
      const deals = await prisma.deal.findMany({
        where: {
          isActive: true,
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } }
          ]
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              category: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return deals
    } catch (error) {
      console.error('Failed to get active deals:', error)
      return []
    }
  }

  async getDealsForProduct(productId: string): Promise<any[]> {
    try {
      const deals = await prisma.deal.findMany({
        where: {
          productId,
          isActive: true,
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      })

      return deals
    } catch (error) {
      console.error('Failed to get deals for product:', error)
      return []
    }
  }

  async incrementDealViews(dealId: string): Promise<void> {
    try {
      await prisma.deal.update({
        where: { id: dealId },
        data: {
          viewCount: { increment: 1 }
        }
      })
    } catch (error) {
      console.error('Failed to increment deal views:', error)
    }
  }

  async incrementDealClicks(dealId: string): Promise<void> {
    try {
      await prisma.deal.update({
        where: { id: dealId },
        data: {
          clickCount: { increment: 1 }
        }
      })
    } catch (error) {
      console.error('Failed to increment deal clicks:', error)
    }
  }

  async cleanupExpiredDeals(): Promise<void> {
    try {
      const result = await prisma.deal.updateMany({
        where: {
          validUntil: { lt: new Date() },
          isActive: true
        },
        data: { isActive: false }
      })

      console.log(`🧹 Deactivated ${result.count} expired deals`)
    } catch (error) {
      console.error('Failed to cleanup expired deals:', error)
    }
  }
}
