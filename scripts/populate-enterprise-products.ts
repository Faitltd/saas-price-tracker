import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function populateEnterpriseProducts() {
  console.log('🏢 Populating high-value enterprise SaaS products...')

  const enterpriseProducts = [
    // Cloud Infrastructure & DevOps
    {
      name: 'AWS',
      slug: 'aws',
      description: 'Amazon Web Services - Cloud computing platform with pay-as-you-go pricing',
      website: 'https://aws.amazon.com',
      category: 'Cloud Infrastructure',
      subcategory: 'Cloud Platform',
      plans: [
        {
          name: 'Free Tier',
          slug: 'free-tier',
          description: '12 months free tier with limited usage',
          billingCycle: 'MONTHLY',
          currentPrice: 0,
          hasFreeTier: true,
          features: ['750 hours EC2', '5GB S3 storage', 'Limited Lambda calls']
        },
        {
          name: 'Pay-as-you-go',
          slug: 'pay-as-you-go',
          description: 'Usage-based pricing for all services',
          billingCycle: 'USAGE_BASED',
          currentPrice: null,
          features: ['EC2 from $0.0116/hour', 'S3 from $0.023/GB', 'Lambda $0.20/1M requests']
        }
      ]
    },
    {
      name: 'Microsoft Azure',
      slug: 'azure',
      description: 'Microsoft cloud computing platform and infrastructure',
      website: 'https://azure.microsoft.com',
      category: 'Cloud Infrastructure',
      subcategory: 'Cloud Platform',
      plans: [
        {
          name: 'Free Account',
          slug: 'free-account',
          description: '12 months free plus always-free services',
          billingCycle: 'MONTHLY',
          currentPrice: 0,
          hasFreeTier: true,
          features: ['$200 credit', '25+ always-free services', 'Popular services free for 12 months']
        },
        {
          name: 'Pay-As-You-Go',
          slug: 'pay-as-you-go',
          description: 'Pay only for what you use',
          billingCycle: 'USAGE_BASED',
          currentPrice: null,
          features: ['No upfront costs', 'Cancel anytime', 'Flexible pricing']
        }
      ]
    },
    {
      name: 'Datadog',
      slug: 'datadog',
      description: 'Monitoring and analytics platform for cloud applications',
      website: 'https://datadoghq.com',
      category: 'Cloud Infrastructure',
      subcategory: 'Monitoring',
      plans: [
        {
          name: 'Free',
          slug: 'free',
          description: 'Basic monitoring for up to 5 hosts',
          billingCycle: 'MONTHLY',
          currentPrice: 0,
          hasFreeTier: true,
          features: ['5 hosts', '1-day metric retention', 'Basic dashboards']
        },
        {
          name: 'Pro',
          slug: 'pro',
          description: 'Advanced monitoring and alerting',
          billingCycle: 'MONTHLY',
          currentPrice: 15,
          features: ['Unlimited hosts', '15-month retention', 'Advanced alerting']
        }
      ]
    },

    // CRM & Sales Automation
    {
      name: 'Salesforce',
      slug: 'salesforce',
      description: 'World\'s #1 CRM platform for sales, service, and marketing',
      website: 'https://salesforce.com',
      category: 'CRM & Sales',
      subcategory: 'CRM Platform',
      plans: [
        {
          name: 'Essentials',
          slug: 'essentials',
          description: 'Basic CRM for up to 10 users',
          billingCycle: 'MONTHLY',
          currentPrice: 25,
          features: ['Account & contact management', 'Opportunity management', 'Basic reports']
        },
        {
          name: 'Professional',
          slug: 'professional',
          description: 'Complete CRM for any size team',
          billingCycle: 'MONTHLY',
          currentPrice: 80,
          features: ['Lead management', 'Web-to-lead', 'API access', 'Custom reports']
        },
        {
          name: 'Enterprise',
          slug: 'enterprise',
          description: 'Advanced CRM with customization',
          billingCycle: 'MONTHLY',
          currentPrice: 165,
          features: ['Advanced customization', 'Workflow automation', 'Advanced analytics']
        }
      ]
    },
    {
      name: 'HubSpot',
      slug: 'hubspot',
      description: 'Inbound marketing, sales, and service platform',
      website: 'https://hubspot.com',
      category: 'CRM & Sales',
      subcategory: 'Marketing Automation',
      plans: [
        {
          name: 'Free',
          slug: 'free',
          description: 'Free CRM with basic features',
          billingCycle: 'MONTHLY',
          currentPrice: 0,
          hasFreeTier: true,
          features: ['Contact management', 'Deal tracking', 'Basic reporting']
        },
        {
          name: 'Starter',
          slug: 'starter',
          description: 'Essential marketing tools',
          billingCycle: 'MONTHLY',
          currentPrice: 45,
          features: ['Email marketing', 'Forms', 'Live chat', 'Basic automation']
        },
        {
          name: 'Professional',
          slug: 'professional',
          description: 'Advanced marketing automation',
          billingCycle: 'MONTHLY',
          currentPrice: 800,
          features: ['Marketing automation', 'Smart content', 'A/B testing']
        }
      ]
    },

    // Marketing Automation & Analytics
    {
      name: 'Mailchimp',
      slug: 'mailchimp',
      description: 'Email marketing and automation platform',
      website: 'https://mailchimp.com',
      category: 'Marketing Automation',
      subcategory: 'Email Marketing',
      plans: [
        {
          name: 'Free',
          slug: 'free',
          description: 'Basic email marketing for up to 500 contacts',
          billingCycle: 'MONTHLY',
          currentPrice: 0,
          hasFreeTier: true,
          features: ['500 contacts', '1,000 sends/month', 'Basic templates']
        },
        {
          name: 'Essentials',
          slug: 'essentials',
          description: 'Email marketing with basic automation',
          billingCycle: 'MONTHLY',
          currentPrice: 13,
          features: ['50,000 contacts', 'A/B testing', 'Custom branding']
        },
        {
          name: 'Standard',
          slug: 'standard',
          description: 'Advanced automation and insights',
          billingCycle: 'MONTHLY',
          currentPrice: 20,
          features: ['100,000 contacts', 'Behavioral targeting', 'Advanced analytics']
        }
      ]
    },
    {
      name: 'SEMrush',
      slug: 'semrush',
      description: 'All-in-one digital marketing toolkit',
      website: 'https://semrush.com',
      category: 'Marketing Automation',
      subcategory: 'SEO & Analytics',
      plans: [
        {
          name: 'Pro',
          slug: 'pro',
          description: 'Essential SEO and PPC tools',
          billingCycle: 'MONTHLY',
          currentPrice: 119.95,
          features: ['10,000 results per report', '3,000 reports per day', '5 projects']
        },
        {
          name: 'Guru',
          slug: 'guru',
          description: 'Advanced tools for agencies',
          billingCycle: 'MONTHLY',
          currentPrice: 229.95,
          features: ['30,000 results per report', '5,000 reports per day', '15 projects']
        }
      ]
    },

    // Collaboration & Productivity
    {
      name: 'Microsoft 365',
      slug: 'microsoft-365',
      description: 'Productivity apps and cloud services',
      website: 'https://microsoft.com/microsoft-365',
      category: 'Productivity',
      subcategory: 'Office Suite',
      plans: [
        {
          name: 'Business Basic',
          slug: 'business-basic',
          description: 'Web and mobile versions of Office apps',
          billingCycle: 'MONTHLY',
          currentPrice: 6,
          features: ['Web versions of Office', '1TB OneDrive', 'Exchange email']
        },
        {
          name: 'Business Standard',
          slug: 'business-standard',
          description: 'Desktop versions of Office apps',
          billingCycle: 'MONTHLY',
          currentPrice: 12.50,
          features: ['Desktop Office apps', 'Teams', 'SharePoint']
        },
        {
          name: 'Business Premium',
          slug: 'business-premium',
          description: 'Advanced security and device management',
          billingCycle: 'MONTHLY',
          currentPrice: 22,
          features: ['Advanced security', 'Device management', 'Advanced analytics']
        }
      ]
    },
    {
      name: 'Zoom',
      slug: 'zoom',
      description: 'Video conferencing and communication platform',
      website: 'https://zoom.us',
      category: 'Communication',
      subcategory: 'Video Conferencing',
      plans: [
        {
          name: 'Basic',
          slug: 'basic',
          description: 'Free plan with 40-minute limit',
          billingCycle: 'MONTHLY',
          currentPrice: 0,
          hasFreeTier: true,
          features: ['40-minute group meetings', 'Unlimited 1-on-1 meetings', '100 participants']
        },
        {
          name: 'Pro',
          slug: 'pro',
          description: 'Small teams with admin controls',
          billingCycle: 'MONTHLY',
          currentPrice: 14.99,
          features: ['30-hour group meetings', 'Cloud recording', 'Admin dashboard']
        },
        {
          name: 'Business',
          slug: 'business',
          description: 'Small/medium businesses',
          billingCycle: 'MONTHLY',
          currentPrice: 19.99,
          features: ['Admin dashboard', 'Company branding', 'Cloud recording transcripts']
        }
      ]
    },

    // Project Management
    {
      name: 'Asana',
      slug: 'asana',
      description: 'Work management platform for teams',
      website: 'https://asana.com',
      category: 'Project Management',
      subcategory: 'Task Management',
      plans: [
        {
          name: 'Basic',
          slug: 'basic',
          description: 'Free for teams up to 15 members',
          billingCycle: 'MONTHLY',
          currentPrice: 0,
          hasFreeTier: true,
          features: ['15 team members', 'Basic dashboard', 'Search & reporting']
        },
        {
          name: 'Premium',
          slug: 'premium',
          description: 'For teams that need to track progress',
          billingCycle: 'MONTHLY',
          currentPrice: 10.99,
          features: ['Timeline view', 'Custom fields', 'Advanced search']
        },
        {
          name: 'Business',
          slug: 'business',
          description: 'For teams that need to manage work',
          billingCycle: 'MONTHLY',
          currentPrice: 24.99,
          features: ['Portfolios', 'Workload', 'Advanced integrations']
        }
      ]
    },

    // Security & Identity
    {
      name: 'Okta',
      slug: 'okta',
      description: 'Identity and access management platform',
      website: 'https://okta.com',
      category: 'Security',
      subcategory: 'Identity Management',
      plans: [
        {
          name: 'Workforce Identity',
          slug: 'workforce-identity',
          description: 'Single sign-on and MFA',
          billingCycle: 'MONTHLY',
          currentPrice: 2,
          features: ['SSO', 'MFA', 'Lifecycle management']
        },
        {
          name: 'Customer Identity',
          slug: 'customer-identity',
          description: 'Customer identity and access management',
          billingCycle: 'MONTHLY',
          currentPrice: 0.05,
          features: ['Social login', 'Progressive profiling', 'Universal directory']
        }
      ]
    }
  ]

  try {
    for (const productData of enterpriseProducts) {
      const { plans, ...productInfo } = productData
      
      // Check if product already exists
      const existingProduct = await prisma.saasProduct.findUnique({
        where: { slug: productInfo.slug }
      })

      if (existingProduct) {
        console.log(`Product already exists: ${productInfo.name}`)
        continue
      }

      // Create product
      const product = await prisma.saasProduct.create({
        data: productInfo
      })

      // Create pricing plans
      for (const planData of plans) {
        await prisma.pricingPlan.create({
          data: {
            ...planData,
            productId: product.id,
            billingCycle: planData.billingCycle as any,
          }
        })
      }

      console.log(`✅ Created product: ${productInfo.name} with ${plans.length} plans`)
    }

    console.log('🎉 Enterprise SaaS products populated successfully!')
  } catch (error) {
    console.error('❌ Error populating enterprise products:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateEnterpriseProducts()
