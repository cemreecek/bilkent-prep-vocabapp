"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function adminCreateUserAction(data: { name: string; email: string; role: string; password?: string; level?: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") return { success: false, error: "Not authorized" };

    if (!data.email.trim() || !data.name.trim()) return { success: false, error: "Name and email required" };

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { success: false, error: "Email already exists" };

    const hash = data.password ? await bcrypt.hash(data.password, 10) : await bcrypt.hash("Bilkent123!", 10);

    // @ts-ignore
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hash,
        role: data.role as any,
        level: data.level,
      }
    });
    return { success: true };
  } catch (e) {
    console.error("Create user error", e);
    return { success: false, error: "Failed to create user" };
  }
}

export async function adminUpdateUserAction(id: string, data: { name?: string; email?: string; role?: string; password?: string; level?: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") return { success: false, error: "Not authorized" };

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role as any;
    if (data.password) updateData.password = await bcrypt.hash(data.password, 10);
    if (data.level !== undefined) updateData.level = data.level;

    await prisma.user.update({
      where: { id },
      data: updateData,
    });
    return { success: true };
  } catch (e) {
    console.error("Update user error", e);
    return { success: false, error: "Failed to update user" };
  }
}

export async function publicRegisterUserAction(data: { name: string; email: string; password?: string }) {
  try {
    if (!data.email.trim() || !data.name.trim()) return { success: false, error: "Name and email required" };
    if (!data.email.endsWith("@bilkent.edu.tr") && !data.email.endsWith("@ug.bilkent.edu.tr")) {
      return { success: false, error: "Must use a valid Bilkent email domain" };
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { success: false, error: "Email already registered" };

    let role = "STUDENT";
    if (data.email.endsWith("@bilkent.edu.tr")) role = "TEACHER";

    const hash = data.password ? await bcrypt.hash(data.password, 10) : await bcrypt.hash("Bilkent123!", 10);

    // @ts-ignore
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hash,
        role: role as any,
      }
    });
    return { success: true };
  } catch (e) {
    console.error("Register user error", e);
    return { success: false, error: "Registration failed" };
  }
}
