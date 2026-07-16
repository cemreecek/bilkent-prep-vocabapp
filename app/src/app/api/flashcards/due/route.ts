import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, level: true, role: true }
  })

  if (!user || (!user.level && user.role === 'STUDENT')) {
    return NextResponse.json({ dueCards: [], newCards: [] })
  }

  // Find due cards from existing progress
  const dueProgress = await prisma.flashcardProgress.findMany({
    where: {
      userId: user.id,
      nextReviewAt: {
        lte: new Date()
      }
    },
    include: {
      word: true
    },
    take: 50 // Limit daily reviews
  })

  // Format due cards
  const dueCards = dueProgress.map(p => ({
    progressId: p.id,
    wordId: p.wordId,
    word: p.word.word,
    definition: p.word.definition,
    isNew: false
  }))

  // If we don't have enough due cards, fetch error words first
  let newCards: any[] = []
  if (user.level && dueCards.length < 20) {
    // 1. First get words they made errors on that aren't already due
    const errorLogs = await prisma.errorLog.groupBy({
      by: ['wordId'],
      where: {
        userId: user.id
      },
      _count: {
        wordId: true
      },
      orderBy: {
        _count: {
          wordId: 'desc'
        }
      },
      take: 20 - dueCards.length
    })

    const errorWordIds = errorLogs
      .map(log => log.wordId)
      .filter((id): id is string => id !== null)
    
    let errorWordsMap = new Map()
    if (errorWordIds.length > 0) {
      const words = await prisma.vocabWord.findMany({
        where: { id: { in: errorWordIds } }
      })
      
      words.forEach(word => {
        if (!dueCards.find(d => d.wordId === word.id)) {
          errorWordsMap.set(word.id, {
            progressId: null,
            wordId: word.id,
            word: word.word,
            definition: word.definition,
            isNew: false
          })
        }
      })
    }

    newCards = Array.from(errorWordsMap.values())

    // 2. If still need more, get new words
    if (newCards.length + dueCards.length < 20) {
      const newWords = await prisma.vocabWord.findMany({
        where: {
          list: {
            level: user.level
          },
          flashcardProgress: {
            none: {
              userId: user.id
            }
          },
          id: {
            notIn: Array.from(errorWordsMap.keys()) // exclude error words we just added
          }
        },
        take: 20 - (dueCards.length + newCards.length)
      })

      newCards = [
        ...newCards,
        ...newWords.map(w => ({
          progressId: null,
          wordId: w.id,
          word: w.word,
          definition: w.definition,
          isNew: true
        }))
      ]
    }
  }

  return NextResponse.json({
    dueCards,
    newCards,
    totalDue: dueCards.length + newCards.length
  })
}
