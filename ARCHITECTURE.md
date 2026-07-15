# Three-Module Student Learning Architecture

## Overview
This document outlines the scalable, component-driven architecture for three distinct student-facing learning modules.

---

## 1. Database Architecture Updates

### New Models to Add to `schema.prisma`

```prisma
// Personal Vocabulary Journal
model JournalEntry {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  word         String   // The target word
  definition   String   // User's own definition/meaning
  collocations String   // Common collocations or phrases
  sentence     String   // User's own sentence demonstrating usage
  
  // Metadata
  difficulty   Int      @default(1) // 1-5 scale for self-assessment
  source       String?  // Where the word was encountered (book, class, etc.)
  tags         String[] @default([]) // User-defined tags for organization
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([userId])
  @@index([createdAt])
}

// Flashcard Progress Tracking
model FlashcardProgress {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  wordId       String
  word         VocabWord @relation(fields: [wordId], references: [id], onDelete: Cascade)
  
  // Spaced Repetition Metrics
  totalReviews Int      @default(0)
  correctCount Int      @default(0)
  easeFactor   Float    @default(2.5) // SM-2 algorithm
  interval     Int      @default(1)   // Days until next review
  nextReviewAt DateTime?
  
  // Difficulty tracking
  difficulty   Int      @default(0) // 0-4 scale (Anki-like)
  lastReviewAt DateTime?
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@unique([userId, wordId])
  @@index([userId])
  @@index([nextReviewAt])
}

// Practice Attempt Logging
model PracticeAttempt {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  listId       String
  list         VocabList @relation(fields: [listId], references: [id])
  
  practiceMode String   // 'cloze', 'word-bank', 'paraphrase', 'multiple-choice'
  totalItems   Int
  correctCount Int
  duration     Int      // seconds
  
  // Individual responses
  responses    PracticeResponse[]
  
  createdAt    DateTime @default(now())
}

model PracticeResponse {
  id           String   @id @default(cuid())
  attemptId    String
  attempt      PracticeAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  
  wordId       String
  word         VocabWord @relation(fields: [wordId], references: [id])
  
  userResponse String
  isCorrect    Boolean
  timeSpent    Int      // seconds
  
  createdAt    DateTime @default(now())
}
```

### Schema Changes to Existing Models

Add to `User` model:
```prisma
journalEntries   JournalEntry[]
flashcardProgress FlashcardProgress[]
practiceAttempts  PracticeAttempt[]
```

Add to `VocabList` model:
```prisma
practiceAttempts PracticeAttempt[]
```

Add to `VocabWord` model:
```prisma
flashcardProgress FlashcardProgress[]
practiceResponses PracticeResponse[]
```

---

## 2. Next.js Folder Structure

```
src/
├── app/
│   ├── practice/              [EXISTING - Refactor]
│   │   ├── page.tsx
│   │   ├── [practiceId]/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── flashcards/            [NEW]
│   │   ├── page.tsx           (main flashcard dashboard)
│   │   ├── [setId]/
│   │   │   └── page.tsx       (active flashcard review)
│   │   ├── layout.tsx
│   │   └── api/
│   │       └── progress/
│   │           └── route.ts   (update spaced repetition)
│   │
│   ├── journal/               [NEW]
│   │   ├── page.tsx           (journal dashboard)
│   │   ├── [entryId]/
│   │   │   └── page.tsx       (edit entry)
│   │   ├── create/
│   │   │   └── page.tsx       (create new entry)
│   │   ├── layout.tsx
│   │   └── api/
│   │       ├── entries/
│   │       │   ├── route.ts   (GET/POST journal entries)
│   │       │   └── [id]/
│   │       │       ├── route.ts (GET/PUT/DELETE single entry)
│   │       │       └── search/
│   │       │           └── route.ts (search entries)
│   │
│   └── api/
│       ├── practice/          [REFACTOR]
│       │   ├── route.ts       (POST new attempt)
│       │   └── [attemptId]/route.ts (GET attempt details)
│       │
│       └── flashcards/        [NEW]
│           ├── route.ts       (GET available sets)
│           └── [setId]/
│               └── route.ts   (GET set words)
│
├── components/
│   ├── practice/              [NEW]
│   │   ├── PracticeSession.tsx
│   │   ├── QuestionTypes/
│   │   │   ├── ClozeQuestion.tsx
│   │   │   ├── WordBankQuestion.tsx
│   │   │   ├── ParaphraseQuestion.tsx
│   │   │   └── MultipleChoiceQuestion.tsx
│   │   └── PracticeSummary.tsx
│   │
│   ├── flashcards/            [NEW]
│   │   ├── FlashcardDeck.tsx
│   │   ├── FlashcardCard.tsx
│   │   └── ReviewStats.tsx
│   │
│   ├── journal/               [NEW]
│   │   ├── JournalEntryForm.tsx
│   │   ├── JournalEntryCard.tsx
│   │   ├── JournalList.tsx
│   │   └── SearchFilter.tsx
│   │
│   └── shared/
│       ├── ProgressBar.tsx
│       ├── Button.tsx
│       └── Card.tsx
│
└── lib/
    ├── spaced-repetition.ts   [NEW] (SM-2 algorithm)
    ├── anti-cheat.ts          [EXISTING/ENHANCE]
    ├── practice-helpers.ts    [NEW]
    └── journal-helpers.ts     [NEW]
```

