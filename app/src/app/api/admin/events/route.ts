import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const liveEvents = await prisma.systemEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const formattedEvents = liveEvents.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      type: e.type,
      timeAgo: new Date(e.createdAt).toLocaleDateString()
    }));

    return NextResponse.json(formattedEvents);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
