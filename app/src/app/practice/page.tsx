import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import Link from 'next/link'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function PracticeDashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/auth/signin')
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })
  
  if (user?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="w-full top-0 sticky bg-white shadow-sm flex justify-between items-center px-10 h-16 z-50">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="material-symbols-outlined text-gray-500 hover:text-blue-600 transition-colors">
              arrow_back
            </Link>
            <h1 className="text-xl font-bold text-blue-900">Live Editor Mode</h1>
          </div>
      </header>
      <main className="p-10 max-w-5xl mx-auto">
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Select a Curriculum Level</h2>
            <p className="text-gray-500 mt-2">Choose the level you want to edit. You will enter the student practice view with Admin privileges.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[
              { id: "Elementary", label: "Elementary" },
              { id: "PreIntermediate", label: "Pre-Intermediate" },
              { id: "Intermediate", label: "Intermediate" },
              { id: "UpperIntermediate", label: "Upper-Intermediate" },
              { id: "PreFac", label: "Pre-Faculty" },
          ].map(lvl => (
            <Link 
              key={lvl.id} 
              href={`/practice/${lvl.id}`} 
              className="p-8 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 shadow-sm hover:shadow-md transition-all text-center group flex flex-col items-center gap-3"
            >
              <span className="material-symbols-outlined text-4xl text-gray-400 group-hover:text-blue-500 transition-colors">folder</span>
              <div className="text-xl font-bold text-gray-800 group-hover:text-blue-900">{lvl.label}</div>
              <div className="text-sm font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Enter Editor &rarr;</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
