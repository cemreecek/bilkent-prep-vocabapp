import { test, expect } from '@playwright/test';
import { PrismaClient, Level, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

test.describe('Teacher Dashboard', () => {
  let teacherUser: any;
  let testClassroom: any;
  let testStudent: any;

  test.beforeAll(async () => {
    const teacherEmail = 'teacher.test@bilkent.edu.tr';
    const password = await bcrypt.hash('teacher123', 10);
    teacherUser = await prisma.user.upsert({
      where: { email: teacherEmail },
      update: { password, role: 'TEACHER' },
      create: {
        email: teacherEmail,
        name: 'Test Teacher',
        password,
        role: 'TEACHER',
      },
    });

    testClassroom = await prisma.classroom.create({
      data: {
        name: 'Test Class 101',
        teacherId: teacherUser.id,
        level: Level.Elementary,
      }
    });

    const studentEmail = 'student.test@bilkent.edu.tr';
    testStudent = await prisma.user.upsert({
      where: { email: studentEmail },
      update: { classroomId: testClassroom.id },
      create: {
        email: studentEmail,
        name: 'Test Student',
        password,
        role: 'STUDENT',
        classroomId: testClassroom.id,
      }
    });

    await prisma.streak.upsert({
      where: { userId: testStudent.id },
      update: { currentStreak: 5, totalPoints: 100 },
      create: {
        userId: testStudent.id,
        currentStreak: 5,
        totalPoints: 100
      }
    });
  });

  test.afterAll(async () => {
    if (testStudent) {
      await prisma.user.delete({ where: { id: testStudent.id } }).catch(() => {});
    }
    if (testClassroom) {
      await prisma.classroom.delete({ where: { id: testClassroom.id } }).catch(() => {});
    }
    if (teacherUser) {
      await prisma.user.delete({ where: { id: teacherUser.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'teacher.test@bilkent.edu.tr');
    await page.fill('input[type="password"]', 'teacher123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation();
    
    await page.goto('/teacher');
    await page.waitForLoadState('networkidle');
  });

  test('should display Teacher Dashboard and class rosters', async ({ page }) => {
    await expect(page.locator('p', { hasText: 'Class: Test Class 101' })).toBeVisible();
    await expect(page.getByText('Test Student').first()).toBeVisible();
  });

  test('should display Analytics panel with performance, error debt, and streaks data', async ({ page }) => {
    const analyticsTab = page.getByText('Analytics', { exact: true }).first();
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
    }
    
    await expect(page.getByText('Performance', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Error Debt', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Streak', { exact: false }).first()).toBeVisible();
  });

  test('should allow editing student accounts from the roster', async ({ page }) => {
    // Hover over the student row to reveal the edit button
    const studentRow = page.locator('tr').filter({ hasText: 'Test Student' }).first();
    await studentRow.hover();
    
    const editButton = studentRow.locator('button[title="Edit Student"]');
    await expect(editButton).toBeVisible();
    await editButton.click();
    
    await expect(page.getByText('Edit', { exact: false }).first()).toBeVisible();
  });
});
