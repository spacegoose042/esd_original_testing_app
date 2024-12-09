ALTER TABLE users ADD COLUMN exempt_from_testing BOOLEAN DEFAULT false;
COMMENT ON COLUMN users.exempt_from_testing IS 'Indicates if the user is exempt from ESD testing requirements'; 