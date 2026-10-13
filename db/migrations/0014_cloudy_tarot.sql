ALTER TABLE "card" ADD COLUMN "requirement_id" text;--> statement-breakpoint
ALTER TABLE "card" ADD CONSTRAINT "card_requirement_id_project_requirement_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."project_requirement"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "card_requirement_id_unique" ON "card" USING btree ("requirement_id");