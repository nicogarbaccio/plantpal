-- Update user_plants table to add NOT NULL constraints
ALTER TABLE user_plants 
  ALTER COLUMN nickname SET NOT NULL,
  ALTER COLUMN location SET NOT NULL,
  ALTER COLUMN last_watered SET NOT NULL,
  ALTER COLUMN next_water_date SET NOT NULL;
