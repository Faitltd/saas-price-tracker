import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { SpendOptimizationRecommendation } from '@/types'

export class EnterpriseAIOptimizer {
  private openai: OpenAI
  private isEnabled: boolean

  constructor() {
    this.isEnabled = !!process.env.OPENAI_API_KEY
    
    if (this.isEnabled) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    }
  }

  async generateEnterpriseRecommendations(userId: string): Promise<SpendOptimizationRecommendation[]> {
    if (!this.isEnabled) {
      return this.getEnterpriseRecommendations()
    }

    try {
      // Get user's enterprise subscriptions and spending patterns
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
                take: 12 // Last 12 months
              }
            }
          }
        }
      })

      // Calculate total enterprise spend
      const totalMonthlySpend = userSubscriptions.reduce((sum, sub) => 
        sum + sub.currentPrice.toNumber(), 0)

      const enterpriseContext = this.buildEnterpriseContext(userSubscriptions, totalMonthlySpend)
      
      const prompt = `
You are an enterprise SaaS spend optimization consultant specializing in high-value software categories. 
Analyze the following enterprise SaaS portfolio and provide strategic cost optimization recommendations.

ENTERPRISE CONTEXT:
${enterpriseContext}

FOCUS AREAS:
1. Cloud Infrastructure optimization (AWS/Azure/GCP cost management)
2. CRM & Sales tool consolidation opportunities  
3. Marketing automation efficiency improvements
4. Productivity suite optimization (Microsoft 365 vs Google Workspace)
5. Security tool overlap identification
6. Project management tool rationalization

Provide recommendations in JSON format:
[
  {
    "type": "consolidation|migration|downgrade|bundle|negotiate",
    "title": "Strategic recommendation title",
    "description": "Detailed business impact and implementation strategy",
    "potentialSavings": 5000.00,
    "confidence": 0.85,
    "category": "Cloud Infrastructure|CRM|Marketing|Productivity|Security|Project Management",
    "priority": "high|medium|low",
    "timeframe": "immediate|3-months|6-months|annual",
    "businessImpact": "Description of business impact and risks"
  }
]

Consider:
- Enterprise contract negotiation opportunities
- Volume discount eligibility
- Annual vs monthly billing savings
- Multi-year commitment benefits
- Startup program eligibility
- Nonprofit discounts if applicable
- Alternative solutions with better ROI
`

      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert enterprise SaaS procurement consultant with deep knowledge of enterprise software pricing, negotiation strategies, and cost optimization techniques.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      })

      const aiResponse = completion.choices[0]?.message?.content
      if (!aiResponse) {
        return this.getEnterpriseRecommendations()
      }

      return this.parseEnterpriseRecommendations(aiResponse)

    } catch (error) {
      console.error('Enterprise AI optimization failed:', error)
      return this.getEnterpriseRecommendations()
    }
  }

  private buildEnterpriseContext(subscriptions: any[], totalSpend: number): string {
    const categorySpend = subscriptions.reduce((acc, sub) => {
      const category = sub.plan.product.category
      acc[category] = (acc[category] || 0) + sub.currentPrice.toNumber()
      return acc
    }, {} as { [key: string]: number })

    const subscriptionSummary = subscriptions.map(sub => ({
      product: sub.plan.product.name,
      category: sub.plan.product.category,
      plan: sub.plan.name,
      monthlySpend: sub.currentPrice.toNumber(),
      yearlySpend: sub.yearlySpend?.toNumber() || sub.currentPrice.toNumber() * 12,
      billingCycle: sub.billingCycle,
      priceHistory: sub.plan.priceHistory.map(ph => ({
        price: ph.price.toNumber(),
        date: ph.createdAt.toISOString().split('T')[0]
      }))
    }))

    return `
TOTAL MONTHLY SPEND: $${totalSpend.toLocaleString()}
ANNUAL SPEND: $${(totalSpend * 12).toLocaleString()}

SPEND BY CATEGORY:
${Object.entries(categorySpend).map(([cat, spend]) => 
  `- ${cat}: $${spend.toLocaleString()}/month ($${(spend * 12).toLocaleString()}/year)`
).join('\n')}

CURRENT SUBSCRIPTIONS:
${JSON.stringify(subscriptionSummary, null, 2)}
`
  }

  private parseEnterpriseRecommendations(aiResponse: string): SpendOptimizationRecommendation[] {
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        return this.getEnterpriseRecommendations()
      }

      const recommendations = JSON.parse(jsonMatch[0])
      
      return recommendations.map((rec: any) => ({
        type: rec.type || 'alternative',
        title: rec.title || 'Enterprise Optimization Opportunity',
        description: rec.description || 'Consider optimizing this enterprise subscription',
        potentialSavings: parseFloat(rec.potentialSavings) || 0,
        confidence: Math.min(Math.max(parseFloat(rec.confidence) || 0.7, 0), 1),
        actionUrl: rec.actionUrl,
        productId: rec.productId,
        planId: rec.planId,
        category: rec.category,
        priority: rec.priority,
        timeframe: rec.timeframe,
        businessImpact: rec.businessImpact
      }))

    } catch (error) {
      console.error('Failed to parse enterprise recommendations:', error)
      return this.getEnterpriseRecommendations()
    }
  }

  private getEnterpriseRecommendations(): SpendOptimizationRecommendation[] {
    return [
      {
        type: 'consolidation',
        title: 'Cloud Infrastructure Optimization',
        description: 'Analyze your AWS/Azure usage patterns and consider Reserved Instances or Savings Plans for predictable workloads. Potential 30-60% savings on compute costs.',
        potentialSavings: 2500,
        confidence: 0.85,
        category: 'Cloud Infrastructure',
        priority: 'high',
        timeframe: '3-months'
      },
      {
        type: 'bundle',
        title: 'Microsoft 365 vs Individual Tools',
        description: 'Consider consolidating individual productivity tools into Microsoft 365 Business Premium. Often more cost-effective than separate email, storage, and collaboration tools.',
        potentialSavings: 800,
        confidence: 0.75,
        category: 'Productivity',
        priority: 'medium',
        timeframe: 'immediate'
      },
      {
        type: 'negotiate',
        title: 'Enterprise Contract Negotiation',
        description: 'For annual spends over $50K, negotiate enterprise agreements with volume discounts, multi-year commitments, and custom terms.',
        potentialSavings: 5000,
        confidence: 0.70,
        category: 'Enterprise',
        priority: 'high',
        timeframe: 'annual'
      },
      {
        type: 'migration',
        title: 'CRM Consolidation Opportunity',
        description: 'Evaluate consolidating multiple sales tools into a single CRM platform. Reduces training costs, improves data consistency, and often provides better pricing.',
        potentialSavings: 1200,
        confidence: 0.65,
        category: 'CRM',
        priority: 'medium',
        timeframe: '6-months'
      },
      {
        type: 'downgrade',
        title: 'Security Tool Overlap Analysis',
        description: 'Review security tool stack for overlapping features. Many enterprise security suites provide multiple functions that might replace individual point solutions.',
        potentialSavings: 1800,
        confidence: 0.60,
        category: 'Security',
        priority: 'medium',
        timeframe: '3-months'
      }
    ]
  }

  async generateCategoryInsights(category: string): Promise<any> {
    const categoryInsights = {
      'Cloud Infrastructure': {
        averageSavings: '30-60%',
        topStrategies: ['Reserved Instances', 'Spot Instances', 'Right-sizing', 'Auto-scaling'],
        commonMistakes: ['Over-provisioning', 'Ignoring data transfer costs', 'Not using savings plans'],
        negotiationTips: ['Commit to 1-3 year terms', 'Bundle services', 'Leverage competitive pricing']
      },
      'CRM & Sales': {
        averageSavings: '20-40%',
        topStrategies: ['Tool consolidation', 'User optimization', 'Feature auditing', 'Annual billing'],
        commonMistakes: ['Paying for unused seats', 'Overlapping tools', 'Not leveraging integrations'],
        negotiationTips: ['Volume discounts', 'Multi-year deals', 'Startup programs']
      },
      'Marketing Automation': {
        averageSavings: '25-45%',
        topStrategies: ['Contact list optimization', 'Feature tier analysis', 'Integration consolidation'],
        commonMistakes: ['Paying for inactive contacts', 'Over-featured plans', 'Multiple overlapping tools'],
        negotiationTips: ['Annual commitments', 'Growth discounts', 'Agency partnerships']
      },
      'Productivity': {
        averageSavings: '15-35%',
        topStrategies: ['Suite vs individual tools', 'User license optimization', 'Storage management'],
        commonMistakes: ['Unused licenses', 'Overlapping storage', 'Feature redundancy'],
        negotiationTips: ['Enterprise agreements', 'Education discounts', 'Nonprofit pricing']
      }
    }

    return categoryInsights[category] || {
      averageSavings: '20-40%',
      topStrategies: ['Annual billing', 'Right-sizing', 'Feature optimization'],
      commonMistakes: ['Over-provisioning', 'Unused features', 'Poor contract terms'],
      negotiationTips: ['Volume discounts', 'Multi-year terms', 'Competitive alternatives']
    }
  }
}
