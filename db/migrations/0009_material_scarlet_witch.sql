CREATE TYPE "public"."inbox_stage" AS ENUM('ARRIVED', 'ORGANIZE', 'NEXT', 'ORGANIZED');--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "inbox_stage" "inbox_stage" DEFAULT 'ARRIVED' NOT NULL;