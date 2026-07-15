import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

test.describe('Student Dashboard & Practice', () => {

  test.beforeAll(async () => {
    // Delete existing test data to avoid state leaking from previous runs
    await prisma.errorLog.deleteMany({});
    await prisma.practiceQuestion.deleteMany({ where: { week: 99 } });
    await prisma.vocabList.deleteMany({ where: { unit: 'Unit 99' } });

    const password = await bcrypt.hash('student123', 10);
    
    await prisma.user.upsert({
      where: { email: 'upper.test@bilkent.edu.tr' },
      update: { password, role: 'STUDENT', level: 'UpperIntermediate', errorScore: 0, name: 'Upper' },
      create: {
        email: 'upper.test@bilkent.edu.tr',
        name: 'Upper',
        password,
        role: 'STUDENT',
        level: 'UpperIntermediate',
        errorScore: 0
      },
    });

    await prisma.user.upsert({
      where: { email: 'prefac.test@bilkent.edu.tr' },
      update: { password, role: 'STUDENT', level: 'PreFac', errorScore: 0, name: 'PreFac' },
      create: {
        email: 'prefac.test@bilkent.edu.tr',
        name: 'PreFac',
        password,
        role: 'STUDENT',
        level: 'PreFac',
        errorScore: 0
      },
    });

    // Create some VocabList and words/questions if not exist
    for (const level of ['UpperIntermediate', 'PreFac'] as const) {
      let list = await prisma.vocabList.findFirst({ where: { level, unit: 'Unit 99' } });
      if (!list) {
        list = await prisma.vocabList.create({
          data: {
            level,
            unit: 'Unit 99',
            words: {
              create: [
                {
                  word: `testword_${level}`,
                  definition: 'test definition',
                  week: 99,
                  day: 1
                }
              ]
            }
          }
        });
        
        await prisma.practiceQuestion.create({
          data: {
            listId: list.id,
            week: 99,
            questionText: 'Test question text',
            instruction: 'Choose the correct option',
            type: 'multiple-choice',
            correctAnswer: `testword_${level}`,
            options: {
              create: [
                { text: `testword_${level}`, isCorrect: true },
                { text: 'Wrong Option', isCorrect: false }
              ]
            }
          }
        });
      }
    }
  });

  test.afterAll(async () => {
    // Delete ErrorLog first due to foreign key constraints
    await prisma.errorLog.deleteMany({});
    
    // Also delete the test list to keep db clean
    await prisma.vocabList.deleteMany({ where: { unit: 'Unit 99' } });

    await prisma.user.deleteMany({
      where: {
        email: { in: ['upper.test@bilkent.edu.tr', 'prefac.test@bilkent.edu.tr'] }
      }
    });
    await prisma.$disconnect();
  });

  const runStudentTests = (email: string, level: string, displayName: string, firstName: string) => {
    test.describe(`Tests for ${displayName}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto('/auth/signin');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', 'student123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
      });

      test('should check dashboard, flashcards, take practice, and verify error debt', async ({ page }) => {
        // 1. Verify dashboard access
        await expect(page.locator('h1', { hasText: `Welcome back, ${firstName}` })).toBeVisible();

        // 2. Check initial error debt is 0
        await expect(page.locator('body')).toContainText('Action Required0');

        // 3. Access Practice/Flashcards
        await page.click(`a[href="/practice/${level}"]`);
        await page.waitForURL(`**/practice/${level}`);
        
        // Click on the set (Week 99)
        await page.click(`text=Set 99`);
        
        // Flashcards
        await page.click(`text=Day 1`);
        
        // Wait for flashcards to load or show no cards
        await page.waitForTimeout(1000);
        
        // Just click the close button or Go Back to exit flashcards view
        await page.click('button:has-text("close"), button:has-text("Go Back")'); 
        
        // Wait for overview to be back
        await page.waitForSelector('text=Practice Material');
        
        // Practice
        await page.click(`text=Practice Material`);
        
        // Wait for first question to load
        await page.waitForSelector('text=Choose the correct option', { timeout: 10000 });

        // Answer INCORRECTLY for all questions
        while (await page.locator('text=Choose the correct option').isVisible()) {
            await page.click('text=Wrong Option');
            await page.waitForTimeout(1600); // Wait for 1.5s auto-advance
        }
        
        // Verify we get to practice complete
        await expect(page.locator('h2', { hasText: 'Practice Complete!' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('body')).toContainText(/Error Debt Accumulated: [1-9]/);
        
        // Wait for the background submission to complete before navigating
        await page.waitForTimeout(1500);

        // Go back to dashboard
        await page.goto('/dashboard');
        
        // Verify error debt increased in the dashboard
        await expect(page.locator('body')).toContainText(/Action Required[1-9]/);
      });
    });
  };

  runStudentTests('upper.test@bilkent.edu.tr', 'UpperIntermediate', 'Upper Intermediate Student', 'Upper');
  runStudentTests('prefac.test@bilkent.edu.tr', 'PreFac', 'Pre-Faculty Student', 'PreFac');
});

