-- =====================================================
-- Trade Job Tracker - Database Schema (Option 2: Simple One-to-One)
-- Run this SQL in Supabase Studio SQL Editor
-- After running, use: supabase db pull
-- =====================================================
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 1: CREATE ALL TABLES
-- =====================================================

-- CREWS TABLE (create first since profiles references it)
CREATE TABLE IF NOT EXISTS public.crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'foreman')) DEFAULT 'foreman',
  crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  job_name TEXT NOT NULL,
  elevation TEXT,
  lot_address TEXT,
  yardage NUMERIC(10, 2) NOT NULL,
  rate NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) GENERATED ALWAYS AS (yardage * rate) STORED,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- STEP 2: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS profiles_crew_id_idx ON public.profiles(crew_id);
CREATE INDEX IF NOT EXISTS jobs_crew_id_idx ON public.jobs(crew_id);
CREATE INDEX IF NOT EXISTS jobs_created_by_idx ON public.jobs(created_by);
CREATE INDEX IF NOT EXISTS jobs_date_idx ON public.jobs(date DESC);

-- =====================================================
-- STEP 3: ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: CREATE HELPER FUNCTIONS (before policies)
-- =====================================================

-- Function to check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's crew_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_crew_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT crew_id
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 5: CREATE RLS POLICIES
-- =====================================================

-- RLS Policies for CREWS
CREATE POLICY "Admins can view all crews" ON public.crews FOR SELECT
USING (public.is_admin());

CREATE POLICY "Foremen can view their own crew" ON public.crews FOR SELECT
USING (public.get_my_crew_id() = id);

CREATE POLICY "Admins can manage crews" ON public.crews FOR ALL
USING (public.is_admin());

-- RLS Policies for PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL
USING (public.is_admin());

-- RLS Policies for JOBS
CREATE POLICY "Admins can view all jobs" ON public.jobs FOR SELECT
USING (public.is_admin());

CREATE POLICY "Foremen can view their crew's jobs" ON public.jobs FOR SELECT
USING (public.get_my_crew_id() = crew_id);

CREATE POLICY "Foremen can insert jobs for their crew" ON public.jobs FOR INSERT
WITH CHECK (public.get_my_crew_id() = crew_id);

CREATE POLICY "Admins can manage all jobs" ON public.jobs FOR ALL
USING (public.is_admin());

-- =====================================================
-- STEP 6: CREATE TRIGGER FUNCTIONS
-- =====================================================

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================
-- Function to get current user's profile
CREATE OR REPLACE FUNCTION public.fn_get_my_profile() RETURNS public.profiles AS $$ BEGIN RETURN (
    SELECT *
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to get user's crew
CREATE OR REPLACE FUNCTION public.fn_get_my_crew() RETURNS public.crews AS $$ BEGIN RETURN (
    SELECT c.*
    FROM public.crews c
      INNER JOIN public.profiles p ON p.crew_id = c.id
    WHERE p.id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;