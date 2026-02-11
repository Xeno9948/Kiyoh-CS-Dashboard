# Customer Success Dashboard - Implementation Plan

## Overview

Building a comprehensive Customer Success Dashboard that aggregates review data from **Kiyoh** and **Klantenvertellen** APIs, providing insights into client performance, review collection, and response metrics.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Material-UI v5
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL (Railway-hosted)
- **Authentication**: NextAuth.js v4 with Credentials Provider
- **Data Fetching**: Server-side with SWR for client caching
- **Deployment**: Railway with environment variables

## Key Features

### 1. Dashboard Overview Cards
- **Best Performers**: Top 3 clients by average rating (minimum 5 reviews)
- **Worst Performers**: Bottom 3 clients by average rating
- **Needs Attention**: Clients with no reviews in 30+ days

### 2. Client Data Table
- Client name and source (Kiyoh/Klantenvertellen)
- Average rating with star display
- Total review count
- Response rate percentage
- Last review date (relative time)
- Package information
- Active features

### 3. Data Synchronization
- **Automatic sync** with rate limiting (max 25 API calls/minute)
- Background job running periodically
- Manual "Sync Now" button for immediate refresh
- Progress tracking and error handling

### 4. Security
- API tokens stored as environment variables (backend only)
- User authentication with email/password
- Protected routes requiring login
- Password hashing with bcrypt

## Implementation Steps

### Phase 1: Project Initialization (Day 1 - Morning)

**1.1 Initialize Next.js Project**
```bash
npx create-next-app@latest kiyoh-cs-dashboard --typescript --app --tailwind --no-eslint
cd kiyoh-cs-dashboard
```

**1.2 Install Core Dependencies**
```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install @prisma/client next-auth bcrypt axios swr zod date-fns
npm install -D prisma @types/bcrypt @types/node
```

**1.3 Project Structure Setup**
Create folder structure:
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   └── dashboard/
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── sync/
│       ├── clients/
│       └── dashboard/
├── components/
│   ├── auth/
│   ├── dashboard/
│   └── common/
├── lib/
│   ├── api/
│   ├── sync/
│   └── utils/
├── types/
├── hooks/
└── styles/
```

**1.4 Configuration Files**
- Create `.env.local` with development environment variables
- Create `.env.example` as template
- Configure `.gitignore` to exclude `.env.local`
- Setup `next.config.js` and `tsconfig.json`

### Phase 2: Database Setup (Day 1 - Afternoon)

**2.1 Initialize Prisma**
```bash
npx prisma init
```

**2.2 Define Database Schema**
Create `prisma/schema.prisma` with models:
- **User**: Authentication (id, email, password, name, timestamps)
- **Client**: Location/client data (id, externalId, name, source, package, features, metrics, timestamps)
- **Review**: Individual reviews (id, externalId, clientId, rating, comment, reviewerName, reviewDate, hasResponse, responseText, timestamps)
- **ClientMetric**: Historical metrics snapshots (id, clientId, date, averageRating, totalReviews, responseRate)
- **SyncJob**: Sync tracking (id, source, status, startedAt, completedAt, reviewsProcessed, errors)

**2.3 Create Migration**
```bash
npx prisma migrate dev --name init
```

**2.4 Generate Prisma Client**
```bash
npx prisma generate
```

**2.5 Create Prisma Client Singleton**
Create `src/lib/prisma.ts` to prevent connection pool exhaustion

### Phase 3: Authentication System (Day 1 - Evening)

**3.1 NextAuth Configuration**
Create `src/app/api/auth/[...nextauth]/route.ts`:
- Configure Credentials Provider
- Setup JWT strategy
- Implement password verification with bcrypt
- Configure session callbacks

**3.2 Authentication Utilities**
Create `src/lib/auth.ts`:
- Password hashing function
- Password comparison function
- Session validation helpers

**3.3 Login Page**
Create `src/app/(auth)/login/page.tsx`:
- Login form with email/password
- Error handling
- Redirect to dashboard on success

**3.4 Registration Page**
Create `src/app/(auth)/register/page.tsx`:
- Registration form with email/password/name
- Password validation
- Create user in database
- Auto-login after registration

**3.5 Protected Route Middleware**
Create middleware to check authentication on dashboard routes

### Phase 4: API Integration (Day 2 - Morning)

**4.1 Kiyoh API Client**
Create `src/lib/api/kiyoh.ts`:
- Base URL: `https://www.kiyoh.com/v1`
- Endpoint: `/publication/review/locations/latest`
- Header: `X-Publication-Api-Token`
- Token from `process.env.KIYOH_API_TOKEN`
- Error handling and timeout configuration

