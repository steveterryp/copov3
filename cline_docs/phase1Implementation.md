# Phase 1: Foundation Implementation

## Database Schema Implementation

### Prisma Schema Updates
```prisma
// Add to prisma/schema.prisma

model PoV {
  id              String    @id @default(cuid())
  title           String
  description     String
  status          PovStatus
  startDate       DateTime
  endDate         DateTime
  customer        Customer  @relation(fields: [customerId], references: [id])
  customerId      String
  budget          Float
  priority        Priority
  successCriteria SuccessCriteria[]
  phases          Phase[]
  tasks           Task[]
  documents       Document[]
  team           TeamMember[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Customer {
  id           String    @id @default(cuid())
  name         String
  contactInfo  String
  requirements String[]
  povs         PoV[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Phase {
  id          String     @id @default(cuid())
  name        String
  description String
  startDate   DateTime
  endDate     DateTime
  status      PhaseStatus
  type        PhaseType
  pov         PoV        @relation(fields: [povId], references: [id])
  povId       String
  tasks       Task[]
  documents   Document[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Task {
  id          String     @id @default(cuid())
  title       String
  description String
  status      TaskStatus
  priority    Priority
  dueDate     DateTime
  phase       Phase      @relation(fields: [phaseId], references: [id])
  phaseId     String
  pov         PoV        @relation(fields: [povId], references: [id])
  povId       String
  blockers    Blocker[]
  documents   Document[]
  assignedTo  TeamMember[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Blocker {
  id          String    @id @default(cuid())
  description String
  status      BlockerStatus
  task        Task      @relation(fields: [taskId], references: [id])
  taskId      String
  createdAt   DateTime  @default(now())
  resolvedAt  DateTime?
}

model Document {
  id        String      @id @default(cuid())
  name      String
  type      DocumentType
  url       String
  version   Int         @default(1)
  pov       PoV         @relation(fields: [povId], references: [id])
  povId     String
  phase     Phase?      @relation(fields: [phaseId], references: [id])
  phaseId   String?
  task      Task?       @relation(fields: [taskId], references: [id])
  taskId    String?
  createdBy String
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}

model TeamMember {
  id        String    @id @default(cuid())
  userId    String
  role      TeamRole
  pov       PoV       @relation(fields: [povId], references: [id])
  povId     String
  tasks     Task[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model SuccessCriteria {
  id          String    @id @default(cuid())
  description String
  metrics     String
  targetValue String
  actualValue String?
  status      CriteriaStatus
  pov         PoV       @relation(fields: [povId], references: [id])
  povId       String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum PovStatus {
  PLANNING
  IN_PROGRESS
  ON_HOLD
  COMPLETED
}

enum PhaseStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}

enum PhaseType {
  CRITERIA_DEFINITION
  SCOPE_DEFINITION
  PROVISIONING
  EXECUTION
  ASSESSMENT
  PRESENTATION
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  BLOCKED
  REVIEW
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum BlockerStatus {
  ACTIVE
  RESOLVED
}

enum DocumentType {
  CRITERIA
  SCOPE
  SETUP
  RESULT
  OTHER
}

enum TeamRole {
  LEAD
  MEMBER
  STAKEHOLDER
}

enum CriteriaStatus {
  PENDING
  MET
  NOT_MET
}
```

## Core API Endpoints Implementation

### Base API Handler
```typescript
// lib/api/pov-handler.ts

import { createApiHandler } from '../api-handler';
import { prisma } from '../prisma';
import { ApiError } from '../errors';

export const povHandler = createApiHandler({
  // Add authentication and validation middleware
  middleware: [
    authenticateUser,
    validateRequest,
  ],
  
  // Define error handling
  onError: (error, req, res) => {
    console.error(`[PoV API Error]: ${error.message}`, error);
    return {
      status: error instanceof ApiError ? error.status : 500,
      data: {
        error: error.message,
        code: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
      },
    };
  },
});
```

### PoV Routes
```typescript
// app/api/pov/route.ts

import { povHandler } from '@/lib/api/pov-handler';
import { createPovSchema, updatePovSchema } from '@/lib/validation/pov';

export const GET = povHandler({
  async handler(req) {
    const { page = 1, limit = 10, status } = req.query;
    
    const povs = await prisma.pov.findMany({
      where: status ? { status } : undefined,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: true,
        phases: true,
        _count: {
          select: {
            tasks: true,
            documents: true,
          },
        },
      },
    });
    
    return { data: povs };
  },
});

export const POST = povHandler({
  async handler(req) {
    const data = createPovSchema.parse(await req.json());
    
    const pov = await prisma.pov.create({
      data: {
        ...data,
        status: 'PLANNING',
      },
      include: {
        customer: true,
      },
    });
    
    return { data: pov, status: 201 };
  },
});
```

