# Dashboard Architecture Documentation

## Authentication Flow

### Authentication Strategy

1. **Token Management**
   ```typescript
   // lib/auth/get-auth-user.ts
   export const getAuthUser = async (req: Request) => {
     const token = req.cookies.get('auth_token')?.value;
     if (!token) return null;

     try {
       const decoded = await verifyToken(token);
       const user = await prisma.user.findUnique({
         where: { id: decoded.userId },
         select: {
           id: true,
           role: true,
           status: true,
           lastLogin: true
         }
       });

       if (!user || user.status !== 'ACTIVE') return null;
       return user;
     } catch (error) {
       return null;
     }
   };
   ```

2. **Token Refresh Mechanism**
   ```typescript
   // lib/auth/middleware.ts
   export const withAuth = (handler: NextApiHandler) => {
     return async (req: NextApiRequest, res: NextApiResponse) => {
       const user = await getAuthUser(req);
       if (!user) {
         const refreshToken = req.cookies.get('refresh_token')?.value;
         if (refreshToken) {
           try {
             const newToken = await refreshAuthToken(refreshToken);
             setAuthCookie(res, newToken);
             // Continue with new token
           } catch {
             return res.status(401).json({ error: 'Unauthorized' });
           }
         } else {
           return res.status(401).json({ error: 'Unauthorized' });
         }
       }
       return handler(req, res);
     };
   };
   ```

3. **Client-Side Auth State**
   ```typescript
   // components/providers/AuthProvider.tsx
   export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
     const [user, setUser] = useState<User | null>(null);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       const checkAuth = async () => {
         try {
           const response = await fetch('/api/auth/me');
           if (response.ok) {
             const data = await response.json();
             setUser(data);
           }
         } catch (error) {
           console.error('[Auth] Failed to fetch user:', error);
         } finally {
           setLoading(false);
         }
       };

       checkAuth();
     }, []);

     // Auto refresh token before expiry
     useEffect(() => {
       if (!user) return;
       
       const refreshInterval = setInterval(async () => {
         try {
           const response = await fetch('/api/auth/refresh');
           if (!response.ok) throw new Error('Refresh failed');
         } catch (error) {
           console.error('[Auth] Token refresh failed:', error);
         }
       }, 14 * 60 * 1000); // Refresh every 14 minutes

       return () => clearInterval(refreshInterval);
     }, [user]);

     return (
       <AuthContext.Provider value={{ user, loading }}>
         {children}
       </AuthContext.Provider>
     );
   };
   ```

4. **Protected Routes**
   ```typescript
   // middleware.ts
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';
   import { getAuthUser } from '@/lib/auth/get-auth-user';

   export async function middleware(request: NextRequest) {
     // Check if it's a protected route
     if (request.nextUrl.pathname.startsWith('/dashboard')) {
       const user = await getAuthUser(request);
       if (!user) {
         return NextResponse.redirect(new URL('/login', request.url));
       }
     }
     return NextResponse.next();
   }
   ```

## Database Connection Management

### Database Connection Strategy

1. **Prisma Client Singleton**
   ```typescript
   // lib/prisma.ts
   import { PrismaClient } from '@prisma/client';

   const globalForPrisma = globalThis as unknown as {
     prisma: PrismaClient | undefined;
   };

   export const prisma = globalForPrisma.prisma ?? new PrismaClient({
     log: ['query', 'error', 'warn'],
     datasources: {
       db: {
         url: process.env.DATABASE_URL
       }
     },
     // Connection pooling configuration
     connection: {
       pool: {
         min: 2,
         max: 10
       }
     }
   });

   if (process.env.NODE_ENV !== 'production') {
     globalForPrisma.prisma = prisma;
   }
   ```

2. **Transaction Management**
   ```typescript
   // lib/dashboard/services/dashboard.ts
   const withRetry = async <T>(
     operation: () => Promise<T>,
     maxRetries = 3
   ): Promise<T> => {
     let lastError: Error;
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await operation();
       } catch (error) {
         lastError = error as Error;
         if (!isRetryableError(error)) throw error;
         await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
       }
     }
     throw lastError;
   };

   export const getDashboardData = async () => {
     return withRetry(() =>
       prisma.$transaction(async (tx) => {
         // ... transaction operations
       }, {
         maxWait: 5000, // Maximum time to wait for a transaction
         timeout: 10000  // Maximum time for the transaction to complete
       })
     );
   };
   ```

