-- Add superadmin role to user_role enum
ALTER TYPE user_role ADD VALUE 'superadmin';

-- Update profiles table to allow superadmin access
-- Add a function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND email = 'tenukians@gmail.com' 
    AND role = 'superadmin'
  );
$$;

-- Update RLS policies to allow superadmin access to everything
-- Companies table policies for superadmin
CREATE POLICY "Superadmin can view all companies"
ON public.companies
FOR SELECT
TO authenticated
USING (public.is_superadmin());

CREATE POLICY "Superadmin can manage all companies"
ON public.companies
FOR ALL
TO authenticated
USING (public.is_superadmin());

-- Profiles table policies for superadmin
CREATE POLICY "Superadmin can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_superadmin());

CREATE POLICY "Superadmin can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_superadmin());

-- Events table policies for superadmin
CREATE POLICY "Superadmin can view all events"
ON public.events
FOR SELECT
TO authenticated
USING (public.is_superadmin());

CREATE POLICY "Superadmin can manage all events"
ON public.events
FOR ALL
TO authenticated
USING (public.is_superadmin());

-- Update the tenukians@gmail.com user to be superadmin if they exist
UPDATE public.profiles 
SET role = 'superadmin' 
WHERE email = 'tenukians@gmail.com';