import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

  // Get recent error logs
  const mistakes = await prisma.errorLog.findMany({
    where: { userId: user.id },
    orderBy: { timestamp: 'desc' },
    take: 50,
  })

  // Deduplicate by questionId (or wordId as fallback)
  const uniqueMistakes = [];
  const seenIds = new Set();
  
  for (const m of mistakes) {
    const key = m.questionId || m.wordId;
    if (!key || seenIds.has(key)) continue;
    seenIds.add(key);
    uniqueMistakes.push(m);
    if (uniqueMistakes.length >= 20) break;
  }

  if (uniqueMistakes.length === 0) {
    return NextResponse.json([])
  }

  const formattedQuestions = []

  for (const log of uniqueMistakes) {
    if (log.questionId) {
      const q = await prisma.practiceQuestion.findUnique({
        where: { id: log.questionId },
        include: { options: true }
      });
      if (q) {
        const answerText = q.correctAnswer || q.options.find(o => o.isCorrect)?.text || ''
        formattedQuestions.push({
          id: q.id,
          wordId: log.wordId || null,
          questionId: q.id,
          question: q.questionText,
          instruction: q.instruction,
          mode: q.type,
          correctAnswer: answerText,
          options: q.options.map(o => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
            blankIndex: o.blankIndex
          })).sort(() => Math.random() - 0.5)
        })
      }
    } else if (log.wordId) {
      // Legacy fallback
      const word = await prisma.vocabWord.findUnique({ where: { id: log.wordId } })
      if (!word) continue;
      
      const questions = await prisma.practiceQuestion.findMany({
        where: { listId: word.listId },
        include: { options: true }
      })

      const q = questions.find(question => {
        const answerText = question.correctAnswer || question.options.find(o => o.isCorrect)?.text || ''
        return answerText.toLowerCase() === word.word.toLowerCase()
      })

      if (q) {
        formattedQuestions.push({
          id: q.id,
          wordId: word.id,
          questionId: q.id,
          question: q.questionText,
          instruction: q.instruction,
          mode: q.type,
          correctAnswer: word.word,
          options: q.options.map(o => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
            blankIndex: o.blankIndex
          })).sort(() => Math.random() - 0.5)
        })
      }
    }
  }

    formattedQuestions.sort(() => Math.random() - 0.5)
    return NextResponse.json(formattedQuestions)
  } catch (error: any) {
    console.error("Error in review-missed API:", error);
    return NextResponse.json({ error: error.message || "Unknown server error", stack: error.stack }, { status: 500 })
  }
}
