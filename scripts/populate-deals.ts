import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function populateDeals() {
  console.log('🔍 Populating sample deals...')

  try {
    // Get existing products
    const products = await prisma.saasProduct.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true }
    })

    const deals = [
      {
        productSlug: 'slack',
        title: '25% off Slack Pro for new customers',
        description: 'Get 25% off your first year of Slack Pro when you sign up for an annual plan. Perfect for growing teams.',
        dealUrl: 'https://slack.com/pricing',
        originalPrice: 87,
        discountedPrice: 65.25,
        discountPercent: 25,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        source: 'official'
      },
      {
        productSlug: 'slack',
        title: 'Slack Business+ - Free trial extended',
        description: 'Try Slack Business+ free for 30 days instead of the usual 14-day trial.',
        dealUrl: 'https://slack.com/pricing',
        discountPercent: 50,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        source: 'manual'
      },
      {
        productSlug: 'notion',
        title: 'Notion Personal Pro - 2 months free',
        description: 'Get 2 months free when you upgrade to Notion Personal Pro annual plan.',
        dealUrl: 'https://notion.so/pricing',
        originalPrice: 48,
        discountedPrice: 40,
        discountPercent: 17,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
        source: 'manual'
      },
      {
        productSlug: 'notion',
        title: 'Notion Team Plan - Early bird pricing',
        description: 'Lock in early bird pricing for Notion Team plans. Save 20% for the first year.',
        dealUrl: 'https://notion.so/pricing',
        discountPercent: 20,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        source: 'official'
      },
      {
        productSlug: 'figma',
        title: 'Figma Professional - Student discount',
        description: 'Students and educators get 50% off Figma Professional plans with valid .edu email.',
        dealUrl: 'https://figma.com/education/',
        discountPercent: 50,
        validFrom: new Date(),
        source: 'official'
      },
      {
        productSlug: 'figma',
        title: 'Figma Organization - Startup credits',
        description: 'Qualified startups can get up to $5,000 in Figma credits through our startup program.',
        dealUrl: 'https://figma.com/startups/',
        originalPrice: 540,
        discountedPrice: 0,
        discountPercent: 100,
        validFrom: new Date(),
        source: 'partner'
      }
    ]

    for (const dealData of deals) {
      const product = products.find(p => p.slug === dealData.productSlug)
      if (!product) {
        console.warn(`Product not found: ${dealData.productSlug}`)
        continue
      }

      // Check if deal already exists
      const existingDeal = await prisma.deal.findFirst({
        where: {
          productId: product.id,
          title: dealData.title
        }
      })

      if (existingDeal) {
        console.log(`Deal already exists: ${dealData.title}`)
        continue
      }

      // Create new deal
      await prisma.deal.create({
        data: {
          productId: product.id,
          title: dealData.title,
          description: dealData.description,
          dealUrl: dealData.dealUrl,
          originalPrice: dealData.originalPrice,
          discountedPrice: dealData.discountedPrice,
          discountPercent: dealData.discountPercent,
          validFrom: dealData.validFrom,
          validUntil: dealData.validUntil,
          source: dealData.source,
          isActive: true
        }
      })

      console.log(`✅ Created deal: ${dealData.title}`)
    }

    console.log('🎉 Sample deals populated successfully!')
  } catch (error) {
    console.error('❌ Error populating deals:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateDeals()
