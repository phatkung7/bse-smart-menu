-- Add reminder_days column to appointments table
ALTER TABLE appointments ADD COLUMN reminder_days integer DEFAULT 1;
