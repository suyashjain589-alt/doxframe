-- Prevent reuse of the same TOTP time-step across MFA operations.
ALTER TABLE mfa_credentials ADD COLUMN last_totp_step INTEGER;
