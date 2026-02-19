CREATE TABLE "sessions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigserial NOT NULL,
	"token" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ux_sessions_token" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "ix_sessions_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ix_sessions_expires" ON "sessions" USING btree ("expires_at");