3. **Connection Pool Management**
   - **Initialization**:
     - Minimum 2 connections maintained
     - Maximum 10 connections allowed
     - Automatic scaling based on load

   - **Health Monitoring**:
     ```typescript
     // lib/db-init.ts
     export const checkDatabaseHealth = async () => {
       try {
         await prisma.$queryRaw`SELECT 1`;
         return true;
       } catch (error) {
         console.error('[Database] Health check failed:', error);
         return false;
       }
     };
     ```

   - **Connection Cleanup**:
     ```typescript
     // lib/server-init.ts
     process.on('SIGINT', async () => {
       await prisma.$disconnect();
       process.exit(0);
     });
     ```

4. **Error Handling and Recovery**
   ```typescript
   // lib/errors.ts
   export const isRetryableError = (error: any): boolean => {
     const retryableCodes = [
       'P1001', // Connection error
       'P1002', // Connection timed out
       'P1008', // Operation timed out
       'P1017', // Server closed the connection
       '40001', // Deadlock
       '40P01'  // Deadlock detected
     ];
     return retryableCodes.some(code => error?.code?.includes(code));
   };
   ```

## API Architecture

### Request Flow
1. **Middleware Chain**
   ```typescript
   // middleware.ts
   export default withAuth(
     withRateLimit(
       withErrorHandler(
         // ... other middleware
       )
     )
   );
   ```

2. **API Route Handlers**
   - Implements proper error handling
   - Validates request data
   - Manages response formatting

3. **Data Validation**
   - Input validation using TypeScript
   - Runtime validation checks
   - Error response standardization

### Dashboard Data Architecture

1. **Service Layer**
   ```typescript
   // lib/dashboard/services/dashboard.ts
   export class DashboardService {
     private readonly prisma: PrismaClient;
     
     constructor(prisma: PrismaClient) {
       this.prisma = prisma;
     }

     async getDashboardData(): Promise<DashboardData> {
       return withRetry(() =>
         this.prisma.$transaction(async (tx) => {
           const [
             activePoVs,
             teamStatus,
             milestones,
             resourceUsage,
             riskOverview,
             successRate
           ] = await Promise.all([
             this.getActivePoVs(tx),
             this.getTeamStatus(tx),
             this.getMilestones(tx),
             this.getResourceUsage(tx),
             this.getRiskOverview(tx),
             this.getSuccessRate(tx)
           ]);

           return {
             activePoVs: mapToActivePoVStats(activePoVs),
             teamStatus: mapToTeamStatusData(teamStatus),
             milestones: mapToMilestones(milestones),
             resourceUsage: mapToResourceUsageData(resourceUsage),
             riskOverview: mapToRiskOverviewData(riskOverview),
             successRate: mapToSuccessRateData(successRate)
           };
         }, {
           maxWait: 5000,
           timeout: 10000
         })
       );
     }

     private async getActivePoVs(tx: Prisma.TransactionClient) {
       return tx.pov.findMany({
         where: {
           status: { in: ['IN_PROGRESS', 'VALIDATION'] }
         },
         select: activePoVsSelect
       });
     }

     // ... other private methods
   }
   ```

2. **Data Transformation Layer**
   ```typescript
   // lib/dashboard/prisma/mappers.ts
   export function mapToActivePoVStats(povs: ActivePoVsResult[]): ActivePoVStats {
     const stats = {
       total: povs.length,
       active: 0,
       completed: 0,
       pending: 0,
       byStatus: {} as Record<string, number>
     };

     povs.forEach(pov => {
       stats.byStatus[pov.status] = (stats.byStatus[pov.status] || 0) + 1;

       switch (pov.status) {
         case POVStatus.IN_PROGRESS:
         case POVStatus.VALIDATION:
           stats.active++;
           break;
         case POVStatus.WON:
           stats.completed++;
           break;
         case POVStatus.PROJECTED:
           stats.pending++;
           break;
       }
     });

     return stats;
   }
   ```

3. **Data Selection Layer**
   ```typescript
   // lib/dashboard/prisma/select.ts
   export const activePoVsSelect = {
     id: true,
     title: true,
     status: true,
     priority: true,
     startDate: true,
     endDate: true,
     phases: {
       select: {
         id: true,
         type: true,
         status: true
       }
     }
   } satisfies Prisma.POVSelect;
   ```

