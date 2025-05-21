-- Add created_at timestamp column to watering_history
ALTER TABLE watering_history
ADD COLUMN created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP;
