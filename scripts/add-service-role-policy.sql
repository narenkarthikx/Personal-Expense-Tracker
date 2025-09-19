-- IMPORTANT: Add this line to your .env file:
-- SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_supabase_dashboard

-- Additional RLS policy that allows service role to bypass RLS for management operations
-- This SQL should be run on your Supabase database

-- First, let's create a function to check if the request is coming with a service role
CREATE OR REPLACE FUNCTION auth.is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the request is being made with service role credentials
  RETURN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
EXCEPTION
  WHEN OTHERS THEN RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a policy to allow service role to manage user profiles
CREATE POLICY "Service role can manage user profiles" 
  ON public.user_profiles 
  USING (auth.is_service_role());

-- Add policies for system to insert user profiles during signup

-- For Supabase Auth Hook approach (if you use webhooks)
CREATE POLICY "System can insert user profiles on signup" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id OR auth.is_service_role());

-- Remember to enable the appropriate hook in your Supabase dashboard
-- or use the API route approach as we implemented