4. **API Handler Layer**
   ```typescript
   // lib/dashboard/handlers/get.ts
   export async function handleGetDashboard(
     req: NextApiRequest,
     res: NextApiResponse
   ) {
     try {
       const dashboardService = new DashboardService(prisma);
       const data = await dashboardService.getDashboardData();
       
       return res.json(data);
     } catch (error) {
       console.error('[Dashboard Handler] Error:', error);
       return res.status(500).json({ 
         error: 'Failed to fetch dashboard data' 
       });
     }
   }
   ```

5. **Client-Side Data Management**
   ```typescript
   // lib/dashboard/hooks/useDashboard.ts
   export const useDashboard = () => {
     const queryClient = useQueryClient();

     return useQuery({
       queryKey: ['dashboard'],
       queryFn: async () => {
         const response = await fetch('/api/dashboard');
         if (!response.ok) {
           throw new Error('Failed to fetch dashboard data');
         }
         return response.json();
       },
       staleTime: 30000,
       cacheTime: 3600000,
       retry: (failureCount, error) => {
         // Only retry on network or 5xx errors
         if (error instanceof Error && error.message.includes('Failed to fetch')) {
           return failureCount < 3;
         }
         return false;
       },
       onError: (error) => {
         console.error('[Dashboard] Query error:', error);
         toast.error('Failed to load dashboard data');
       }
     });
   };
   ```

6. **Error Handling Strategy**
   ```typescript
   // lib/dashboard/services/dashboard.ts
   const handleDashboardError = (error: unknown): never => {
     if (error instanceof PrismaClientKnownRequestError) {
       // Handle Prisma-specific errors
       switch (error.code) {
         case 'P2002':
           throw new Error('Duplicate data found');
         case 'P2025':
           throw new Error('Record not found');
         default:
           console.error('[Dashboard Service] Prisma error:', {
             code: error.code,
             message: error.message,
             meta: error.meta
           });
       }
     }

     if (error instanceof Error) {
       console.error('[Dashboard Service] Error:', error.message);
     }

     throw new Error('Failed to process dashboard data');
   };
   ```

## Frontend Implementation

### Widget System Architecture

1. **Base Widget Component**
   ```typescript
   // components/dashboard/widgets/BaseWidget.tsx
   interface BaseWidgetProps<T> {
     title: string;
     isLoading: boolean;
     error?: Error;
     data?: T;
     onRetry: () => void;
     className?: string;
   }

   export function BaseWidget<T>({
     title,
     isLoading,
     error,
     data,
     onRetry,
     children,
     className
   }: PropsWithChildren<BaseWidgetProps<T>>) {
     if (isLoading) {
       return <WidgetSkeleton title={title} className={className} />;
     }

     if (error) {
       return (
         <WidgetErrorBoundary
           title={title}
           error={error}
           onRetry={onRetry}
           className={className}
         />
       );
     }

     if (!data) {
       return null;
     }

     return (
       <Paper className={clsx('p-4', className)}>
         <Typography variant="h6" className="mb-4">
           {title}
         </Typography>
         {children}
       </Paper>
     );
   }
   ```

2. **Widget Error Handling**
   ```typescript
   // components/dashboard/widgets/WidgetErrorBoundary.tsx
   interface WidgetErrorBoundaryProps {
     title: string;
     error: Error;
     onRetry: () => void;
     className?: string;
   }

   export function WidgetErrorBoundary({
     title,
     error,
     onRetry,
     className
   }: WidgetErrorBoundaryProps) {
     return (
       <Paper className={clsx('p-4', className)}>
         <Typography variant="h6" className="mb-4">
           {title}
         </Typography>
         <Alert 
           severity="error"
           action={
             <Button color="inherit" size="small" onClick={onRetry}>
               Retry
             </Button>
           }
         >
           {error.message}
         </Alert>
       </Paper>
     );
   }
   ```

3. **Widget Loading State**
   ```typescript
   // components/dashboard/widgets/WidgetSkeleton.tsx
   interface WidgetSkeletonProps {
     title: string;
     className?: string;
   }

   export function WidgetSkeleton({ title, className }: WidgetSkeletonProps) {
     return (
       <Paper className={clsx('p-4', className)}>
         <Typography variant="h6" className="mb-4">
           {title}
         </Typography>
         <Skeleton variant="rectangular" height={100} />
       </Paper>
     );
   }
   ```

