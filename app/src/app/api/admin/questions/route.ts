import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Returns a list of problems with a question's answer key (empty array = looks fine). */
function findIssues(q: { type: string; correctAnswer: string | null; options: { isCorrect: boolean; blankIndex: number | null }[] }): string[] {
  const issues: string[] = [];
  if (q.options.length === 0) {
    if (!q.correctAnswer || !q.correctAnswer.trim()) issues.push("No correct answer set");
    return issues;
  }
  const groups = new Map<number, number>();
  for (const o of q.options) {
    const k = q.type === "paragraph-cloze" || q.options.some((x) => (x.blankIndex ?? 1) !== 1) ? (o.blankIndex ?? 1) : 1;
    groups.set(k, (groups.get(k) ?? 0) + (o.isCorrect ? 1 : 0));
  }
  if (q.type === "word-bank") {
    // Extra words with no correct flag are distractors; only flag if nothing is marked correct at all.
    const total = [...groups.values()].reduce((a, b) => a + b, 0);
    if (total === 0 && q.options.length > 1) issues.push("No correct option marked");
    return issues;
  }
  for (const [k, n] of groups) {
    if (n === 0) issues.push(groups.size > 1 ? `Blank ${k}: no correct option` : "No correct option marked");
    if (n > 1 && q.type !== "matching") issues.push(groups.size > 1 ? `Blank ${k}: ${n} options marked correct` : `${n} options marked correct`);
  }
  return issues;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level");
  const unit = searchParams.get("unit");
  const week = searchParams.get("week");
  const onlyIssues = searchParams.get("issues") === "1";

  const questions = await prisma.practiceQuestion.findMany({
    where: {
      ...(week ? { week: parseInt(week) } : {}),
      list: {
        ...(level ? { level: level as any } : {}),
        ...(unit ? { unit } : {}),
      },
    },
    include: { options: { orderBy: [{ blankIndex: "asc" }, { id: "asc" }] }, list: { select: { level: true, unit: true } } },
    orderBy: [{ week: "asc" }, { id: "asc" }],
    take: 500,
  });

  const data = questions
    .map((q) => ({ ...q, issues: findIssues(q) }))
    .filter((q) => !onlyIssues || q.issues.length > 0);

  return NextResponse.json({ success: true, data });
}
