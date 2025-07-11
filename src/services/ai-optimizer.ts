import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { SpendOptimizationRecommendation, AIInsight } from '@/types'

export class AISpendOptimizer {
  private openai: OpenAI
  private isEnabled: boolean

  constructor() {
    this.isEnabled = !!process.env.OPENAI_API_KEY
    
    if (this.isEnabled) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    } else {
      console.warn('OpenAI API key not configured. AI features will be disabled.')
    }
  }

  async generateSpendOptimizationRecommendations(userId: string): Promise<SpendOptimizationRecommendation[]> {
    if (!this.isEnabled) {
      return this.getFallbackRecommendations()
    }

    try {
      // Get user's current subscriptions and tracked plans
      const userSubscriptions = await prisma.userSubscription.findMany({
        where: { 
          userId,
          isActive: true 
        },
        include: {
          plan: {
            include: {
              product: true,
              priceHistory: {
                orderBy: { createdAt: 'desc' },
                take: 5
              }
            }
          }
        }
      })

      const trackedPlans = await prisma.userTrackedPlan.findMany({
        where: { 
          userId,
          isActive: true 
        },
        include: {
          plan: {
            include: {
              product: {
                include: {
                  plans: {
                    where: { isActive: true },
                    orderBy: { currentPrice: 'asc' }
                  }
                }
              }
            }
          }
        }
      })

      // Prepare data for AI analysis
      const subscriptionData = userSubscriptions.map(sub => ({
        product: sub.plan.product.name,
        plan: sub.plan.name,
        monthlyPrice: sub.currentPrice.toNumber(),
        yearlySpend: sub.yearlySpend?.toNumber() || sub.currentPrice.toNumber() * 12,
        billingCycle: sub.billingCycle,
        features: sub.plan.features,
        priceHistory: sub.plan.priceHistory.map(ph => ({
          price: ph.price.toNumber(),
          date: ph.createdAt.toISOString()
        }))
      }))

      const trackedData = trackedPlans.map(tracked => ({
        product: tracked.plan.product.name,
        currentPlan: tracked.plan.name,
        currentPrice: tracked.plan.currentPrice?.toNumber() || 0,
        alternativePlans: tracked.plan.product.plans.map(plan => ({
          name: plan.name,
          price: plan.currentPrice?.toNumber() || 0,
          features: plan.features
        }))
      }))

      const prompt = this.buildOptimizationPrompt(subscriptionData, trackedData)
      
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SaaS spend optimization consultant. Analyze the user\'s current subscriptions and provide actionable recommendations to reduce costs while maintaining functionality. Return your response as a JSON array of recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
        temperature: 0.3
      })

      const aiResponse = completion.choices[0]?.message?.content
      if (!aiResponse) {
        throw new Error('No response from AI')
      }

      // Parse AI response
      const recommendations = this.parseAIRecommendations(aiResponse)
      return recommendations

    } catch (error) {
      console.error('AI optimization failed:', error)
      return this.getFallbackRecommendations()
    }
  }

  private buildOptimizationPrompt(subscriptions: any[], tracked: any[]): string {
    return `
Analyze the following SaaS subscription data and provide optimization recommendations:

CURRENT SUBSCRIPTIONS:
${JSON.stringify(subscriptions, null, 2)}

TRACKED PRODUCTS (considering):
${JSON.stringify(tracked, null, 2)}

Please provide recommendations in the following JSON format:
[
  {
    "type": "downgrade|alternative|bundle|cancel",
    "title": "Brief recommendation title",
    "description": "Detailed explanation of the recommendation",
    "potentialSavings": 120.50,
    "confidence": 0.85,
    "actionUrl": "optional-url-to-take-action",
    "productId": "optional-product-id",
    "planId": "optional-plan-id"
  }
]

Focus on:
1. Identifying underutilized expensive subscriptions
2. Finding cheaper alternatives with similar features
3. Suggesting plan downgrades where appropriate
4. Identifying bundling opportunities
5. Flagging duplicate or overlapping tools

Consider price trends and provide confidence scores (0-1) for each recommendation.
`
  }

  private parseAIRecommendations(aiResponse: string): SpendOptimizationRecommendation[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }

      const recommendations = JSON.parse(jsonMatch[0])
      
      // Validate and sanitize recommendations
      return recommendations.map((rec: any) => ({
        type: rec.type || 'alternative',
        title: rec.title || 'Optimization Opportunity',
        description: rec.description || 'Consider reviewing this subscription',
        potentialSavings: parseFloat(rec.potentialSavings) || 0,
        confidence: Math.min(Math.max(parseFloat(rec.confidence) || 0.5, 0), 1),
        actionUrl: rec.actionUrl,
        productId: rec.productId,
        planId: rec.planId
      }))

    } catch (error) {
      console.error('Failed to parse AI recommendations:', error)
      return this.getFallbackRecommendations()
    }
  }

  private getFallbackRecommendations(): SpendOptimizationRecommendation[] {
    return [
      {
        type: 'alternative',
        title: 'Review Your Subscriptions',
        description: 'Consider reviewing your current subscriptions for potential savings. Look for unused features or cheaper alternatives.',
        potentialSavings: 50,
        confidence: 0.7
      },
      {
        type: 'bundle',
        title: 'Annual Billing Savings',
        description: 'Switch to annual billing for your most-used subscriptions to save 10-20% on costs.',
        potentialSavings: 100,
        confidence: 0.8
      }
    ]
  }

  async generateMarketInsights(): Promise<AIInsight[]> {
    if (!this.isEnabled) {
      return this.getFallbackInsights()
    }

    try {
      // Get recent price changes across all products
      const recentPriceChanges = await prisma.priceSnapshot.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        include: {
          plan: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      // Analyze trends
      const categoryTrends = this.analyzeCategoryTrends(recentPriceChanges)
      
      const prompt = `
Analyze the following SaaS market data and provide insights:

RECENT PRICE CHANGES:
${JSON.stringify(categoryTrends, null, 2)}

Provide market insights in JSON format:
[
  {
    "type": "market_trend",
    "title": "Insight title",
    "description": "Detailed insight description",
    "confidence": 0.85,
    "data": { "category": "Communication", "trend": "increasing" }
  }
]
`

      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a SaaS market analyst. Provide insights about pricing trends and market movements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.4
      })

      const aiResponse = completion.choices[0]?.message?.content
      if (!aiResponse) {
        return this.getFallbackInsights()
      }

      return this.parseAIInsights(aiResponse)

    } catch (error) {
      console.error('Market insights generation failed:', error)
      return this.getFallbackInsights()
    }
  }

  private analyzeCategoryTrends(priceChanges: any[]): any {
    const categoryData: { [key: string]: { increases: number; decreases: number; total: number } } = {}

    priceChanges.forEach(change => {
      const category = change.plan.product.category
      if (!categoryData[category]) {
        categoryData[category] = { increases: 0, decreases: 0, total: 0 }
      }

      categoryData[category].total++
      if (change.priceChange && change.priceChange > 0) {
        categoryData[category].increases++
      } else if (change.priceChange && change.priceChange < 0) {
        categoryData[category].decreases++
      }
    })

    return categoryData
  }

  private parseAIInsights(aiResponse: string): AIInsight[] {
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        return this.getFallbackInsights()
      }

      const insights = JSON.parse(jsonMatch[0])
      
      return insights.map((insight: any) => ({
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: insight.type || 'market_trend',
        title: insight.title || 'Market Insight',
        description: insight.description || 'Market analysis insight',
        data: insight.data || {},
        confidence: Math.min(Math.max(parseFloat(insight.confidence) || 0.5, 0), 1),
        createdAt: new Date()
      }))

    } catch (error) {
      console.error('Failed to parse AI insights:', error)
      return this.getFallbackInsights()
    }
  }

  private getFallbackInsights(): AIInsight[] {
    return [
      {
        id: `fallback-${Date.now()}`,
        type: 'market_trend',
        title: 'SaaS Market Stability',
        description: 'The SaaS market continues to show steady growth with most products maintaining stable pricing.',
        data: { trend: 'stable' },
        confidence: 0.7,
        createdAt: new Date()
      }
    ]
  }
}
