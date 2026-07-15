import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const weekParam = searchParams.get('week')
    const levelParam = searchParams.get('level') // Get level from UI

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Temporarily allow any level for testing since page restriction is disabled
    const requestedLevel = levelParam || user.level

    if (!requestedLevel) {
      return new NextResponse('Level not specified or assigned', { status: 403 })
    }

    const whereClause: any = {
      list: { level: requestedLevel }
    }

    if (weekParam) {
      whereClause.week = parseInt(weekParam)
    }

    const questions = await prisma.practiceQuestion.findMany({
      where: whereClause,
      include: {
        options: true
      },
      orderBy: { id: 'asc' } // Keep the sequential order based on insertion
    })

    // Group by instruction (Section Randomization)
    const grouped = new Map<string, typeof questions>()
    for (const q of questions) {
      if (!grouped.has(q.instruction)) {
        grouped.set(q.instruction, [])
      }
      grouped.get(q.instruction)!.push(q)
    }

    // Shuffle the groups, so distinct chunks appear in a random order
    const groupsArray = Array.from(grouped.values())
    groupsArray.sort(() => Math.random() - 0.5)

    // Flatten back to a sequential list where items inside a chunk stay together
    const shuffledQuestions = groupsArray.flat()

    // Fetch all words in these lists to map them to questions
    const listIds = [...new Set(questions.map(q => q.listId))]
    const vocabWords = await prisma.vocabWord.findMany({
      where: { listId: { in: listIds } },
      select: { id: true, word: true }
    })

    // Map to the frontend expected format
    const formattedQuestions = shuffledQuestions.map(q => {
      const answerText = q.correctAnswer || q.options.find(o => o.isCorrect)?.text || ''
      const matchingWord = vocabWords.find(w => w.word.toLowerCase() === answerText.toLowerCase())
      
      return {
        id: q.id,
        wordId: matchingWord?.id || null, // Include wordId for error tracking
        question: q.questionText,
        instruction: q.instruction,
        mode: q.type,
        correctAnswer: answerText,
        options: q.options.map(o => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
          blankIndex: o.blankIndex
        })).sort(() => Math.random() - 0.5) // Shuffle options within the question
      }
    })

    // Return all questions for the session in random section order
    return NextResponse.json(formattedQuestions)
  } catch (error) {
    console.error('Error fetching practice questions:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