**4.2 Klantenvertellen API Client**
Create `src/lib/api/klantenvertellen.ts`:
- Base URL: `https://www.klantenvertellen.nl/v1`
- Endpoint: `/publication/review/locations/latest`
- Header: `X-Publication-Api-Token`
- Token from `process.env.KLANTENVERTELLEN_API_TOKEN`
- Consistent error handling

**4.3 Rate Limiter**
Create `src/lib/utils/rateLimiter.ts`:
- Token bucket algorithm
- Max 25 requests per minute
- Queue requests when limit reached
- Exponential backoff on errors

**4.4 TypeScript Types**
Create `src/types/api.ts`:
- Define interfaces for API responses
- Kiyoh review structure
- Klantenvertellen review structure
- Normalized internal review format

### Phase 5: Data Synchronization Service (Day 2 - Afternoon)

**5.1 Review Processor**
Create `src/lib/sync/reviewProcessor.ts`:
- Normalize review data from both APIs
- Map API fields to database schema
- Handle missing or optional fields
- Deduplicate by external ID

**5.2 Metrics Calculator**
Create `src/lib/sync/metricsCalculator.ts`:
- Calculate average rating per client
- Count total reviews
- Calculate response rate (reviews with responses / total)
- Determine days since last review
- Identify clients needing attention

**5.3 Sync Service Orchestrator**
Create `src/lib/sync/syncService.ts`:
- Fetch from Kiyoh API (rate-limited)
- Fetch from Klantenvertellen API (rate-limited)
- Process and normalize reviews
- Upsert clients (create or update)
- Upsert reviews (deduplicate)
- Calculate and cache metrics
- Create historical metric snapshots
- Track sync job status
- Handle errors gracefully

**5.4 Background Sync Job**
Create `src/lib/sync/backgroundJob.ts`:
- Node-cron scheduled job (runs every 15 minutes)
- Call sync service with rate limiting
- Log sync results
- Store sync job records

### Phase 6: API Routes (Day 2 - Evening)

**6.1 Sync Endpoints**
- `POST /api/sync/kiyoh` - Sync Kiyoh data
- `POST /api/sync/klantenvertellen` - Sync Klantenvertellen data
- `POST /api/sync/all` - Sync both sources (with rate limiting)
- Protected: Require authentication

**6.2 Dashboard Data Endpoints**
- `GET /api/dashboard/overview` - Overview stats (best/worst/needs attention)
- `GET /api/clients` - Paginated client list with filters
- `GET /api/clients/[id]` - Individual client details
- All protected with session validation

### Phase 7: Frontend Components (Day 3)

**7.1 MUI Theme Setup**
Create `src/styles/theme.ts`:
- Custom color palette
- Typography settings
- Component overrides

**7.2 Layout Components**
- `src/app/layout.tsx` - Root layout with providers
- `src/app/(dashboard)/layout.tsx` - Dashboard layout with navigation
- Navigation bar with logout button

**7.3 Overview Cards Component**
Create `src/components/dashboard/OverviewCards.tsx`:
- Three cards: Best Performers, Worst Performers, Needs Attention
- Use MUI Card, CardContent, Typography
- Display client names and key metrics
- Color coding (green/red/orange)

**7.4 Clients Table Component**
Create `src/components/dashboard/ClientsTable.tsx`:
- MUI DataGrid for table display
- Columns: Name, Source, Rating, Reviews, Response Rate, Last Review, Package, Features
- Sortable columns
- Pagination (server-side)
- Search functionality
- Filter by source, rating range

