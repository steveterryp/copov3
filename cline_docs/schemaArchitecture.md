# Schema Architecture

## Current Challenges

1. Schema Size:
- Current: ~400 lines, 18 models, 11 enums
- Proposed additions: ~200 lines, 5 new models
- Total would be ~600 lines

2. Complexity Concerns:
- Many interrelated models
- Multiple domains mixed together
- Growing number of enums
- Complex type relationships between Prisma and application code

## Solution: Single File with Clear Organization

After exploring various options, we've determined that the best approach is to maintain a single schema file with clear organization and documentation. This decision is based on:

1. **Prisma Limitations**:
   - Prisma doesn't support importing/splitting schema files
   - All model definitions must be in a single file
   - Models with relationships must be defined in the same file

2. **Chosen Approach**:
   - Single `schema.prisma` file
   - Clear section headers
   - Consistent organization
   - Comprehensive comments

### File Structure

```prisma
/////////////////////////////////
// Configuration
/////////////////////////////////

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

/////////////////////////////////
// Enums
/////////////////////////////////

// Status Enums
enum POVStatus {
  // ...
}

// Priority Enums
enum Priority {
  // ...
}

// Role Enums
enum UserRole {
  // ...
}

/////////////////////////////////
// Auth Domain
/////////////////////////////////

model User {
  // ...
}

// ... etc
```

### Organization Rules

1. **Section Order**:
   - Configuration (generator, datasource)
   - Enums (grouped by type)
   - Models (grouped by domain)

2. **Enum Groups**:
   - Status enums
   - Priority enums
   - Role enums
   - Other enums

3. **Domain Groups**:
   - Auth Domain (User, Role, RefreshToken)
   - Team Domain (Team, TeamMember)
   - POV Domain (POV, Phase)
   - Task Domain (Task, Comment, Attachment)
   - Activity Domain (Activity, Notification)
   - Support Domain (Support, Feature requests)

### Type System Integration

1. **Prisma Type Mapping**:
   ```typescript
   // Type-safe Prisma result mapping
   interface PrismaResult<T> {
     data: T;
     count?: number;
     error?: {
       code: string;
       message: string;
       target?: string;
     };
   }

   // Type-safe model interfaces
   interface PrismaModel {
     id: string;
     createdAt: Date;
     updatedAt: Date;
   }

   // Type-safe relation loading
   type WithRelations<T, R extends string> = T & {
     [K in R]: K extends keyof T ? NonNullable<T[K]> : never;
   };
   ```

2. **Type Safety Considerations**:
   ```typescript
   // Type-safe null handling
   function handleNullableRelation<T, K extends keyof T>(
     model: T,
     key: K
   ): NonNullable<T[K]> | null {
     return model[key] ?? null;
   }

   // Type-safe data transformation
   function transformPrismaResult<T extends PrismaModel, R>(
     result: T,
     transform: (data: T) => R
   ): R {
     try {
       return transform(result);
     } catch (error) {
       console.error('[Transform Error]:', error);
       throw new Error(`Failed to transform data: ${error.message}`);
     }
   }

   // Type-safe relation checking
   function hasRelation<T extends PrismaModel, K extends keyof T>(
     model: T,
     key: K
   ): model is T & Required<Pick<T, K>> {
     return key in model && model[key] !== null;
   }
   ```

3. **Best Practices**:
   ```typescript
   // Type-safe model creation
   async function createModel<T extends PrismaModel>(
     model: string,
     data: Omit<T, keyof PrismaModel>
   ): Promise<T> {
     try {
       return await prisma[model].create({
         data: {
           ...data,
           createdAt: new Date(),
           updatedAt: new Date()
         }
       });
     } catch (error) {
       console.error('[Create Model Error]:', error);
       throw new Error(`Failed to create ${model}: ${error.message}`);
     }
   }

   // Type-safe relation updates
   async function updateModelRelations<
     T extends PrismaModel,
     R extends string
   >(
     model: string,
     id: string,
     relations: Partial<Record<R, unknown>>
   ): Promise<WithRelations<T, R>> {
     try {
       return await prisma[model].update({
         where: { id },
         data: relations,
         include: Object.keys(relations).reduce((acc, key) => ({
           ...acc,
           [key]: true
         }), {})
       });
     } catch (error) {
       console.error('[Update Relations Error]:', error);
       throw new Error(`Failed to update ${model} relations: ${error.message}`);
     }
   }
   ```

