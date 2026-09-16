CREATE TYPE "public"."column_type" AS ENUM('DEFAULT', 'PENDING', 'IN_PROGRESS', 'DONE');--> statement-breakpoint
ALTER TABLE "column" ADD COLUMN "type" "column_type" DEFAULT 'DEFAULT' NOT NULL;