**7.5 Sync Button Component**
Create `src/components/dashboard/SyncButton.tsx`:
- Button to trigger manual sync
- Loading state during sync
- Success/error notifications
- Display last sync time

**7.6 Auth Forms**
- `src/components/auth/LoginForm.tsx` - Login form with validation
- `src/components/auth/RegisterForm.tsx` - Registration form

### Phase 8: Dashboard Page Integration (Day 3 - Evening)

**8.1 Custom Hooks**
Create hooks for data fetching:
- `src/hooks/useOverview.ts` - Fetch overview stats with SWR
- `src/hooks/useClients.ts` - Fetch clients with pagination
- `src/hooks/useSync.ts` - Trigger sync and track status

**8.2 Dashboard Page**
Create `src/app/(dashboard)/dashboard/page.tsx`:
- Compose OverviewCards, ClientsTable, SyncButton
- Handle loading states
- Error boundaries
- Auto-refresh every 5 minutes

### Phase 9: Testing & Refinement (Day 4)

**9.1 Authentication Testing**
- Register new user
- Login/logout flow
- Protected route access
- Password validation

**9.2 Sync Testing**
- Manual sync with real API tokens
- Verify rate limiting (25/minute)
- Check data accuracy in database
- Test error handling

**9.3 Dashboard Testing**
- Verify overview cards display correct data
- Test table sorting and filtering
- Check pagination
- Validate "Needs Attention" logic

**9.4 Performance Testing**
- Page load times
- Database query optimization
- Add indexes as needed
- Monitor memory usage

### Phase 10: Railway Deployment (Day 4 - Evening)

**10.1 Railway Project Setup**
- Create new project on Railway
- Add PostgreSQL database service
- Copy DATABASE_URL

**10.2 Environment Variables**
Configure in Railway dashboard:
```
DATABASE_URL=<from-railway-postgres>
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://<your-app>.railway.app
KIYOH_API_TOKEN=b5fab14d-500d-4d4c-a24d-47c3b9a30c0d
KLANTENVERTELLEN_API_TOKEN=74dfb94f-16d7-46dc-9c7f-b844eab12581
NODE_ENV=production
```

**10.3 Deploy Application**
- Connect GitHub repository
- Railway auto-detects Next.js
- Build and deploy

**10.4 Run Migrations**
```bash
npx prisma migrate deploy
```

**10.5 Post-Deployment**
- Register first admin user via registration page
- Trigger initial sync
- Verify data display
- Test authentication

### Phase 11: Documentation (Day 5)

**11.1 README.md**
- Project overview
- Setup instructions
- Environment variables
- Deployment guide

**11.2 Code Documentation**
- Add JSDoc comments to key functions
- Document API endpoints
- Explain sync logic and rate limiting

**11.3 User Guide**
- How to access dashboard
- Understanding metrics
- Interpreting "Needs Attention"
- Manual sync procedure

## Key Files Reference

### Configuration
- `package.json` - Dependencies and scripts
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript settings
- `.env.local` - Local environment variables
- `.env.example` - Environment template
- `railway.json` - Railway deployment config

### Database
- `prisma/schema.prisma` - Database schema
- `src/lib/prisma.ts` - Prisma client singleton

### Authentication
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth config
- `src/lib/auth.ts` - Auth utilities
- `src/app/(auth)/login/page.tsx` - Login page
- `src/app/(auth)/register/page.tsx` - Register page

### API Integration
- `src/lib/api/kiyoh.ts` - Kiyoh API client
- `src/lib/api/klantenvertellen.ts` - Klantenvertellen API client
- `src/lib/utils/rateLimiter.ts` - Rate limiting logic

### Sync Service
- `src/lib/sync/syncService.ts` - Main sync orchestrator
- `src/lib/sync/reviewProcessor.ts` - Review data processor
- `src/lib/sync/metricsCalculator.ts` - Metrics calculation
- `src/lib/sync/backgroundJob.ts` - Scheduled sync job

