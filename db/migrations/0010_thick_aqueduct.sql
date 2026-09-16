ALTER TABLE "focus_session" ADD COLUMN "paused_at" timestamp;--> statement-breakpoint
ALTER TABLE "focus_session" ADD COLUMN "accumulated_seconds" integer DEFAULT 0 NOT NULL;