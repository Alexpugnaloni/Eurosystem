-- Fix FK columns: drop serial defaults + add foreign keys

-- PHASES.customer_id: stop autoincrement + FK
ALTER TABLE phases
  ALTER COLUMN customer_id DROP DEFAULT;

ALTER TABLE phases
  ADD CONSTRAINT fk_phases_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id);

-- WORK_LOGS: stop autoincrement + FK
ALTER TABLE work_logs
  ALTER COLUMN user_id DROP DEFAULT,
  ALTER COLUMN customer_id DROP DEFAULT,
  ALTER COLUMN model_id DROP DEFAULT,
  ALTER COLUMN phase_id DROP DEFAULT;

ALTER TABLE work_logs
  ADD CONSTRAINT fk_work_logs_user
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE work_logs
  ADD CONSTRAINT fk_work_logs_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id);

ALTER TABLE work_logs
  ADD CONSTRAINT fk_work_logs_model
  FOREIGN KEY (model_id) REFERENCES models(id);

ALTER TABLE work_logs
  ADD CONSTRAINT fk_work_logs_phase
  FOREIGN KEY (phase_id) REFERENCES phases(id);

-- SESSIONS.user_id: stop autoincrement + FK
ALTER TABLE sessions
  ALTER COLUMN user_id DROP DEFAULT;

ALTER TABLE sessions
  ADD CONSTRAINT fk_sessions_user
  FOREIGN KEY (user_id) REFERENCES users(id);

-- DELIVERIES: stop autoincrement + FK
ALTER TABLE deliveries
  ALTER COLUMN customer_id DROP DEFAULT,
  ALTER COLUMN model_id DROP DEFAULT;

ALTER TABLE deliveries
  ADD CONSTRAINT fk_deliveries_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id);

ALTER TABLE deliveries
  ADD CONSTRAINT fk_deliveries_model
  FOREIGN KEY (model_id) REFERENCES models(id);