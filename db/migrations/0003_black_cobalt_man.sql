CREATE TYPE "public"."task_area" AS ENUM('WORK', 'STUDIES', 'PERSONAL', 'INBOX');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('BACKLOG', 'WEEK', 'TODAY', 'DOING', 'DONE', 'CANCELED');--> statement-breakpoint
CREATE TABLE "task" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"area" "task_area" DEFAULT 'INBOX' NOT NULL,
	"status" "task_status" DEFAULT 'BACKLOG' NOT NULL,
	"priority" "task_priority" DEFAULT 'MEDIUM' NOT NULL,
	"planned_date" date,
	"due_date" date,
	"estimated_minutes" integer,
	"is_top_priority" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_user_id_idx" ON "task" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "task_status_idx" ON "task" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_planned_date_idx" ON "task" USING btree ("planned_date");