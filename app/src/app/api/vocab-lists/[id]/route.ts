import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import levels from "@/data/levels/levels.json"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const list = levels.find((item) => item.id === id)

  if (!list) {
    return NextResponse.json({ error: "Vocabulary list not found." }, { status: 404 })
  }

  const filePath = path.join(process.cwd(), "src", "data", list.file)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Vocabulary list not found." }, { status: 404 })
  }

  const fileContents = JSON.parse(fs.readFileSync(filePath, "utf8"))
  return NextResponse.json(fileContents)
}
