-- Add activation fields to stores table
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS is_activated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS activation_reference TEXT;