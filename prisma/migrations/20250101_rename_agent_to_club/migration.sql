-- Rename role value AGENT to CLUB (safe if AGENT doesn't exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'AGENT'
  ) THEN
    ALTER TYPE "UserRole" RENAME VALUE 'AGENT' TO 'CLUB';
  END IF;
END $$;
