-- Create absences table
CREATE TABLE absences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    absence_date DATE NOT NULL,
    period VARCHAR(20) CHECK (period IN ('AM', 'PM', 'FULL')),
    reason VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_absences_user_date ON absences(user_id, absence_date);

-- Add comment
COMMENT ON TABLE absences IS 'Tracks planned employee absences to suppress test notifications';
COMMENT ON COLUMN absences.period IS 'AM for morning, PM for afternoon, FULL for entire day'; 