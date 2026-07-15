import { NextResponse } from "next/server"
import levels from "@/data/levels/levels.json"

export async function GET() {
  return NextResponse.json(levels)
}
