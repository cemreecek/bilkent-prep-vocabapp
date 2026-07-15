import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level')
  const week = parseInt(searchParams.get('week') || '1')
  const day = parseInt(searchParams.get('day') || '1')

  if (!level) {
    return NextResponse.json({ error: 'Missing level' }, { status: 400 })
  }

  try {
    const words = await prisma.vocabWord.findMany({
      where: {
        list: {
          level: level as any
        },
        week,
        day
      },
      select: {
        id: true,
        word: true,
        definition: true,
        example: true
      },
      orderBy: { word: 'asc' }
    })
    
    console.log(`[API FLASHCARDS] level=${level}, week=${week}, day=${day} -> foundWords=${words.length}`)

    return NextResponse.json(words)
  } catch (error) {
    console.error('Error fetching flashcards:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
