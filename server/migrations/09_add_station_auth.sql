-- Create station_auth table
CREATE TABLE station_auth (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add a station_id column to esd_tests to track which station submitted each test
ALTER TABLE esd_tests ADD COLUMN station_id INTEGER REFERENCES station_auth(id);

-- Create an index for better query performance
CREATE INDEX idx_esd_tests_station_id ON esd_tests(station_id);

-- Insert initial station credentials (password will need to be hashed)
INSERT INTO station_auth (username, password) VALUES 
('station1', 'PLACEHOLDER_HASH'),
('station2', 'PLACEHOLDER_HASH'),
('station3', 'PLACEHOLDER_HASH'); 