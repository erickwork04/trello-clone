CREATE TABLE "board_share" (
	"board_id" text PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"encrypted_token" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	CONSTRAINT "board_share_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "board_card_observation" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"card_id" text NOT NULL,
	"visitor_name" text,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board_share" ADD CONSTRAINT "board_share_board_id_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."board"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_card_observation" ADD CONSTRAINT "board_card_observation_board_id_board_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."board"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_card_observation" ADD CONSTRAINT "board_card_observation_card_id_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "board_card_observation_board_created_idx" ON "board_card_observation" USING btree ("board_id","created_at");--> statement-breakpoint
CREATE INDEX "board_card_observation_card_created_idx" ON "board_card_observation" USING btree ("card_id","created_at");