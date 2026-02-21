-- 0004_dusty_freak.sql (edited)
-- Fix: aggiunta customer_id con backfill prima di NOT NULL

DROP INDEX IF EXISTS "ux_models_name";--> statement-breakpoint

-- code diventa opzionale
ALTER TABLE "models" ALTER COLUMN "code" DROP NOT NULL;--> statement-breakpoint

-- 1) aggiungo customer_id come NULLABLE per poter fare backfill
ALTER TABLE "models" ADD COLUMN "customer_id" bigint;--> statement-breakpoint

-- 2) backfill customer_id da customer_models (associazione attiva più recente)
WITH picked AS (
  SELECT DISTINCT ON (cm.model_id)
    cm.model_id,
    cm.customer_id
  FROM "customer_models" cm
  WHERE cm.is_active = true
  ORDER BY cm.model_id, cm.updated_at DESC, cm.created_at DESC
)
UPDATE "models" m
SET "customer_id" = p.customer_id
FROM picked p
WHERE m.id = p.model_id
  AND m.customer_id IS NULL;--> statement-breakpoint

-- 3) fallback: assegno eventuali modelli senza associazione a AZIENDA_INTERNA
UPDATE "models"
SET "customer_id" = (
  SELECT c.id
  FROM "customers" c
  WHERE c.is_internal = true
    AND c.name = 'AZIENDA_INTERNA'
  LIMIT 1
)
WHERE "customer_id" IS NULL;--> statement-breakpoint

-- 4) adesso posso rendere NOT NULL
ALTER TABLE "models" ALTER COLUMN "customer_id" SET NOT NULL;--> statement-breakpoint

-- 5) FK
ALTER TABLE "models"
  ADD CONSTRAINT "models_customer_id_customers_id_fk"
  FOREIGN KEY ("customer_id")
  REFERENCES "public"."customers"("id")
  ON DELETE no action
  ON UPDATE no action;--> statement-breakpoint

-- 6) indici nuovi
CREATE UNIQUE INDEX "ux_models_customer_name"
  ON "models" USING btree ("customer_id","name");--> statement-breakpoint

-- code nullable: unique ok (più NULL ammessi)
CREATE UNIQUE INDEX "ux_models_customer_code"
  ON "models" USING btree ("customer_id","code");--> statement-breakpoint

CREATE INDEX "ix_models_customer"
  ON "models" USING btree ("customer_id");--> statement-breakpoint