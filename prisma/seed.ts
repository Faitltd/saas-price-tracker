import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@saasprice.com' },
    update: {},
    create: {
      email: 'admin@saasprice.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isEmailVerified: true,
    },
  })

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 12)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@saasprice.com' },
    update: {},
    create: {
      email: 'demo@saasprice.com',
      password: demoPassword,
      name: 'Demo User',
      role: 'USER',
      isEmailVerified: true,
    },
  })

  // Create user preferences for demo user
  await prisma.userPreference.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      emailNotifications: true,
      priceIncreaseAlerts: true,
      priceDecreaseAlerts: true,
      dealAlerts: true,
    },
  })

  // Sample SaaS products
  const products = [
    {
      name: 'Slack',
      slug: 'slack',
      description: 'Team collaboration and messaging platform',
      website: 'https://slack.com',
      category: 'Communication',
      subcategory: 'Team Chat',
      plans: [
        {
          name: 'Free',
          slug: 'free',
          description: 'For small teams trying Slack',
          billingCycle: 'MONTHLY',
          currentPrice: 0,
          hasFreeTier: true,
          features: ['10,000 messages', 'Basic integrations', '1-on-1 video calls'],
        },
        {
          name: 'Pro',
          slug: 'pro',
          description: 'For small to medium businesses',
          billingCycle: 'MONTHLY',
          currentPrice: 7.25,
          features: ['Unlimited messages', 'Advanced integrations', 'Group video calls'],
        },
        {
          name: 'Business+',
          slug: 'business-plus',
          description: 'For larger businesses',
          billingCycle: 'MONTHLY',
          currentPrice: 12.50,
          features: ['Everything in Pro', 'Advanced security', 'Compliance features'],
        },
      ],
    },
    {
      name: 'Notion',
      slug: 'notion',
      description: 'All-in-one workspace for notes, docs, and collaboration',
      website: 'https://notion.so',
      category: 'Productivity',
      subcategory: 'Note Taking',
      plans: [
        {
          name: 'Personal',
          slug: 'personal',
          description: 'For personal use',
          billingCycle: 'MONTHLY',
          currentPrice: 0,
          hasFreeTier: true,
          features: ['Unlimited pages', 'Basic blocks', 'Personal use only'],
        },
        {
          name: 'Personal Pro',
          slug: 'personal-pro',
          description: 'For power users',
          billingCycle: 'MONTHLY',
          currentPrice: 4,
          features: ['Unlimited file uploads', 'Version history', 'Advanced blocks'],
        },
        {
          name: 'Team',
          slug: 'team',
          description: 'For teams and collaboration',
          billingCycle: 'MONTHLY',
          currentPrice: 8,
          features: ['Collaborative workspace', 'Admin tools', 'Advanced permissions'],
        },
      ],
    },
    {
      name: 'Figma',
      slug: 'figma',
      description: 'Collaborative design and prototyping tool',
      website: 'https://figma.com',
      category: 'Design',
      subcategory: 'UI/UX Design',
      plans: [
        {
          name: 'Starter',
          slug: 'starter',
          description: 'For individuals getting started',
          billingCycle: 'MONTHLY',
          currentPrice: 0,
          hasFreeTier: true,
          features: ['3 Figma files', '3 FigJam files', 'Unlimited personal files'],
        },
        {
          name: 'Professional',
          slug: 'professional',
          description: 'For professionals',
          billingCycle: 'MONTHLY',
          currentPrice: 12,
          features: ['Unlimited Figma files', 'Version history', 'Team libraries'],
        },
        {
          name: 'Organization',
          slug: 'organization',
          description: 'For organizations',
          billingCycle: 'MONTHLY',
          currentPrice: 45,
          features: ['Everything in Professional', 'Advanced admin', 'Design systems'],
        },
      ],
    },
  ]

  // Create products and plans
  for (const productData of products) {
    const { plans, ...productInfo } = productData
    
    const product = await prisma.saasProduct.upsert({
      where: { slug: productInfo.slug },
      update: {},
      create: productInfo,
    })

    // Create pricing plans
    for (const planData of plans) {
      await prisma.pricingPlan.upsert({
        where: { 
          productId_slug: {
            productId: product.id,
            slug: planData.slug,
          }
        },
        update: {},
        create: {
          ...planData,
          productId: product.id,
          billingCycle: planData.billingCycle as any,
        },
      })
    }
  }

  // Create some sample deals
  const slackProduct = await prisma.saasProduct.findUnique({
    where: { slug: 'slack' }
  })

  if (slackProduct) {
    await prisma.deal.upsert({
      where: { id: 'sample-deal-1' },
      update: {},
      create: {
        id: 'sample-deal-1',
        productId: slackProduct.id,
        title: '25% off Slack Pro for new customers',
        description: 'Get 25% off your first year of Slack Pro',
        dealUrl: 'https://slack.com/promo/new-customer',
        originalPrice: 87,
        discountedPrice: 65.25,
        discountPercent: 25,
        source: 'official',
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    })
  }

  // Create sample community review
  const notionProduct = await prisma.saasProduct.findUnique({
    where: { slug: 'notion' }
  })

  if (notionProduct) {
    await prisma.communityReview.upsert({
      where: { id: 'sample-review-1' },
      update: {},
      create: {
        id: 'sample-review-1',
        userId: demoUser.id,
        productId: notionProduct.id,
        rating: 5,
        title: 'Great all-in-one workspace',
        content: 'Notion has completely transformed how I organize my work and personal projects. The flexibility is unmatched!',
        isApproved: true,
      },
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Admin user: admin@saasprice.com / admin123`)
  console.log(`👤 Demo user: demo@saasprice.com / demo123`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
