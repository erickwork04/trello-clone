ALTER TABLE "card" DROP CONSTRAINT "card_requirement_id_project_requirement_id_fk";
--> statement-breakpoint
ALTER TABLE "requirement_survey" DROP CONSTRAINT "requirement_survey_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "project_requirement" DROP CONSTRAINT "project_requirement_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "meeting" DROP CONSTRAINT "meeting_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "card" ADD CONSTRAINT "card_requirement_id_project_requirement_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."project_requirement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_survey" ADD CONSTRAINT "requirement_survey_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_requirement" ADD CONSTRAINT "project_requirement_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;