### API Routes
- `src/app/api/sync/all/route.ts` - Sync endpoint
- `src/app/api/clients/route.ts` - Clients data
- `src/app/api/dashboard/overview/route.ts` - Overview stats

### UI Components
- `src/app/(dashboard)/dashboard/page.tsx` - Main dashboard
- `src/components/dashboard/OverviewCards.tsx` - Summary cards
- `src/components/dashboard/ClientsTable.tsx` - Data table
- `src/components/dashboard/SyncButton.tsx` - Sync trigger

### Utilities
- `src/types/index.ts` - TypeScript types
- `src/hooks/useClients.ts` - Client data hook
- `src/hooks/useOverview.ts` - Overview data hook
- `src/hooks/useSync.ts` - Sync trigger hook

## Database Schema

### User
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

### Client
```prisma
model Client {
  id                String          @id @default(cuid())
  externalId        String          @unique
  name              String
  source            ReviewSource    // KIYOH or KLANTENVERTELLEN
  package           String?
  features          Json?           // Array of feature strings
  isActive          Boolean         @default(true)

  // Cached metrics
  averageRating     Float?
  totalReviews      Int             @default(0)
  responseRate      Float?
  lastReviewDate    DateTime?

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  reviews           Review[]
  metrics           ClientMetric[]

  @@index([source])
  @@index([averageRating])
  @@index([lastReviewDate])
  @@map("clients")
}
```

### Review
```prisma
model Review {
  id              String        @id @default(cuid())
  externalId      String        @unique
  clientId        String
  client          Client        @relation(fields: [clientId], references: [id], onDelete: Cascade)

  rating          Float
  comment         String?
  reviewerName    String?
  reviewDate      DateTime

  hasResponse     Boolean       @default(false)
  responseText    String?
  responseDate    DateTime?

  source          ReviewSource
  rawData         Json?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([clientId])
  @@index([reviewDate])
  @@map("reviews")
}
```

### ClientMetric
```prisma
model ClientMetric {
  id              String    @id @default(cuid())
  clientId        String
  client          Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)

  date            DateTime  @default(now())
  averageRating   Float
  totalReviews    Int
  newReviews      Int
  responseRate    Float

  @@index([clientId, date])
  @@map("client_metrics")
}
```

### SyncJob
```prisma
model SyncJob {
  id                String        @id @default(cuid())
  source            ReviewSource?
  status            SyncStatus    @default(RUNNING)

  startedAt         DateTime      @default(now())
  completedAt       DateTime?

  reviewsProcessed  Int           @default(0)
  clientsProcessed  Int           @default(0)
  errors            Json?

  @@index([startedAt])
  @@map("sync_jobs")
}

enum ReviewSource {
  KIYOH
  KLANTENVERTELLEN
}

enum SyncStatus {
  RUNNING
  COMPLETED
  FAILED
}
```

## Rate Limiting Strategy

### Implementation
- **Token Bucket Algorithm**: Allows burst of requests up to 25, refills at 25 tokens/minute
- **Queue Management**: Queue requests when bucket is empty, process when tokens available
- **Per-Source Limiting**: Separate rate limiters for Kiyoh and Klantenvertellen
- **Graceful Degradation**: Log rate limit events, retry failed requests

### Example
```typescript
class RateLimiter {
  private tokens: number = 25;
  private maxTokens: number = 25;
  private refillRate: number = 25 / 60; // 25 per minute = 0.417 per second
  private lastRefill: number = Date.now();

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Wait until token available
    const waitTime = (1 / this.refillRate) * 1000;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return this.acquire();
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}
```

## "Needs Attention" Logic

Clients are flagged as "Needs Attention" if:
- **No recent reviews**: Last review date is more than 30 days ago
- **Calculation**: `daysSinceLastReview > 30`

Display in overview card:
- Client name
- Days since last review
- Link to client details

## Security Checklist

- ✅ API tokens stored in environment variables only
- ✅ Never expose tokens in frontend code
- ✅ Passwords hashed with bcrypt (cost factor 12)
- ✅ Authentication required for all dashboard routes
- ✅ Session tokens in httpOnly cookies
- ✅ CSRF protection enabled (NextAuth default)
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ Input validation on all forms (Zod schemas)
- ✅ Railway environment variables for production secrets

