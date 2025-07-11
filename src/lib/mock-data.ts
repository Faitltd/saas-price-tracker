// Mock data for demo purposes when database is not available

export const mockProducts = [
  {
    id: '1',
    name: 'Slack',
    slug: 'slack',
    description: 'Team collaboration and messaging platform',
    website: 'https://slack.com',
    logoUrl: 'https://logo.clearbit.com/slack.com',
    category: 'Collaboration',
    subcategory: 'Team Communication',
    isActive: true,
    plans: [
      {
        id: '1',
        name: 'Free',
        slug: 'free',
        description: 'For small teams trying out Slack',
        currentPrice: 0,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        features: ['10,000 messages', 'File sharing', 'Voice and video calls'],
        isActive: true,
        hasFreeTier: true
      },
      {
        id: '2',
        name: 'Pro',
        slug: 'pro',
        description: 'For small teams that want more',
        currentPrice: 7.25,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        features: ['Unlimited messages', 'Apps and integrations', 'Guest access'],
        isActive: true,
        hasFreeTier: false
      }
    ]
  },
  {
    id: '2',
    name: 'Notion',
    slug: 'notion',
    description: 'All-in-one workspace for notes, docs, and collaboration',
    website: 'https://notion.so',
    logoUrl: 'https://logo.clearbit.com/notion.so',
    category: 'Productivity',
    subcategory: 'Note Taking',
    isActive: true,
    plans: [
      {
        id: '3',
        name: 'Personal',
        slug: 'personal',
        description: 'For personal use',
        currentPrice: 0,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        features: ['Unlimited pages', 'Sync across devices'],
        isActive: true,
        hasFreeTier: true
      },
      {
        id: '4',
        name: 'Personal Pro',
        slug: 'personal-pro',
        description: 'For power users',
        currentPrice: 4,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        features: ['Unlimited file uploads', 'Version history'],
        isActive: true,
        hasFreeTier: false
      }
    ]
  }
];

export const mockUser = {
  id: '1',
  email: 'demo@saasprice.com',
  name: 'Demo User',
  role: 'USER'
};

export const mockAlerts = [
  {
    id: '1',
    title: 'Slack Pro Price Increase',
    message: 'Slack Pro has increased from $6.67 to $7.25 per month',
    alertType: 'PRICE_INCREASE',
    oldPrice: 6.67,
    newPrice: 7.25,
    priceChange: 0.58,
    priceChangePercent: 8.7,
    isRead: false,
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'New Notion Features Available',
    message: 'Notion has added new AI features to their Personal Pro plan',
    alertType: 'NEW_FEATURE',
    isRead: true,
    createdAt: new Date('2024-01-10')
  }
];

export const mockDeals = [
  {
    id: '1',
    title: '50% Off Slack Pro for New Teams',
    description: 'Get 50% off your first year of Slack Pro',
    dealUrl: 'https://slack.com/promo/new-teams',
    originalPrice: 87,
    discountedPrice: 43.50,
    discountPercent: 50,
    source: 'official',
    validUntil: new Date('2024-02-29'),
    isActive: true
  },
  {
    id: '2',
    title: 'Notion Student Discount',
    description: 'Free Notion Personal Pro for students',
    dealUrl: 'https://notion.so/students',
    originalPrice: 48,
    discountedPrice: 0,
    discountPercent: 100,
    source: 'official',
    isActive: true
  }
];
