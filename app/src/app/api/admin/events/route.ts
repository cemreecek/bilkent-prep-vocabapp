import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRecentEvents } from '@/lib/systemEvents'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    return NextResponse.json(await getRecentEvents(12), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Failed to fetch events', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
