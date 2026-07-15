import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session?.user?.role === 'ADMIN') {
    redirect('/admin')
  } else if (session?.user?.role === 'TEACHER') {
    redirect('/teacher')
  } else if (session?.user?.role === 'STUDENT') {
    redirect('/dashboard')
  } else {
    redirect('/auth/signin')
  }
}