## Testing Checklist

### Authentication
- [ ] User can register with valid email/password
- [ ] User cannot register with existing email
- [ ] User can login with correct credentials
- [ ] User cannot login with incorrect credentials
- [ ] Protected routes redirect to login when unauthenticated
- [ ] User can logout successfully

### Data Sync
- [ ] Manual sync button triggers sync job
- [ ] Sync respects rate limit (25 requests/minute)
- [ ] Clients are created/updated correctly
- [ ] Reviews are created/updated correctly
- [ ] Metrics are calculated accurately
- [ ] Sync job status tracked in database
- [ ] Errors logged and displayed

### Dashboard Display
- [ ] Overview cards show correct data
- [ ] Best performers identified (top 3 by rating)
- [ ] Worst performers identified (bottom 3 by rating)
- [ ] Needs attention shows clients with no reviews in 30+ days
- [ ] Client table displays all data correctly
- [ ] Table sorting works on all columns
- [ ] Pagination functions properly
- [ ] Search filters clients by name

### Performance
- [ ] Dashboard page loads in < 2 seconds
- [ ] Database queries use indexes
- [ ] No N+1 query problems
- [ ] Background sync doesn't block UI

## Environment Variables

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# NextAuth
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
NEXTAUTH_URL="http://localhost:3000" # or production URL

# API Tokens (NEVER commit these)
KIYOH_API_TOKEN="b5fab14d-500d-4d4c-a24d-47c3b9a30c0d"
KLANTENVERTELLEN_API_TOKEN="74dfb94f-16d7-46dc-9c7f-b844eab12581"

# Environment
NODE_ENV="development" # or "production"
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Railway Deployment Steps

1. **Create Railway Project**
   - Go to https://railway.app
   - Create new project
   - Add PostgreSQL database

2. **Configure Environment Variables**
   - Add all variables from `.env.example`
   - Use Railway-provided `DATABASE_URL`

3. **Connect Repository**
   - Connect GitHub repository
   - Railway auto-detects Next.js
   - Set build command: `npm run build`
   - Set start command: `npm run start`

4. **Deploy**
   - Push code to repository
   - Railway automatically deploys

5. **Run Migrations**
   - In Railway terminal: `npx prisma migrate deploy`
   - Or use Railway CLI locally

6. **Initial Setup**
   - Visit app URL
   - Register first admin user
   - Click "Sync Now" to import data

## Future Enhancements

### Short-term (1-2 weeks)
- Email notifications for clients needing attention
- Export data to CSV
- Client detail pages with review history
- Response management (reply to reviews from dashboard)

### Medium-term (1-2 months)
- Trend charts (rating over time, review volume)
- Advanced filtering and search
- Role-based access control (admin vs viewer)
- Response templates

### Long-term (3+ months)
- Sentiment analysis of review comments
- Automated response suggestions (AI)
- Mobile app
- White-label customization

## Success Criteria

The implementation will be considered successful when:

1. ✅ Users can register, login, and access dashboard
2. ✅ Data syncs automatically from both APIs with rate limiting
3. ✅ Overview cards display best/worst performers and clients needing attention
4. ✅ Main table shows all client data with sorting and filtering
5. ✅ Application deployed on Railway with secure environment variables
6. ✅ API tokens never exposed in frontend code
7. ✅ Dashboard loads quickly (< 2 seconds)
8. ✅ No critical bugs or errors in production

## Timeline Summary

- **Day 1**: Project setup, database, authentication
- **Day 2**: API integration, sync service, endpoints
- **Day 3**: Frontend components, dashboard page
- **Day 4**: Testing, refinement, Railway deployment
- **Day 5**: Documentation and handoff

**Total Estimated Time**: 5 days

## Support & Maintenance

After deployment:
- Monitor Railway logs for errors
- Check sync job logs regularly
- Update dependencies monthly
- Backup database weekly
- Review API rate limit usage
