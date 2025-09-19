-- Create users table (Note: Supabase already provides auth.users)
-- This is for additional user profile data

-- Create a users table for storing user profiles
CREATE TABLE public.user_profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (id)
);

-- Set up RLS (Row Level Security) for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access only their own profiles
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Modify existing tables to include user_id

-- Add user_id to expenses table
ALTER TABLE public.expenses 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to categories table
ALTER TABLE public.categories 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to budgets table
ALTER TABLE public.budgets 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS on expenses table
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses" 
  ON public.expenses FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses" 
  ON public.expenses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" 
  ON public.expenses FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" 
  ON public.expenses FOR DELETE 
  USING (auth.uid() = user_id);

-- Update RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories" 
  ON public.categories FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" 
  ON public.categories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" 
  ON public.categories FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" 
  ON public.categories FOR DELETE 
  USING (auth.uid() = user_id);

-- Update RLS on budgets table
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budgets" 
  ON public.budgets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets" 
  ON public.budgets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" 
  ON public.budgets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" 
  ON public.budgets FOR DELETE 
  USING (auth.uid() = user_id);

-- Migration script to assign existing data to a default user
-- (only run this once after creating the tables)
/*
INSERT INTO public.user_profiles (id, name, email)
VALUES ('your-default-user-id', 'Default User', 'default@example.com');

UPDATE public.expenses
SET user_id = 'your-default-user-id'
WHERE user_id IS NULL;

UPDATE public.categories
SET user_id = 'your-default-user-id'
WHERE user_id IS NULL;

UPDATE public.budgets
SET user_id = 'your-default-user-id'
WHERE user_id IS NULL;
*/
