-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_user_id TEXT NOT NULL REFERENCES public.users(line_user_id) ON DELETE CASCADE,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    doctor_name TEXT,
    hospital_name TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to select their own records
CREATE POLICY "Users can view their own appointments"
    ON public.appointments FOR SELECT
    USING (auth.uid()::text = line_user_id);

-- Create policy to allow authenticated users to insert their own records
CREATE POLICY "Users can insert their own appointments"
    ON public.appointments FOR INSERT
    WITH CHECK (auth.uid()::text = line_user_id);

-- Add index on line_user_id and appointment_date for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(line_user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
