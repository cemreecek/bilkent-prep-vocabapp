import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const entries = await prisma.journalEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching journal entries:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { word, definition, sentence } = await request.json()

    if (!word || !definition) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if word already exists in journal to prevent duplicates
    const existingEntry = await prisma.journalEntry.findFirst({
      where: {
        userId: session.user.id,
        word: { equals: word, mode: 'insensitive' }
      }
    })

    if (existingEntry) {
      return NextResponse.json({ message: 'Word already in journal', entry: existingEntry }, { status: 200 })
    }

    const newEntry = await prisma.journalEntry.create({
      data: {
        userId: session.user.id,
        word,
        definition,
        collocations: '', // Empty initially, can be edited later
        sentence: sentence || '',
      }
    })

    return NextResponse.json(newEntry, { status: 201 })
  } catch (error) {
    console.error('Error creating journal entry:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
