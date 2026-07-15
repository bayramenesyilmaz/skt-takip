/*
# Add profile_locations for reyon-based assignment

## Problem
Staff members need to be assigned to specific locations (reyonlar).
This allows:
- Staff to see only their reyon's products by default
- Cross-reyon barcode search (show all locations for a product)
- Managers to assign staff to reyonlar

## New Table
- `profile_locations`: many-to-many between profiles and locations
  - `profile_id` (uuid, FK to profiles, CASCADE)
  - `location_id` (uuid, FK to locations, CASCADE)
  - Primary key: (profile_id, location_id)

## Security
- RLS enabled
- Users can read their own assignments and assignments within their org
- Only managers/admins can modify assignments
- Uses is_org_member() function from previous migration
*/

CREATE TABLE IF NOT EXISTS profile_locations (
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (profile_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_locations_profile_id ON profile_locations(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_locations_location_id ON profile_locations(location_id);

ALTER TABLE profile_locations ENABLE ROW LEVEL SECURITY;

-- SELECT: user can see their own assignments, or any assignment in their org
DROP POLICY IF EXISTS "select_profile_location" ON profile_locations;
CREATE POLICY "select_profile_location"
ON profile_locations FOR SELECT
TO authenticated
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.org_id IS NOT NULL
      AND p.org_id = (
        SELECT loc.org_id FROM locations loc WHERE loc.id = profile_locations.location_id
      )
    )
  )
);

-- INSERT: only managers/admins within the same org
DROP POLICY IF EXISTS "insert_profile_location" ON profile_locations;
CREATE POLICY "insert_profile_location"
ON profile_locations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('super_admin', 'owner', 'branch_manager')
    AND p.org_id = (
      SELECT loc.org_id FROM locations loc WHERE loc.id = profile_locations.location_id
    )
  )
);

-- DELETE: only managers/admins within the same org
DROP POLICY IF EXISTS "delete_profile_location" ON profile_locations;
CREATE POLICY "delete_profile_location"
ON profile_locations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('super_admin', 'owner', 'branch_manager')
    AND p.org_id = (
      SELECT loc.org_id FROM locations loc WHERE loc.id = profile_locations.location_id
    )
  )
);
