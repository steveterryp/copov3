# Phase 1.5 Database Schema Changes

## Overview
This document details the database schema changes made to support:
- Activity tracking across all entities
- Phase ordering functionality
- Real-time activity feeds
- Historical data access

## Schema Changes

### 1. Activity Model
```prisma
// Activity tracking
enum ActivityType {
  TASK
  POV
  PHASE
  DOCUMENT
}

enum ActivityAction {
  CREATE
  UPDATE
  DELETE
  COMPLETE
  ASSIGN
  COMMENT
  UPLOAD
}

model Activity {
  id        String         @id @default(cuid())
  type      ActivityType
  action    ActivityAction
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  pov       PoV?          @relation(fields: [povId], references: [id], onDelete: SetNull)
  povId     String?
  phase     Phase?        @relation(fields: [phaseId], references: [id], onDelete: SetNull)
  phaseId   String?
  task      Task?         @relation(fields: [taskId], references: [id], onDelete: SetNull)
  taskId    String?
  metadata  Json?
  createdAt DateTime      @default(now())

  @@index([userId])
  @@index([povId])
  @@index([phaseId])
  @@index([taskId])
  @@index([createdAt(sort: Desc)])
}
```

### 2. Phase Model Updates
```prisma
model Phase {
  // ... existing fields ...
  order       Int         @default(0)  // Added for ordering
  @@index([povId, order]) // Added for efficient ordering queries
}
```

## Migration Steps

### 1. Activity Model Migration
```sql
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('TASK', 'POV', 'PHASE', 'DOCUMENT');
CREATE TYPE "ActivityAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'COMPLETE', 'ASSIGN', 'COMMENT', 'UPLOAD');

-- CreateTable
CREATE TABLE "Activity" (
  "id" TEXT NOT NULL,
  "type" "ActivityType" NOT NULL,
  "action" "ActivityAction" NOT NULL,
  "userId" TEXT NOT NULL,
  "povId" TEXT,
  "phaseId" TEXT,
  "taskId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");
CREATE INDEX "Activity_povId_idx" ON "Activity"("povId");
CREATE INDEX "Activity_phaseId_idx" ON "Activity"("phaseId");
CREATE INDEX "Activity_taskId_idx" ON "Activity"("taskId");
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt" DESC);

-- AddForeignKeys
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_povId_fkey" 
  FOREIGN KEY ("povId") REFERENCES "PoV"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_phaseId_fkey" 
  FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_taskId_fkey" 
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### 2. Phase Ordering Migration
```sql
-- Add order column
ALTER TABLE "Phase" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Create index for efficient ordering
CREATE INDEX "Phase_povId_order_idx" ON "Phase"("povId", "order");

-- Initialize order for existing phases
WITH numbered_phases AS (
  SELECT id, povId, ROW_NUMBER() OVER (PARTITION BY povId ORDER BY createdAt) - 1 as new_order
  FROM "Phase"
)
UPDATE "Phase" p
SET order = np.new_order
FROM numbered_phases np
WHERE p.id = np.id;
```

## Design Considerations

### 1. Activity Model
- **Polymorphic Relationships**
  - Flexible entity tracking
  - Optional relationships
  - Soft delete support

- **Indexing Strategy**
  - User activity queries
  - Entity-specific lookups
  - Timeline-based access

- **Metadata Handling**
  - JSONB for flexibility
  - Action-specific data
  - Historical context

### 2. Phase Ordering
- **Order Field**
  - Zero-based indexing
  - Per-PoV ordering
  - Gap strategy for reordering

- **Performance**
  - Composite index
  - Batch updates
  - Efficient reordering

### 3. Data Integrity
- **Cascade Rules**
  - User deletion cascades
  - Entity soft deletes
  - Reference preservation

- **Constraints**
  - Foreign key integrity
  - Enum validation
  - Index maintenance

## Query Patterns

### 1. Activity Queries
```sql
-- Recent activities for a user
SELECT * FROM "Activity"
WHERE "userId" = :userId
ORDER BY "createdAt" DESC
LIMIT :limit;

-- Activities for a PoV
SELECT * FROM "Activity"
WHERE "povId" = :povId
ORDER BY "createdAt" DESC;

-- Entity-specific timeline
SELECT * FROM "Activity"
WHERE "type" = :entityType
  AND "action" = :actionType
ORDER BY "createdAt" DESC;
```

### 2. Phase Ordering Queries
```sql
-- Get ordered phases
SELECT * FROM "Phase"
WHERE "povId" = :povId
ORDER BY "order";

-- Reorder phases
WITH to_update AS (
  SELECT id, 
    CASE 
      WHEN "order" >= :newOrder THEN "order" + 1
      ELSE "order"
    END as new_order
  FROM "Phase"
  WHERE "povId" = :povId
    AND "order" >= :newOrder
)
UPDATE "Phase" p
SET "order" = tu.new_order
FROM to_update tu
WHERE p.id = tu.id;
```

## Performance Considerations

1. **Indexing**
   - Strategic index placement
   - Composite indexes
   - Partial indexes where applicable

2. **Query Optimization**
   - Efficient joins
   - Batch operations
   - Cursor-based pagination

3. **Data Management**
   - Regular maintenance
   - Archive strategies
   - Cleanup procedures
