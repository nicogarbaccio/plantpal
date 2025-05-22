-- Convert last_watered and next_water_date columns in user_plants to use timestamp with timezone
ALTER TABLE user_plants 
ALTER COLUMN last_watered TYPE timestamp with time zone,
ALTER COLUMN next_water_date TYPE timestamp with time zone;

-- Convert watered_date column in watering_history to use timestamp with timezone
ALTER TABLE watering_history
ALTER COLUMN watered_date TYPE timestamp with time zone;