### Maintenance Guidelines

1. **Adding New Models**:
   - Add to appropriate domain section
   - Maintain section comments
   - Keep related models together
   - Create corresponding TypeScript interfaces

2. **Adding New Enums**:
   - Add to appropriate enum section
   - Follow naming conventions
   - Group with similar types
   - Update TypeScript type definitions

3. **Code Reviews**:
   - Check domain placement
   - Verify enum grouping
   - Maintain section headers
   - Validate type safety

### Organization Script

We maintain a script (`scripts/organize-schema.ts`) that helps enforce this organization:

1. **Purpose**:
   - Maintains consistent structure
   - Groups related models and enums
   - Adds clear section headers

2. **When to Use**:
   - After adding new models/enums
   - During major refactoring
   - Before committing schema changes

3. **Usage**:
```bash
cd scripts
npx ts-node organize-schema.ts
cd ..
npx prisma format
```

### Benefits

1. **Readability**:
   - Clear visual separation
   - Logical grouping
   - Easy navigation

2. **Maintainability**:
   - Consistent structure
   - Domain-driven organization
   - Clear relationships

3. **Tool Support**:
   - Full Prisma validation
   - IDE functionality
   - No build step needed

4. **Development Workflow**:
   - Easy to find related code
   - Clear domain boundaries
   - Efficient navigation

This approach provides a good balance between organization and practicality while maintaining full tool support and avoiding the complexities of schema splitting.

## Implementation Status (2025-02-15)

### Completed Implementation

1. **Schema Organization**
   - ✅ Created organize-schema.ts script
   - ✅ Implemented domain-based grouping
   - ✅ Added enum categorization
   - ✅ Established clear section headers
   - ✅ Added type system integration

2. **Database Migration**
   - ✅ Created schema backup (prisma/schema.prisma.backup)
   - ✅ Created database backup (backups/copov2_backup.sql)
   - ✅ Generated and applied migration (20250213010158_organize_schema)
   - ✅ Validated schema and database sync

3. **Tooling Setup**
   - ✅ Generated updated Prisma Client
   - ✅ Verified schema validation
   - ✅ Confirmed database synchronization
   - ✅ Added type safety improvements

4. **Testing Implementation**
   - ✅ Created test-workflow.ts for workflow system
   - ✅ Created test-api-integration.ts for cross-service testing
   - ✅ Created test-crm-sync.ts for CRM integration
   - ✅ Implemented comprehensive test coverage
   - ✅ Added proper error handling and cleanup
   - ✅ Added type safety tests

### Current Status

- Organization Strategy: Implemented and validated
- Schema Structure: Clean and organized by domain
- Database: Successfully migrated and synchronized
- Tooling: Updated and functional
- Testing: Core test scripts implemented and passing
- Type Safety: Improved and documented

### Schema Update Process

1. **Creating Domain Schema Files**
   - Create new schema files in `prisma/domains/` directory
   - Name files descriptively (e.g., `workflow.prisma`, `notifications.prisma`)
   - Include related enums and models in domain file
   - Add clear comments and documentation
   - Create corresponding TypeScript types

2. **Update Steps**
   - Create backup of current schema: `copy prisma/schema.prisma prisma/schema.prisma.backup`
   - Add new models/enums in domain-specific files
   - Update domain map in `organize-schema.ts` to include new models
   - Run organize script: `ts-node scripts/organize-schema.ts`
   - Verify merged schema: `npx prisma format`
   - Generate migration: `npx prisma migrate dev --name descriptive_name`
   - Update related services and types
   - Create test scripts for new functionality
   - Update TypeScript interfaces

