-- Add handle_name column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS handle_name TEXT NOT NULL DEFAULT '';

-- Update existing records to use email as handle_name if empty
UPDATE public.users 
SET handle_name = split_part(email, '@', 1) 
WHERE handle_name = '';

-- Remove the default value after updating existing records
ALTER TABLE public.users 
ALTER COLUMN handle_name DROP DEFAULT;