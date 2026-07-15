import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
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

  const mistakes = await prisma.errorLog.groupBy({
    by: ["wordId"],
    where: { userId: user.id },
    _count: {
      wordId: true,
    },
    orderBy: {
      _count: {
        wordId: "desc",
      },
    },
    take: 20,
  })

  const wordIds = mistakes.map((item) => item.wordId)

  if (wordIds.length === 0) {
    return NextResponse.json([])
  }

  // Fetch words to get the correct text answers
  const words = await prisma.vocabWord.findMany({
    where: {
      id: {
        in: wordIds,
      },
    },
  })

  // We need to find ONE PracticeQuestion for each word.
  // We can query all questions for the lists these words belong to.
  const listIds = [...new Set(words.map(w => w.listId))]
  
  const questions = await prisma.practiceQuestion.findMany({
    where: {
      listId: { in: listIds }
    },
    include: {
      options: true
    }
  })

  const formattedQuestions = []

  for (const word of words) {
    // Find a question where the correctAnswer OR one of the correct options matches the word
    const matchingQuestion = questions.find(q => {
      const answerText = q.correctAnswer || q.options.find(o => o.isCorrect)?.text || ''
      return answerText.toLowerCase() === word.word.toLowerCase()
    })

    if (matchingQuestion) {
      formattedQuestions.push({
        id: matchingQuestion.id,
        wordId: word.id, // Include wordId for error tracking and debt decrement
        question: matchingQuestion.questionText,
        instruction: matchingQuestion.instruction,
        mode: matchingQuestion.type,
        correctAnswer: word.word,
        options: matchingQuestion.options.map(o => ({
          id: o.id,
          text: o.text,
          isCorrect: o.isCorrect,
          blankIndex: o.blankIndex
        })).sort(() => Math.random() - 0.5) // Shuffle options
      })
    }
  }

  // Shuffle the questions
  formattedQuestions.sort(() => Math.random() - 0.5)

  return NextResponse.json(formattedQuestions)
}
