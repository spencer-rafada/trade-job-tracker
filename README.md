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

- **Worker/Crew Member Role:** ⏳
  - Report hours worked (date + hours)
  - View their own hour submissions
  - Cannot add jobs or manage users
  - Cannot see other workers' data

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

#### Hours Tracking & Labor Compliance ⏳

**Purpose:** Track individual worker hours for labor compliance and payroll reporting (separate from piece-rate job payments)

**Worker Flow:**
- Workers log into app with their own accounts
- Report hours worked per day/week
  - Date worked
  - Total hours
- View their own submitted hours

**Admin Flow:**
- View all unallocated worker hours
- Tie/assign worker hours to specific jobs
  - **TBD:** Can hours be split across multiple jobs in one day? (e.g., 4 hrs Job A + 4 hrs Job B)
- Export hours data for payroll platform

**Export/Integration:** (Future - defer for now)
- Export worker hours tied to jobs in CSV/Excel format
- Send to external payroll platform

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
  - role (text: 'admin' | 'foreman' | 'worker')
  - created_at (timestamp)

-- Crews
crews:
  - id (uuid, primary key)
  - name (text)
  - trade (text, nullable) -- e.g., "Concrete", "Framing", "Electrical"
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

-- Hours (for labor compliance tracking)
hours:
  - id (uuid, primary key)
  - worker_id (uuid, references profiles.id)
  - date_worked (date)
  - hours_worked (numeric)
  - created_at (timestamp)
  - status (text: 'unallocated' | 'allocated')

-- Job Hours Allocation (ties worker hours to jobs)
job_hours:
  - id (uuid, primary key)
  - hours_id (uuid, references hours.id)
  - job_id (uuid, references jobs.id)
  - allocated_hours (numeric) -- allows splitting hours across multiple jobs
  - allocated_by (uuid, references profiles.id) -- admin who made allocation
  - created_at (timestamp)
```

### Security Architecture

**Row Level Security (RLS) Policies:**

- Admins can view and manage all data
- Foremen can only view/insert jobs for crews they're assigned to
- Workers can only insert their own hours and view their own hour submissions
- Workers cannot view jobs or manage users
- Users can only read their own profile
- All security enforced at database level (not just frontend)

## Next Steps

**Pending Decisions:**
- Confirm if worker hours can be split across multiple jobs in one day

**Upcoming Features:**
- Hours tracking & labor compliance
- Trade/department filtering for crews
- Foreman job list view
- Hours export to payroll platform

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