4. **Specific Widget Implementation**
   ```typescript
   // components/dashboard/widgets/ActivePoVs.tsx
   interface ActivePoVsProps {
     className?: string;
   }

   export function ActivePoVs({ className }: ActivePoVsProps) {
     const { data, isLoading, error, refetch } = useDashboard();

     return (
       <BaseWidget
         title="Active PoVs"
         isLoading={isLoading}
         error={error}
         data={data?.activePoVs}
         onRetry={refetch}
         className={className}
       >
         <div className="grid grid-cols-2 gap-4">
           <StatCard
             title="In Progress"
             value={data?.activePoVs.active}
             trend={data?.activePoVs.trend}
           />
           <StatCard
             title="Pending"
             value={data?.activePoVs.pending}
           />
         </div>
       </BaseWidget>
     );
   }
   ```

5. **Widget Layout Management**
   ```typescript
   // app/(authenticated)/dashboard/page.tsx
   export default function DashboardPage() {
     return (
       <div className="grid grid-cols-12 gap-4 p-4">
         <div className="col-span-8">
           <div className="grid grid-cols-2 gap-4 mb-4">
             <ActivePoVs />
             <TeamStatus />
           </div>
           <Milestones className="mb-4" />
           <ResourceUsage />
         </div>
         <div className="col-span-4">
           <RiskOverview className="mb-4" />
           <SuccessRate />
         </div>
       </div>
     );
   }
   ```

6. **Widget State Management**
   ```typescript
   // lib/dashboard/hooks/useWidgetData.ts
   export function useWidgetData<T>(
     selector: (data: DashboardData) => T
   ) {
     const { data, isLoading, error, refetch } = useDashboard();
     
     const widgetData = useMemo(() => {
       if (!data) return undefined;
       return selector(data);
     }, [data, selector]);

     return {
       data: widgetData,
       isLoading,
       error,
       refetch
     };
   }
   ```

### Performance Optimizations

1. **Data Caching**
   ```typescript
   // lib/dashboard/hooks/useDashboard.ts
   export const useDashboard = () => {
     return useQuery({
       queryKey: ['dashboard'],
       queryFn: getDashboardData,
       staleTime: 30000,
       cacheTime: 3600000,
       retry: 3
     });
   };
   ```

2. **Render Optimization**
   - Implements memo where needed
   - Uses proper key strategies
   - Optimizes re-renders

3. **Loading States**
   - Implements skeleton loading
   - Shows progress indicators
   - Handles partial data loading

## Database Queries

### Query Optimization
1. **Batch Queries**
   ```typescript
   // lib/dashboard/services/dashboard.ts
   const getActivePoVs = async (tx: Prisma.TransactionClient) => {
     return tx.pov.findMany({
       where: {
         status: {
           in: ['IN_PROGRESS', 'VALIDATION']
         }
       },
       select: {
         id: true,
         title: true,
         status: true,
         // ... other fields
       }
     });
   };
   ```

2. **Connection Management**
   - Uses transaction client for related queries
   - Implements proper indexing
   - Optimizes query patterns

3. **Error Recovery**
   - Implements query retries
   - Handles deadlocks
   - Manages transaction rollbacks

## Monitoring and Logging

### System Health
1. **Performance Monitoring**
   - Tracks query performance
   - Monitors connection pool
   - Logs slow queries

2. **Error Tracking**
   - Logs authentication failures
   - Tracks API errors
   - Monitors database issues

3. **Health Checks**
   - Implements database health check
   - Monitors auth system
   - Checks API endpoints

## Security Measures

### Authentication Security
1. **Token Management**
   - Implements secure token generation
   - Uses HTTP-only cookies
   - Handles token rotation

2. **Request Validation**
   - Validates auth headers
   - Implements rate limiting
   - Checks request origin

3. **Error Handling**
   - Implements secure error responses
   - Handles auth failures gracefully
   - Prevents information leakage

## Future Improvements

1. **Performance**
   - Implement query caching
   - Optimize database indexes
   - Add connection pooling metrics

2. **Monitoring**
   - Add detailed performance tracking
   - Implement better error logging
   - Add real-time monitoring

3. **Security**
   - Implement additional auth checks
   - Add request validation
   - Improve error handling