## Base UI Components

### PoV Card Component
```typescript
// components/pov/PoVCard.tsx

interface PoVCardProps {
  pov: PoV;
  onSelect?: (id: string) => void;
  onStatusChange?: (id: string, status: PovStatus) => void;
}

export function PoVCard({ pov, onSelect, onStatusChange }: PoVCardProps) {
  return (
    <Card>
      <CardHeader
        title={pov.title}
        subheader={`Customer: ${pov.customer.name}`}
        action={
          <StatusChip
            status={pov.status}
            onChange={onStatusChange ? (status) => onStatusChange(pov.id, status) : undefined}
          />
        }
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {pov.description}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Timeline>
            <TimelineItem>
              <TimelineDot color="primary" />
              <TimelineContent>
                Start: {format(pov.startDate, 'MMM d, yyyy')}
              </TimelineContent>
            </TimelineItem>
            <TimelineItem>
              <TimelineDot color="primary" />
              <TimelineContent>
                End: {format(pov.endDate, 'MMM d, yyyy')}
              </TimelineContent>
            </TimelineItem>
          </Timeline>
        </Box>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          onClick={() => onSelect?.(pov.id)}
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
}
```

### PoV List Component
```typescript
// components/pov/PoVList.tsx

interface PoVListProps {
  povs: PoV[];
  onSelect?: (id: string) => void;
  onStatusChange?: (id: string, status: PovStatus) => void;
}

export function PoVList({ povs, onSelect, onStatusChange }: PoVListProps) {
  return (
    <Grid container spacing={2}>
      {povs.map((pov) => (
        <Grid item xs={12} sm={6} md={4} key={pov.id}>
          <PoVCard
            pov={pov}
            onSelect={onSelect}
            onStatusChange={onStatusChange}
          />
        </Grid>
      ))}
    </Grid>
  );
}
```

## Testing Setup

### API Tests
```typescript
// app/api/pov/__tests__/pov.test.ts

import { createTestPov } from '@/test/factories/pov';
import { apiTest } from '@/test/utils/api';

describe('PoV API', () => {
  describe('GET /api/pov', () => {
    it('should return paginated PoVs', async () => {
      const povs = await Promise.all([
        createTestPov(),
        createTestPov(),
        createTestPov(),
      ]);
      
      const response = await apiTest.get('/api/pov?page=1&limit=2');
      
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveLength(2);
    });
    
    it('should filter by status', async () => {
      const pov = await createTestPov({ status: 'IN_PROGRESS' });
      
      const response = await apiTest.get('/api/pov?status=IN_PROGRESS');
      
      expect(response.status).toBe(200);
      expect(response.data.data[0].id).toBe(pov.id);
    });
  });
});
```

### Component Tests
```typescript
// components/pov/__tests__/PoVCard.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { PoVCard } from '../PoVCard';
import { createTestPov } from '@/test/factories/pov';

describe('PoVCard', () => {
  it('should render PoV details', () => {
    const pov = createTestPov();
    
    render(<PoVCard pov={pov} />);
    
    expect(screen.getByText(pov.title)).toBeInTheDocument();
    expect(screen.getByText(`Customer: ${pov.customer.name}`)).toBeInTheDocument();
  });
  
  it('should call onSelect when view details is clicked', () => {
    const pov = createTestPov();
    const onSelect = jest.fn();
    
    render(<PoVCard pov={pov} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByText('View Details'));
    
    expect(onSelect).toHaveBeenCalledWith(pov.id);
  });
});
```

## Next Steps

1. Database Setup
   - [ ] Review and refine schema
   - [ ] Create initial migration
   - [ ] Set up test database
   - [ ] Create data factories

2. API Implementation
   - [ ] Set up validation schemas
   - [ ] Implement CRUD endpoints
   - [ ] Add error handling
   - [ ] Write API tests

3. UI Components
   - [ ] Create base components
   - [ ] Add form validation
   - [ ] Implement loading states
   - [ ] Write component tests

4. Integration
   - [ ] Connect UI to API
   - [ ] Add error handling
   - [ ] Implement loading states
   - [ ] Write integration tests
