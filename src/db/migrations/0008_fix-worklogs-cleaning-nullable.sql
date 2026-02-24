-- 1) Per CLEANING servono NULL su model_id e phase_id
ALTER TABLE work_logs
  ALTER COLUMN model_id DROP NOT NULL,
  ALTER COLUMN phase_id DROP NOT NULL;

-- 2) Se erano ex-bigserial, togli eventuali DEFAULT nextval(...)
ALTER TABLE work_logs
  ALTER COLUMN model_id DROP DEFAULT,
  ALTER COLUMN phase_id DROP DEFAULT;

-- 3) Vincolo di coerenza dominio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ck_work_logs_model_phase_by_activity'
  ) THEN
    ALTER TABLE work_logs
      ADD CONSTRAINT ck_work_logs_model_phase_by_activity
      CHECK (
        (activity_type = 'PRODUCTION' AND model_id IS NOT NULL AND phase_id IS NOT NULL)
        OR
        (activity_type = 'CLEANING' AND model_id IS NULL AND phase_id IS NULL)
      );
  END IF;
END $$;