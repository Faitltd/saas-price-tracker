// Re-export Prisma types
export type {
  User,
  UserPreference,
  SaasProduct,
  PricingPlan,
  PriceSnapshot,
  UserSubscription,
  UserTrackedPlan,
  PriceAlert,
  Notification,
  CommunityReview,
  SharedDiscount,
  Deal,
  SaasAlternative,
  ApiLog,
  SystemConfig,
  UserRole,
  BillingCycle,
  ScrapingStatus,
  AlertType,
  NotificationType,
  NotificationStatus,
} from '@prisma/client'

// Custom types for API responses
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Authentication types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: string
}

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

// SaaS Product types
export interface SaasProductWithPlans {
  id: string
  name: string
  slug: string
  description: string | null
  website: string
  logoUrl: string | null
  category: string
  subcategory: string | null
  plans: PricingPlanWithHistory[]
}

export interface PricingPlanWithHistory {
  id: string
  name: string
  slug: string
  description: string | null
  features: any
  billingCycle: string
  currentPrice: number | null
  currency: string
  freeTrialDays: number | null
  hasFreeTier: boolean
  priceHistory: PriceSnapshot[]
}

// Price tracking types
export interface PriceChange {
  planId: string
  planName: string
  productName: string
  oldPrice: number
  newPrice: number
  change: number
  changePercent: number
  changeType: 'increase' | 'decrease'
  detectedAt: Date
}

// AI Recommendation types
export interface SpendOptimizationRecommendation {
  type: 'downgrade' | 'alternative' | 'bundle' | 'cancel'
  title: string
  description: string
  potentialSavings: number
  confidence: number
  actionUrl?: string
  productId?: string
  planId?: string
}

export interface AIInsight {
  id: string
  type: 'spend_optimization' | 'market_trend' | 'deal_alert'
  title: string
  description: string
  data: any
  confidence: number
  createdAt: Date
}

// Deal types
export interface DealWithProduct {
  id: string
  title: string
  description: string
  dealUrl: string
  originalPrice: number | null
  discountedPrice: number | null
  discountPercent: number | null
  source: string
  validFrom: Date | null
  validUntil: Date | null
  product: {
    id: string
    name: string
    logoUrl: string | null
  } | null
}

// Community types
export interface ReviewWithUser {
  id: string
  rating: number
  title: string
  content: string
  helpfulVotes: number
  totalVotes: number
  createdAt: Date
  user: {
    name: string | null
    avatar: string | null
  }
}

// Notification types
export interface NotificationPreferences {
  email: boolean
  sms: boolean
  slack: boolean
  teams: boolean
  push: boolean
}

// Dashboard types
export interface DashboardStats {
  totalTrackedProducts: number
  totalSubscriptions: number
  monthlySpend: number
  potentialSavings: number
  recentAlerts: number
}

export interface MarketTrend {
  category: string
  averagePriceChange: number
  trendDirection: 'up' | 'down' | 'stable'
  timeframe: string
}

// Search and filter types
export interface ProductSearchFilters {
  category?: string
  priceRange?: {
    min: number
    max: number
  }
  billingCycle?: string
  hasFreeTier?: boolean
  features?: string[]
}

export interface SearchResult {
  products: SaasProductWithPlans[]
  total: number
  filters: {
    categories: Array<{ name: string; count: number }>
    priceRanges: Array<{ range: string; count: number }>
    billingCycles: Array<{ cycle: string; count: number }>
  }
}

// Webhook types
export interface WebhookPayload {
  type: string
  data: any
  timestamp: Date
  signature?: string
}

// External API types
export interface G2CrowdProduct {
  id: string
  name: string
  description: string
  category: string
  rating: number
  reviewCount: number
  pricing: any
}

export interface CapterraProduct {
  id: string
  name: string
  description: string
  category: string
  features: string[]
  pricing: any
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
  statusCode?: number
}

// Configuration types
export interface AppConfig {
  features: {
    communityFeatures: boolean
    aiRecommendations: boolean
    dealDiscovery: boolean
    subscriptionIntegration: boolean
  }
  limits: {
    maxTrackedProducts: number
    maxSubscriptions: number
    apiRateLimit: number
  }
  integrations: {
    openai: boolean
    stripe: boolean
    chargebee: boolean
    slack: boolean
    teams: boolean
  }
}
