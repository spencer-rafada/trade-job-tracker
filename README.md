# Trade Job Tracker

A simple, mobile-first job tracking system built for construction trade businesses. Designed to minimize friction for foremen in the field while giving business owners powerful oversight and reporting capabilities.

## Project Overview

This application helps trade businesses track jobs completed by their crews. Foremen can quickly log job details from their phones at the job site, while admins get a comprehensive view of all operations with powerful filtering and reporting tools.

## Core Requirements

### Must Have (MVP - Iteration 1)

#### Job Tracking ✅ (Redesigned - See docs/JOB_LOGGING_REDESIGN.md)

- **Admin Job Template Management:** ✅
  - ~~Create job templates (job name)~~
  - ~~Add multiple elevations per job~~
  - ~~Set yardage and rate per elevation~~
  - ~~Archive/reactivate jobs~~
  - ~~No crew assignment (jobs available to all crews)~~

- **Foreman Job Logging:** ✅
  - ~~Select job from dropdown (required)~~
  - ~~Select elevation from dropdown (required)~~
  - ~~Enter lot manually (required)~~
  - ~~Yardage and rate are read-only (pulled from job template)~~
  - ~~Date (auto-populated, editable)~~
  - ~~Notes (optional)~~
  - ~~Crew ID (auto-populated based on user's crew)~~

- **Job Logs View (Admin):** ✅
  - ~~View all completed work logs~~
  - ~~Filter by date range (This Week, Last Week, This Month, All)~~
  - ~~Search by job, elevation, lot, crew, foreman~~
  - ~~Sortable columns with TanStack Table~~
  - ~~Stats dashboard (total logs, yardage, revenue)~~
  - ~~Delete logs (admin only)~~

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

- **Worker/Crew Member Role:** ✅
  - ~~Report hours worked (date + hours)~~
  - ~~View their own hour submissions~~
  - ~~Cannot add jobs or manage users~~
  - ~~Cannot see other workers' data~~

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

#### Crew Management

- **Trade/Department Field:** ⏳
  - Add trade/department field to crews (e.g., "Concrete", "Framing", "Electrical")
  - Filter jobs by trade in dashboard
  - Helps organize crews by specialty

#### Hours Tracking & Labor Compliance ✅

**Purpose:** Track worker hours and ensure piece-rate earnings meet minimum wage requirements

**Implementation:** Piece-rate workers are paid primarily by job completion, but must earn at least their hourly rate for total hours worked. The system validates weekly compliance.

**Worker/Foreman Flow:** ✅
- ~~Workers and foremen submit daily hours~~
  - ~~Date worked~~
  - ~~Total hours~~
  - ~~Optional notes~~
- ~~View and edit their own hour submissions (last 30 days)~~
- ~~See their hourly rate~~

**Admin Flow:** ✅
- ~~View weekly crew summaries for labor compliance~~
- ~~Select crew and week to analyze~~
- ~~See total job earnings vs. minimum required pay~~
- ~~Compliance status: ✅ Compliant or ⚠️ Below Minimum~~
- ~~Bonus pool calculation (earnings above minimum)~~
- ~~Individual worker breakdowns (hours × hourly rate)~~

**Future Enhancements:** ⏳
- Export hours data to CSV/Excel for payroll
- Historical compliance reports
- Email notifications for missing hour submissions

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

**Note:** Job tracking was redesigned in October 2024. See `docs/JOB_LOGGING_REDESIGN.md` for full details.

```sql
-- Profiles (extends Supabase auth.users)
profiles:
  - id (uuid, primary key, references auth.users)
  - email (text)
  - first_name (text)
  - last_name (text)
  - role (text: 'admin' | 'foreman' | 'worker')
  - hourly_rate (numeric, nullable) -- for minimum wage compliance
  - crew_id (uuid, references crews.id, nullable)
  - created_at (timestamp)

-- Crews
crews:
  - id (uuid, primary key)
  - name (text)
  - trade_id (uuid, references trades.id, nullable)
  - created_at (timestamp)

-- Trades
trades:
  - id (uuid, primary key)
  - trade_name (text) -- e.g., "Concrete", "Framing", "Electrical"
  - department_id (text, nullable)
  - description (text, nullable)
  - created_at (timestamp)

-- Jobs (Job Templates - Admin creates)
jobs:
  - id (uuid, primary key)
  - job_name (text) -- e.g., "Riverside Apartments Phase 2"
  - active (boolean, defaults to true)
  - created_at (timestamp)
  - updated_at (timestamp)

-- Job Elevations (Multiple per job)
job_elevations:
  - id (uuid, primary key)
  - job_id (uuid, references jobs.id)
  - elevation_name (text) -- e.g., "3rd Floor", "Basement"
  - yardage (numeric, must be > 0)
  - rate (numeric, must be > 0)
  - total (numeric, computed: yardage * rate)
  - created_at (timestamp)
  - updated_at (timestamp)

-- Job Logs (Foreman reports completed work)
job_logs:
  - id (uuid, primary key)
  - job_id (uuid, references jobs.id)
  - elevation_id (uuid, references job_elevations.id)
  - lot (text) -- manually entered by foreman
  - date_worked (date, defaults to current date)
  - crew_id (uuid, references crews.id) -- which crew did the work
  - created_by (uuid, references profiles.id) -- which foreman logged it
  - notes (text, nullable)
  - created_at (timestamp)
  - updated_at (timestamp)

-- Hours (for labor compliance tracking)
hours:
  - id (uuid, primary key)
  - worker_id (uuid, references profiles.id)
  - date_worked (date)
  - hours_worked (numeric, must be > 0)
  - notes (text, nullable)
  - created_at (timestamp)
  - updated_at (timestamp)
```

### Security Architecture

**Row Level Security (RLS) Policies:**

- **Admins:** Full access to all data (job templates, elevations, job logs, hours, users, crews)
- **Foremen:**
  - Read access to all active job templates and elevations
  - Can create job logs for their assigned crew only
  - Can view job logs for their crew
  - Can view hours for their crew members
  - Can insert/update/delete their own hours
- **Workers:**
  - Can insert/update/delete their own hours
  - Can view their own hour submissions only
  - Cannot view jobs or manage users
- **All Users:** Can only read their own profile
- **All security enforced at database level** (not just frontend)

## Next Steps

**Upcoming Features:**
- Trade/department filtering for crews (partially implemented)
- Foreman job list view
- Hours export to CSV/Excel for payroll
- Historical compliance reports
- Email notifications for missing hour submissions

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

**Last Updated:** October 29, 2024
**Version:** 1.1.0 (Job Logging Redesign)
**Status:** In Development

## Recent Changes

### October 29, 2024 - Job Logging Redesign ✅

Complete overhaul of the job management system to improve workflow and data accuracy:

- **Admin creates job templates** - standardizes job names, elevations, and rates
- **Foremen log completed work** - select from dropdowns instead of manual entry
- **Separation of concerns** - job templates vs. work logs
- **Better accounting** - all work logs tied to job_id for financial tracking
- **No crew assignments** - any crew can work any job
- **Required fields** - job, elevation, and lot are now mandatory
- **Full table filtering** - same powerful search/filter capabilities as before

See `docs/JOB_LOGGING_REDESIGN.md` for complete technical documentation.