---

## 3. Module Responsibilities

### Digital Practice Flow
- **Purpose**: Digitized weekly worksheets with active testing
- **Question Types**: Cloze tests, word banks, paraphrasing, multiple-choice
- **Anti-cheat**: Disabled copy/paste, randomized order, session logging
- **Data Flow**: PracticeAttempt → ErrorLog (for review mode feed)
- **Page**: `/practice`

### Flashcard Flow
- **Purpose**: Spaced repetition review before active tests
- **UI**: Front/back cards, simple navigation
- **Progress Tracking**: FlashcardProgress (SM-2 algorithm)
- **Integration**: Difficult cards → ErrorLog → Review mode
- **Page**: `/flashcards`

### Personal Vocabulary Journal
- **Purpose**: Personal word tracking (outside curriculum)
- **CRUD**: Full create, read, update, delete
- **Fields**: Word, definition, collocations, user sentence, difficulty, tags
- **Page**: `/journal`

---

## 4. Routing Logic

```
Dashboard (/dashboard)
│
├─→ Start Practice (/practice)
│   └─→ Load List → Select Mode → Practice Session → Summary
│
├─→ Review Flashcards (/flashcards)
│   └─→ Select Set → Deck Review → Track Progress
│
└─→ Personal Journal (/journal)
    ├─→ View All Entries
    ├─→ Create New Entry (/journal/create)
    ├─→ Edit Entry (/journal/[entryId])
    └─→ Search/Filter Entries
```

---

## 5. API Routes Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/practice` | POST | Create new practice attempt |
| `/api/practice/[attemptId]` | GET | Get attempt details |
| `/api/flashcards` | GET | List available sets |
| `/api/flashcards/[setId]` | GET | Get set words |
| `/api/flashcards/progress` | PUT | Update spaced repetition progress |
| `/api/journal/entries` | GET, POST | List/create journal entries |
| `/api/journal/entries/[id]` | GET, PUT, DELETE | Single entry operations |
| `/api/journal/entries/search` | GET | Search entries by tags/difficulty |

---

## 6. Implementation Phases

### Phase 1: Database + Utilities
1. Update `schema.prisma` with new models
2. Run `prisma migrate dev`
3. Implement SM-2 spaced repetition algorithm

### Phase 2: Personal Journal (Foundation)
1. Create journal components
2. Build CRUD API routes
3. Deploy `/journal` module

### Phase 3: Flashcards (Spaced Repetition)
1. Build flashcard UI components
2. Create progress tracking routes
3. Deploy `/flashcards` module

### Phase 4: Practice Refactor (Advanced)
1. Extract practice logic into reusable question components
2. Implement individual question types
3. Update to use PracticeAttempt model

---

## 7. Anti-Cheat & Data Protection

- Disable copy/paste on practice questions
- Log all user interactions (keyboard, mouse) with timestamps
- Randomize question order per session (not per page load)
- Store session metadata: start time, end time, duration, device info
- Flag suspicious patterns: too-fast answers, repeated exact matches

---

## 8. Component Communication Pattern

```
Page (e.g., /journal)
  └── Layout (handles session state)
      └── Component (e.g., JournalList)
          ├── Sub-component (JournalEntryCard)
          ├── Sub-component (SearchFilter)
          └── API calls via custom hooks (useJournalEntries)
```

Use React hooks for data fetching and state management across all three modules.

