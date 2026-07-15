import { getServerSession, Session } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/journal/entries
 * Fetch all journal entries for the authenticated user
 * 
 * Query params:
 *   - search: Filter by word, definition, or collocations
 *   - difficulty: Filter by difficulty (1-5)
 *   - tags: Filter by tags (comma-separated)
 *   - sort: Sort by 'recent', 'difficulty', or 'alphabetical'
 */
export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase()
    const difficulty = searchParams.get('difficulty')
    const tagsParam = searchParams.get('tags')
    const sort = searchParams.get('sort') || 'recent'

    let entries = await prisma.journalEntry.findMany({
      where: {
        userId: user.id,
      },
      orderBy:
        sort === 'alphabetical'
          ? { word: 'asc' }
          : sort === 'difficulty'
          ? { difficulty: 'desc' }
          : { createdAt: 'desc' },
    })

    // Client-side filtering (or move to Prisma if needed)
    if (search) {
      entries = entries.filter(
        entry =>
          entry.word.toLowerCase().includes(search) ||
          entry.definition.toLowerCase().includes(search) ||
          entry.collocations.toLowerCase().includes(search)
      )
    }

    if (difficulty) {
      entries = entries.filter(entry => entry.difficulty === parseInt(difficulty, 10))
    }

    if (tagsParam) {
      const tagsToFilter = tagsParam.split(',').map(t => t.trim())
      entries = entries.filter(entry =>
        tagsToFilter.some(tag => entry.tags.includes(tag))
      )
    }

    return NextResponse.json(entries)
  } catch (error) {
    console.error('GET /api/journal/entries error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/journal/entries
 * Create a new journal entry
 */
export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { word, definition, collocations, sentence, difficulty, source, tags } = body

    // Validation
    if (!word?.trim() || !definition?.trim() || !sentence?.trim()) {
      return NextResponse.json(
        { error: 'Word, definition, and sentence are required' },
        { status: 400 }
      )
    }

    const entry = await prisma.journalEntry.create({
      data: {
        userId: user.id,
        word: word.trim(),
        definition: definition.trim(),
        collocations: collocations?.trim() || '',
        sentence: sentence.trim(),
        difficulty: difficulty || 3,
        source: source?.trim() || '',
        tags: tags || [],
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('POST /api/journal/entries error:', error)
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    )
  }
}
