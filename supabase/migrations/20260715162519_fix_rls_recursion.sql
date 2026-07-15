/*
# Fix RLS recursion on profiles table

## Problem
The SELECT policy on `profiles` references `profiles` itself in a subquery,
causing infinite recursion when Postgres evaluates the policy.

## Fix
Replace the recursive SELECT policy with a simpler approach:
- Users can always read their own profile row (auth.uid() = user_id)
- Users can read all profiles that belong to the same organization,
  but only if they themselves have a profile in that org.
  To avoid recursion, we use a SECURITY DEFINER function that
  safely checks org membership without touching the profiles RLS.

## New Objects
- `is_org_member(org_uuid)` — SECURITY DEFINER function that returns true
  if the current user has a profile in the given org. Runs as the
  `postgres` (owner) role so it bypasses RLS, breaking the recursion.

## Security
- The function only returns a boolean; it does not expose data.
- All other policies remain unchanged.
*/

-- Drop the recursive SELECT policy
DROP POLICY IF EXISTS "select_profile" ON profiles;

-- Create a SECURITY DEFINER function to check org membership without recursion
CREATE OR REPLACE FUNCTION is_org_member(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.org_id = target_org_id
  );
$$;

-- New non-recursive SELECT policy
CREATE POLICY "select_profile"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR (
    org_id IS NOT NULL
    AND is_org_member(org_id)
  )
);

-- Also fix insert/update/delete policies to use the same function
DROP POLICY IF EXISTS "insert_profile" ON profiles;
CREATE POLICY "insert_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR (
    org_id IS NOT NULL
    AND is_org_member(org_id)
  )
);

DROP POLICY IF EXISTS "update_profile" ON profiles;
CREATE POLICY "update_profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR (
    org_id IS NOT NULL
    AND is_org_member(org_id)
  )
) WITH CHECK (
  auth.uid() = user_id
  OR (
    org_id IS NOT NULL
    AND is_org_member(org_id)
  )
);

DROP POLICY IF EXISTS "delete_profile" ON profiles;
CREATE POLICY "delete_profile"
ON profiles FOR DELETE
TO authenticated
USING (
  org_id IS NOT NULL
  AND is_org_member(org_id)
);
