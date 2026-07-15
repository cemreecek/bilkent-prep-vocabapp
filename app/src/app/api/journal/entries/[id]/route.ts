import { getServerSession, Session } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/journal/entries/[id]
 * Fetch a single journal entry
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Check ownership
    if (entry.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error('GET /api/journal/entries/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entry' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/journal/entries/[id]
 * Update a journal entry
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Check ownership
    if (entry.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

    const updatedEntry = await prisma.journalEntry.update({
      where: { id },
      data: {
        word: word.trim(),
        definition: definition.trim(),
        collocations: collocations?.trim() || '',
        sentence: sentence.trim(),
        difficulty: difficulty || 3,
        source: source?.trim() || '',
        tags: tags || [],
      },
    })

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error('PUT /api/journal/entries/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/journal/entries/[id]
 * Delete a journal entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Check ownership
    if (entry.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.journalEntry.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/journal/entries/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    )
  }
}
