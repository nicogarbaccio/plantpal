ALTER TABLE user_plants ADD COLUMN needs_initial_watering BOOLEAN DEFAULT FALSE;

-- Set all existing plants to false since they have initial watering dates
UPDATE user_plants SET needs_initial_watering = FALSE;
