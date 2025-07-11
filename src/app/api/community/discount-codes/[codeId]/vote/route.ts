import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

// Upvote or downvote a discount code
export const POST = requireAuth(async (
  request: NextRequest,
  user,
  { params }: { params: { codeId: string } }
) => {
  try {
    const body = await request.json()
    const { voteType } = body // 'upvote' or 'downvote'

    if (!['upvote', 'downvote'].includes(voteType)) {
      return Response.json(
        { success: false, error: 'Vote type must be "upvote" or "downvote"' },
        { status: 400 }
      )
    }

    // Check if discount code exists
    const discountCode = await prisma.discountCode.findUnique({
      where: { id: params.codeId }
    })

    if (!discountCode) {
      return Response.json(
        { success: false, error: 'Discount code not found' },
        { status: 404 }
      )
    }

    // Check if user already voted
    const existingVote = await prisma.discountCodeVote.findUnique({
      where: {
        userId_discountCodeId: {
          userId: user.id,
          discountCodeId: params.codeId
        }
      }
    })

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote if same type
        await prisma.discountCodeVote.delete({
          where: { id: existingVote.id }
        })

        // Update count
        await prisma.discountCode.update({
          where: { id: params.codeId },
          data: {
            [voteType === 'upvote' ? 'upvotes' : 'downvotes']: {
              decrement: 1
            }
          }
        })

        return Response.json({
          success: true,
          message: 'Vote removed'
        })
      } else {
        // Change vote type
        await prisma.discountCodeVote.update({
          where: { id: existingVote.id },
          data: { voteType }
        })

        // Update counts
        await prisma.discountCode.update({
          where: { id: params.codeId },
          data: {
            upvotes: {
              [voteType === 'upvote' ? 'increment' : 'decrement']: 1
            },
            downvotes: {
              [voteType === 'downvote' ? 'increment' : 'decrement']: 1
            }
          }
        })

        return Response.json({
          success: true,
          message: 'Vote updated'
        })
      }
    } else {
      // Create new vote
      await prisma.discountCodeVote.create({
        data: {
          userId: user.id,
          discountCodeId: params.codeId,
          voteType
        }
      })

      // Update count
      await prisma.discountCode.update({
        where: { id: params.codeId },
        data: {
          [voteType === 'upvote' ? 'upvotes' : 'downvotes']: {
            increment: 1
          }
        }
      })

      return Response.json({
        success: true,
        message: 'Vote recorded'
      })
    }
  } catch (error) {
    console.error('Vote discount code error:', error)
    
    return Response.json(
      { success: false, error: 'Failed to record vote' },
      { status: 500 }
    )
  }
})
