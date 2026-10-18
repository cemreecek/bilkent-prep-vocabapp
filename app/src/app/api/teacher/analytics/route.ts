import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getClassroomAnalytics } from "@/lib/teacherAnalytics"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const classroomId = new URL(req.url).searchParams.get("classroomId") || ""
  if (!classroomId) {
    return NextResponse.json({ error: "Missing classroomId" }, { status: 400 })
  }

  if (session.user.role === "TEACHER") {
    const owns = await prisma.classroom.findFirst({
      where: { id: classroomId, teacherId: session.user.id },
      select: { id: true },
    })
    if (!owns) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const data = await getClassroomAnalytics(classroomId)
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
}
