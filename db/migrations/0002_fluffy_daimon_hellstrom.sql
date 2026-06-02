CREATE TABLE "card" (
	"id" text PRIMARY KEY NOT NULL,
	"column_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "column" ALTER COLUMN "color" SET DEFAULT 'slate';--> statement-breakpoint
ALTER TABLE "card" ADD CONSTRAINT "card_column_id_column_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."column"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_column_id_idx" ON "card" USING btree ("column_id");