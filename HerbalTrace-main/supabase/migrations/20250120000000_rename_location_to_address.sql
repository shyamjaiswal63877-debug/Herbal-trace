-- Rename location column to address in profiles table
ALTER TABLE public.profiles RENAME COLUMN location TO address;
