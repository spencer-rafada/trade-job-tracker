# Trade Job Tracker

A simple, mobile-first job tracking system built for construction trade businesses. Designed to minimize friction for foremen in the field while giving business owners powerful oversight and reporting capabilities.

## Project Overview

This application helps trade businesses track jobs completed by their crews. Foremen can quickly log job details from their phones at the job site, while admins get a comprehensive view of all operations with powerful filtering and reporting tools.

## Core Requirements

### Must Have (MVP - Iteration 1)

#### Job Tracking ✅

- **Job Fields:** ✅
  - ~~Date (auto-populated on submission)~~
  - ~~Job name/number~~
  - ~~Elevation~~
  - ~~Lot/Address~~
  - ~~Yardage (numeric input)~~
  - ~~Rate (dollar amount)~~
  - ~~Total (auto-calculated: yardage × rate)~~
  - ~~Crew ID (auto-populated based on user's crew)~~
  - ~~Notes (optional)~~

#### User Roles & Authentication ✅

- **Admin Role:** ✅

  - ~~View all jobs across all crews with filtering~~
  - ~~Manage users (add, edit, remove)~~
  - ~~Assign users to crews~~
  - ~~Create and manage crews~~
  - ~~Access full dashboard with stats~~

- **Foreman Role:** ✅
  - ~~Add new jobs for their assigned crew(s)~~
  - View jobs for their crew(s) only (⏳ pending job list view)
  - ~~Cannot see other crews' data~~
  - ~~Cannot manage users or crews~~

#### Dashboard Features ✅

- ~~Clean table view of jobs~~ (Admin ✅, Foreman ⏳)
- ~~Quick filter buttons:~~ (Admin ✅, Foreman ⏳)
  - ~~This Week~~
  - ~~Last Week~~
  - ~~This Month~~
  - ~~All Jobs~~
- ~~Search functionality across all fields~~ (Admin ✅, Foreman ⏳)
- ~~Sortable columns (click to sort by any field)~~ (Admin ✅, Foreman ⏳)
- ~~Running totals:~~ (Admin ✅, Foreman ⏳)
  - ~~Total Jobs (for filtered view)~~
  - ~~Total Yardage (for filtered view)~~
  - ~~Total Amount (for filtered view)~~
- ~~Crew filtering dropdown~~ (Admin ✅)

#### UX/Design Principles ✅

- ~~**Mobile-first design** - optimized for phones and tablets~~
- ~~**Large, touch-friendly buttons** - easy to use with work gloves~~
- ~~**Minimal text entry** - use dropdowns and auto-calculations where possible~~
- ~~**Clear visual feedback** - confirmation when jobs are added~~
- ~~**Simple, intuitive navigation** - construction workers aren't software experts~~

## Technical Decisions

### Tech Stack

- **Frontend:** Next.js 14+ (App Router)
- **Backend/Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

### Why This Stack?

**Next.js**

- Server-side rendering for better performance
- App Router for modern routing patterns
- Built-in API routes if needed
- Excellent developer experience

**Supabase**

- Built-in authentication (email/password, magic links, OAuth)
- PostgreSQL database with real-time capabilities
- Row Level Security (RLS) for secure data access
- Auto-generated REST API
- No backend code required
- Free tier is generous for MVP

**Tailwind CSS**

- Rapid UI development
- Consistent design system
- Mobile-first utilities
- Already proven in prototype

**Vercel**

- One-click deployment
- Automatic HTTPS
- Edge network for fast performance
- Free tier for small projects

### Database Schema

```sql
-- Profiles (extends Supabase auth.users)
profiles:
  - id (uuid, primary key, references auth.users)
  - email (text)
  - full_name (text)
  - role (text: 'admin' | 'foreman')
  - created_at (timestamp)

-- Crews
crews:
  - id (uuid, primary key)
  - name (text)
  - created_at (timestamp)

-- Crew Members (junction table)
crew_members:
  - id (uuid, primary key)
  - user_id (uuid, references profiles.id)
  - crew_id (uuid, references crews.id)
  - created_at (timestamp)
  - UNIQUE constraint on (user_id, crew_id)

-- Jobs
jobs:
  - id (uuid, primary key)
  - date (date, defaults to current date)
  - job_name (text)
  - elevation (text)
  - lot_address (text)
  - yardage (numeric)
  - rate (numeric)
  - total (numeric, computed: yardage * rate)
  - crew_id (uuid, references crews.id)
  - created_by (uuid, references profiles.id)
  - notes (text, nullable)
  - created_at (timestamp)
```

### Security Architecture

**Row Level Security (RLS) Policies:**

- Admins can view and manage all data
- Foremen can only view/insert jobs for crews they're assigned to
- Users can only read their own profile
- All security enforced at database level (not just frontend)

### Project Management Approach

**For Iteration 1 (Solo Developer):**

- Skip formal ticket tracking (Linear, Jira, etc.)
- Use simple `todo.md` file in repository
- Focus on rapid iteration and user feedback
- Transition to Linear when:
  - Adding additional developers
  - Managing 10+ feature requests
  - Juggling multiple projects
  - Product is mature and in maintenance mode

## Future Implementations

### Iteration 2: Enhanced Reporting

- **PDF/Excel Export** - export filtered job lists
- **Crew Performance Analytics** - compare crews by productivity
- **Date Range Reports** - custom date range filtering
- **Job Status Tracking** - add status field (scheduled, in-progress, completed)
- **Photo Uploads** - attach before/after photos to jobs

### Iteration 3: Mobile App

- **Native Mobile App** - React Native or Progressive Web App
- **Offline Mode** - foremen can log jobs without internet, sync later
- **GPS Integration** - auto-populate location/address
- **Push Notifications** - remind foremen to log jobs at end of day

### Iteration 4: Advanced Features

- **Invoicing Integration** - generate invoices from job data
- **Client Portal** - let clients view their job history
- **Equipment Tracking** - track equipment usage per job
- **Weather Integration** - log weather conditions for each job
- **Time Tracking** - log start/end times, calculate labor hours
- **Multi-tenant** - support multiple trade companies in one system

### Iteration 5: Business Intelligence

- **Predictive Analytics** - forecast crew capacity and revenue
- **Cost Analysis** - track profitability by job type, crew, client
- **Scheduling Optimization** - AI-powered crew scheduling
- **Integration Hub** - connect to QuickBooks, scheduling software, etc.

## Development Roadmap

### Week 1: Foundation

- Set up Next.js + Supabase project
- Create database schema and RLS policies
- Build authentication flow (login, logout, protected routes)
- Set up project structure and base components

### Week 2: Core Features

- Port job tracker UI from prototype
- Connect to Supabase (CRUD operations)
- Implement role-based access control
- Build admin panel (user/crew management)

### Week 3: Testing & Deployment

- Test with real users (your friend's foremen)
- Fix bugs and gather feedback
- Deploy to Vercel
- Create user documentation

### Week 4+: Iteration

- Implement high-priority feedback items
- Refine UX based on real-world usage
- Plan Iteration 2 features

## Success Metrics

### MVP Success Criteria

- [ ] Foremen can add a job in under 60 seconds
- [ ] Admin can view weekly totals in under 10 seconds
- [ ] Zero training required for foremen (intuitive enough to use immediately)
- [ ] 100% of jobs logged digitally (replacing paper/spreadsheets)
- [ ] Mobile responsive on phones and tablets

### Long-term Goals

- Reduce time spent on job tracking by 50%
- Eliminate data entry errors from manual transcription
- Enable real-time visibility into crew productivity
- Scale to support 10+ crews without performance degradation

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account (free tier)
- Vercel account (free tier)
- Git installed

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd trade-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase URL and anon key

# Run development server
npm run dev
```

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Contributing

This is currently a solo project in MVP stage. Once we have validated the concept with real users, we'll open it up for contributions.

## License

Proprietary - All rights reserved

## Contact

For questions or feedback, contact [your contact info]

---

**Last Updated:** October 18, 2025  
**Version:** 1.0.0 (MVP)  
**Status:** In Development