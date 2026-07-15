"use server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function joinClassroomAction(joinCode: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const classroom = await prisma.classroom.findUnique({
      where: { joinCode: joinCode.trim() }
    });

    if (!classroom) {
      return { success: false, error: "Invalid join code." };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { classroomId: classroom.id }
    });

    return { success: true };
  } catch (e) {
    console.error("Join classroom error:", e);
    return { success: false, error: "An unexpected error occurred." };
  }
}

export async function editClassroomNameAction(classroomId: string, newName: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return { success: false, error: "Not authorized" };
    }
    
    if (!newName.trim()) {
      return { success: false, error: "Name cannot be empty" };
    }

    await prisma.classroom.update({
      where: { id: classroomId },
      data: { name: newName.trim() }
    });

    return { success: true };
  } catch (e) {
    console.error("Edit classroom name error:", e);
    return { success: false, error: "Failed to update classroom name" };
  }
}

export async function assignTeacherToClassroomAction(classroomId: string, newTeacherId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return { success: false, error: "Not authorized" };
    }
    
    if (!newTeacherId) {
      return { success: false, error: "Teacher ID cannot be empty" };
    }

    // Verify teacher exists
    const teacher = await prisma.user.findUnique({ where: { id: newTeacherId } });
    if (!teacher || teacher.role !== 'TEACHER') {
       return { success: false, error: "Invalid teacher" };
    }

    await prisma.classroom.update({
      where: { id: classroomId },
      data: { teacherId: newTeacherId }
    });

    return { success: true };
  } catch (e) {
    console.error("Assign teacher error:", e);
    return { success: false, error: "Failed to assign teacher" };
  }
}

export async function assignStudentToClassroomAction(classroomId: string, studentId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return { success: false, error: "Not authorized" };
    }
    
    if (!studentId) {
      return { success: false, error: "Student ID cannot be empty" };
    }

    // Verify student exists
    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== 'STUDENT') {
       return { success: false, error: "Invalid student" };
    }

    await prisma.user.update({
      where: { id: studentId },
      data: { classroomId: classroomId }
    });

    return { success: true };
  } catch (e) {
    console.error("Assign student error:", e);
    return { success: false, error: "Failed to assign student" };
  }
}

export async function createClassroomAction(name: string, teacherId?: string, level: string = "Elementary") {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return { success: false, error: "Not authorized" };
    }
    
    if (!name.trim()) {
      return { success: false, error: "Classroom name is required" };
    }

    if (teacherId) {
      const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
      if (!teacher || teacher.role !== 'TEACHER') {
        return { success: false, error: "Invalid teacher assigned" };
      }
    }

    // @ts-ignore
    await prisma.classroom.create({
      data: {
        name: name.trim(),
        teacherId: teacherId || "",
        level: level as any,
      }
    });

    return { success: true };
  } catch (e) {
    console.error("Create classroom error:", e);
    return { success: false, error: "Failed to create classroom" };
  }
}
