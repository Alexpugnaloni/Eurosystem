CREATE TYPE "public"."activity_type" AS ENUM('PRODUCTION', 'CLEANING');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'WORKER');--> statement-breakpoint
CREATE TABLE "customer_models" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"customer_id" bigserial NOT NULL,
	"model_id" bigserial NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"code" varchar(50) NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"delivery_date" date NOT NULL,
	"customer_id" bigserial NOT NULL,
	"model_id" bigserial NOT NULL,
	"quantity" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"code" varchar(80) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phases" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"customer_id" bigserial NOT NULL,
	"name" varchar(120) NOT NULL,
	"sort_order" integer DEFAULT 1 NOT NULL,
	"is_final" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"first_name" varchar(80) NOT NULL,
	"last_name" varchar(80) NOT NULL,
	"employee_code" varchar(50) NOT NULL,
	"username" varchar(80) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'WORKER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"work_date" date NOT NULL,
	"user_id" bigserial NOT NULL,
	"customer_id" bigserial NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"model_id" bigserial,
	"phase_id" bigserial,
	"start_time" time,
	"end_time" time,
	"duration_minutes" integer NOT NULL,
	"qty_ok" integer DEFAULT 0 NOT NULL,
	"qty_ko" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "test_table" CASCADE;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_customer_models_customer_model" ON "customer_models" USING btree ("customer_id","model_id");--> statement-breakpoint
CREATE INDEX "ix_customer_models_customer" ON "customer_models" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "ix_customer_models_model" ON "customer_models" USING btree ("model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_customers_name" ON "customers" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_customers_code" ON "customers" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ix_deliveries_customer_model_date" ON "deliveries" USING btree ("customer_id","model_id","delivery_date");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_models_name" ON "models" USING btree ("name");--> statement-breakpoint
CREATE INDEX "ix_models_code" ON "models" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_phases_customer_name" ON "phases" USING btree ("customer_id","name");--> statement-breakpoint
CREATE INDEX "ix_phases_customer" ON "phases" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "ix_phases_is_final" ON "phases" USING btree ("is_final");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_users_employee_code" ON "users" USING btree ("employee_code");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_users_username" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "ix_work_logs_work_date" ON "work_logs" USING btree ("work_date");--> statement-breakpoint
CREATE INDEX "ix_work_logs_user" ON "work_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ix_work_logs_customer" ON "work_logs" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "ix_work_logs_model" ON "work_logs" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "ix_work_logs_phase" ON "work_logs" USING btree ("phase_id");--> statement-breakpoint
CREATE INDEX "ix_work_logs_activity_type" ON "work_logs" USING btree ("activity_type");