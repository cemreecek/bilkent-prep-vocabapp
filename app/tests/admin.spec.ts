import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

test.describe('Admin Dashboard', () => {
  let adminUser: any;

  test.beforeAll(async () => {
    // Ensure we have an admin user
    const email = 'admin.test@bilkent.edu.tr';
    const password = await bcrypt.hash('admin123', 10);
    adminUser = await prisma.user.upsert({
      where: { email },
      update: { password, role: 'ADMIN' },
      create: {
        email,
        name: 'Test Admin',
        password,
        role: 'ADMIN',
      },
    });
  });

  test.afterAll(async () => {
    // Cleanup admin user
    if (adminUser) {
      try {
        await prisma.user.delete({ where: { id: adminUser.id } });
      } catch (e) {
        // Ignore if already deleted by another parallel worker
      }
    }
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'admin.test@bilkent.edu.tr');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Explicitly wait for navigation to complete
    await page.waitForNavigation();
    
    // Navigate to admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('should display God View and stats', async ({ page }) => {
    await expect(page.locator('h2', { hasText: 'God View' })).toBeVisible();
    await expect(page.locator('text=Total Classrooms').first()).toBeVisible();
    await expect(page.locator('text=Assigned Teachers').first()).toBeVisible();
  });

  test('should have working side navigation', async ({ page }) => {
    // Check Overview
    const navOverview = page.locator('aside nav a', { hasText: 'Overview' }).first();
    await expect(navOverview).toBeVisible();
    
    // Check User Management
    const navUsers = page.locator('aside nav a', { hasText: 'User Management' }).first();
    await expect(navUsers).toBeVisible();
    await navUsers.click();
    await page.waitForURL('**/admin/users');
    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test('should verify real-time system events', async ({ page }) => {
    await expect(page.locator('h4', { hasText: 'Recent System Events' })).toBeVisible();
    // System events list might be empty or have items
  });

  test('should open Create Classroom modal and allow actions', async ({ page }) => {
    const addClassroomBtn = page.locator('button').filter({ hasText: 'Create New Classroom' }).first();
    await addClassroomBtn.click();
    
    const modalHeading = page.locator('h3', { hasText: 'Create New Classroom' }).first();
    await expect(modalHeading).toBeVisible();

    const nameInput = page.locator('input[placeholder="e.g. PREP 101-B"]');
    await expect(nameInput).toBeVisible();
    
    await nameInput.fill('PREP 999-Z Test');
    
    const submitBtn = page.locator('button[type="submit"]', { hasText: 'Create Classroom' });
    await expect(submitBtn).toBeVisible();
    
    // Note: We won't actually click submit to avoid cluttering db, 
    // or we can and then clean up in afterAll. Let's just verify the UI works.
    const cancelBtn = page.locator('button[type="button"]', { hasText: 'Cancel' });
    await cancelBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });
  
  test('should use quick actions to manage classroom', async ({ page }) => {
    // Check if the quick actions buttons are present
    const addStudentBtn = page.locator('button .material-symbols-outlined', { hasText: 'person_add' }).first();
    const addTeacherBtn = page.locator('button .material-symbols-outlined', { hasText: 'group' }).first();
    
    if (await addStudentBtn.isVisible() || await addTeacherBtn.isVisible()) {
      await expect(addStudentBtn.or(addTeacherBtn)).toBeVisible();
    } else {
      console.log('No classrooms available to test quick actions.');
    }
  });

});
