import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logSystemEvent, escapeHtml } from "@/lib/systemEvents";

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { id, questionText, instruction, type, correctAnswer, options } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing question ID" }, { status: 400 });
    }

    // Begin transaction to update question and options
    const updatedQuestion = await prisma.$transaction(async (tx) => {
      // Update basic fields
      const q = await tx.practiceQuestion.update({
        where: { id },
        data: {
          questionText,
          instruction,
          type,
          correctAnswer
        }
      });

      // Update options if provided
      if (options && Array.isArray(options)) {
        // Delete old options
        await tx.practiceOption.deleteMany({
          where: { questionId: id }
        });

        // Create new options
        if (options.length > 0) {
          await tx.practiceOption.createMany({
            data: options.map(opt => ({
              questionId: id,
              text: opt.text,
              isCorrect: opt.isCorrect || false,
              blankIndex: opt.blankIndex || null
            }))
          });
        }
      }

      return q;
    });

    await logSystemEvent(`Question updated by <strong>${escapeHtml(session.user.name || session.user.email)}</strong>`, "INFO", (questionText || "").slice(0, 80));
    return NextResponse.json({ success: true, data: updatedQuestion });
  } catch (error: any) {
    console.error("Error updating question:", error);
    return NextResponse.json({ error: error.message || "Failed to update question" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing question ID" }, { status: 400 });
    }

    await prisma.practiceQuestion.delete({
      where: { id }
    });

    await logSystemEvent(`Question deleted by <strong>${escapeHtml(session.user.name || session.user.email)}</strong>`, "WARNING");
    return NextResponse.json({ success: true, message: "Question deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting question:", error);
    return NextResponse.json({ error: error.message || "Failed to delete question" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
