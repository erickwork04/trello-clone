CREATE TABLE "card_tag" (
	"card_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "card_tag_card_id_tag_id_pk" PRIMARY KEY("card_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "card_checklist_item" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"title" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "card" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "card_tag" ADD CONSTRAINT "card_tag_card_id_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_tag" ADD CONSTRAINT "card_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_checklist_item" ADD CONSTRAINT "card_checklist_item_card_id_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_checklist_item_card_id_idx" ON "card_checklist_item" USING btree ("card_id");