3. **Best Practices**
   - Keep domain files focused and cohesive
   - Include related enums with their models
   - Document relationships and constraints
   - Follow existing naming conventions
   - Add models to appropriate domain groups
   - Update domain map for new models
   - Test thoroughly before merging
   - Maintain type safety

4. **Rollback Plan**
   - Keep schema backups (both .backup and .bak)
   - Document migration steps
   - Test migrations in development first
   - Have clear rollback procedures
   - Maintain database backups

### Next Steps

1. **Testing & Validation**
   - [✓] Create direct test scripts for each domain
   - [✓] Test with real database operations
   - [✓] Verify complete workflows
   - [✓] Test type safety improvements
   - [ ] Test KPI history functionality
   - [ ] Monitor system performance

### Testing Strategy
- Prefer direct test scripts over unit tests
- Test complete workflows with real database operations
- Create scripts in scripts/ directory following established patterns:
  - test-crm-sync.ts: Tests CRM integration
  - test-workflow.ts: Tests workflow system
  - test-api-integration.ts: Tests cross-service integration
  - test-kpi-history.ts: Tests KPI history tracking

Example test implementation:
```typescript
// Type-safe test data creation
interface TestData<T extends PrismaModel> {
  model: T;
  relations: Record<string, unknown>;
  cleanup: () => Promise<void>;
}

async function createTestData<T extends PrismaModel>(
  model: string,
  data: Omit<T, keyof PrismaModel>,
  relations: Record<string, unknown> = {}
): Promise<TestData<T>> {
  const createdModel = await createModel<T>(model, data);
  
  if (Object.keys(relations).length > 0) {
    await updateModelRelations(
      model,
      createdModel.id,
      relations
    );
  }

  return {
    model: createdModel,
    relations,
    cleanup: async () => {
      await prisma[model].delete({
        where: { id: createdModel.id }
      });
    }
  };
}

// Type-safe test execution
async function runTest<T extends PrismaModel>(
  name: string,
  setup: () => Promise<TestData<T>>,
  test: (data: TestData<T>) => Promise<void>
): Promise<void> {
  console.log(`[Test] Starting: ${name}`);
  let testData: TestData<T> | null = null;

  try {
    testData = await setup();
    await test(testData);
    console.log(`[Test] Passed: ${name}`);
  } catch (error) {
    console.error(`[Test] Failed: ${name}`, error);
    throw error;
  } finally {
    if (testData) {
      await testData.cleanup().catch(error => {
        console.error(`[Test] Cleanup failed: ${name}`, error);
      });
    }
  }
}

// Example usage
describe('POV Workflow', () => {
  it('should handle complete workflow', async () => {
    await runTest(
      'Complete POV Workflow',
      async () => createTestData('pov', {
        title: 'Test POV',
        status: 'DRAFT'
      }, {
        team: {
          create: {
            name: 'Test Team'
          }
        }
      }),
      async (data) => {
        // Test implementation
        const result = await testWorkflow(data.model.id);
        expect(result.status).toBe('COMPLETED');
      }
    );
  });
});
```

Each test script follows consistent pattern:
1. Setup test data with type safety
2. Test functionality with error handling
3. Verify results with type checking
4. Clean up test data with transaction safety
5. Handle errors with proper logging
- Include proper error handling and type safety checks
- Use transaction blocks for atomic operations
- Document test results and any schema issues discovered

### Test Script Structure
```typescript
// Example from test-api-integration.ts
async function testFeature() {
  let testData;
  
  try {
    // 1. Setup
    testData = await createTestData();
    
    // 2. Test functionality
    const result = await performOperation(testData);
    
    // 3. Verify
    if (!verifyResult(result)) {
      throw new Error('Verification failed');
    }
    
    // 4. Cleanup
    await cleanup(testData);
    
  } catch (error) {
    // Error handling
    await handleError(error, testData);
  }
}
```

## Related Documentation
- [Type System Guidelines](./typeSystemGuidelines.md)
- [API Documentation](./api_refactoring_guide.md)
- [Testing Guidelines](./testingPhases.md)
