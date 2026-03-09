-- Update stores table to include branding fields
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#7C2D12',
ADD COLUMN IF NOT EXISTS banner_url text;

-- Update RLS if needed (usually not needed for just adding columns but good to keep in mind)
-- Existing policies will still apply to the new columns.