import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function populateEnterpriseDeals() {
  console.log('💰 Populating high-value enterprise deals...')

  try {
    // Get existing products
    const products = await prisma.saasProduct.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true }
    })

    const enterpriseDeals = [
      // Cloud Infrastructure Deals
      {
        productSlug: 'aws',
        title: 'AWS Activate - Up to $100,000 in credits',
        description: 'Startups can get up to $100,000 in AWS credits through the AWS Activate program. Includes technical support and training.',
        dealUrl: 'https://aws.amazon.com/activate/',
        originalPrice: 100000,
        discountedPrice: 0,
        discountPercent: 100,
        validFrom: new Date(),
        source: 'official'
      },
      {
        productSlug: 'azure',
        title: 'Azure for Startups - $120,000 in credits',
        description: 'Microsoft for Startups provides up to $120,000 in Azure credits over 2 years, plus technical support.',
        dealUrl: 'https://startups.microsoft.com/',
        originalPrice: 120000,
        discountedPrice: 0,
        discountPercent: 100,
        validFrom: new Date(),
        source: 'official'
      },
      {
        productSlug: 'datadog',
        title: 'Datadog for Startups - 50% off for 2 years',
        description: 'Eligible startups get 50% off Datadog Pro and Enterprise plans for up to 2 years.',
        dealUrl: 'https://www.datadoghq.com/startups/',
        discountPercent: 50,
        validFrom: new Date(),
        source: 'partner'
      },

      // CRM & Sales Deals
      {
        productSlug: 'salesforce',
        title: 'Salesforce Nonprofit Cloud - 10 free licenses',
        description: 'Qualified nonprofits get 10 free Salesforce licenses plus discounted additional licenses.',
        dealUrl: 'https://www.salesforce.org/nonprofit/',
        originalPrice: 800,
        discountedPrice: 0,
        discountPercent: 100,
        validFrom: new Date(),
        source: 'nonprofit'
      },
      {
        productSlug: 'salesforce',
        title: 'Salesforce Trailblazer Community - Free training',
        description: 'Free access to Salesforce training modules worth $3,000+ through Trailhead.',
        dealUrl: 'https://trailhead.salesforce.com/',
        originalPrice: 3000,
        discountedPrice: 0,
        discountPercent: 100,
        validFrom: new Date(),
        source: 'official'
      },
      {
        productSlug: 'hubspot',
        title: 'HubSpot for Startups - 90% off for 1 year',
        description: 'Eligible startups get 90% off HubSpot Software in year one, 50% off in year two.',
        dealUrl: 'https://www.hubspot.com/startups',
        discountPercent: 90,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        source: 'startup'
      },

      // Marketing & Analytics Deals
      {
        productSlug: 'mailchimp',
        title: 'Mailchimp Free Plan - Permanent free tier',
        description: 'Send up to 1,000 emails per month to 500 contacts completely free, forever.',
        dealUrl: 'https://mailchimp.com/pricing/',
        originalPrice: 13,
        discountedPrice: 0,
        discountPercent: 100,
        validFrom: new Date(),
        source: 'official'
      },
      {
        productSlug: 'semrush',
        title: 'SEMrush Pro - 7-day free trial',
        description: 'Try SEMrush Pro free for 7 days. Full access to keyword research, competitor analysis, and more.',
        dealUrl: 'https://www.semrush.com/pricing/',
        originalPrice: 119.95,
        discountedPrice: 0,
        discountPercent: 100,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        source: 'trial'
      },

      // Productivity & Collaboration Deals
      {
        productSlug: 'microsoft-365',
        title: 'Microsoft 365 Business - First month free',
        description: 'Get your first month of Microsoft 365 Business Standard free when you sign up for annual billing.',
        dealUrl: 'https://www.microsoft.com/microsoft-365/business',
        originalPrice: 12.50,
        discountedPrice: 0,
        discountPercent: 100,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        source: 'official'
      },
      {
        productSlug: 'zoom',
        title: 'Zoom Pro - 30% off annual plans',
        description: 'Save 30% on Zoom Pro and Business plans when you pay annually instead of monthly.',
        dealUrl: 'https://zoom.us/pricing',
        originalPrice: 179.88, // 14.99 * 12
        discountedPrice: 125.93, // 30% off
        discountPercent: 30,
        validFrom: new Date(),
        source: 'annual'
      },

      // Project Management Deals
      {
        productSlug: 'asana',
        title: 'Asana Premium - 30-day free trial',
        description: 'Try Asana Premium free for 30 days. Includes timeline view, custom fields, and advanced search.',
        dealUrl: 'https://asana.com/pricing',
        originalPrice: 10.99,
        discountedPrice: 0,
        discountPercent: 100,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        source: 'trial'
      },

      // Security & Identity Deals
      {
        productSlug: 'okta',
        title: 'Okta Workforce Identity - Free for up to 100 users',
        description: 'Get Okta Workforce Identity free for up to 100 monthly active users. Perfect for small businesses.',
        dealUrl: 'https://www.okta.com/pricing/',
        originalPrice: 200, // 100 users * $2
        discountedPrice: 0,
        discountPercent: 100,
        validFrom: new Date(),
        source: 'freemium'
      }
    ]

    for (const dealData of enterpriseDeals) {
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

      console.log(`✅ Created enterprise deal: ${dealData.title}`)
    }

    console.log('🎉 Enterprise deals populated successfully!')
  } catch (error) {
    console.error('❌ Error populating enterprise deals:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateEnterpriseDeals()
