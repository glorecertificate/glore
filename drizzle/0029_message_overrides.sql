CREATE TYPE "public"."message_origin" AS ENUM('human', 'machine', 'import', 'tms');--> statement-breakpoint
CREATE TYPE "public"."message_revision_action" AS ENUM('draft', 'publish', 'reset', 'discard');--> statement-breakpoint
CREATE TABLE "message_override_revisions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "message_override_revisions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"locale" text NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"action" "message_revision_action" NOT NULL,
	"actor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_overrides" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "message_overrides_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"locale" text NOT NULL,
	"key" text NOT NULL,
	"namespace" text NOT NULL,
	"value" text,
	"draft_value" text,
	"source_hash" text NOT NULL,
	"base_hash" text,
	"origin" "message_origin" DEFAULT 'human' NOT NULL,
	"external_id" text,
	"updated_by_id" text,
	"published_by_id" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "message_overrides_has_text_check" CHECK ("message_overrides"."value" is not null or "message_overrides"."draft_value" is not null)
);
--> statement-breakpoint
ALTER TABLE "message_override_revisions" ADD CONSTRAINT "message_override_revisions_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_overrides" ADD CONSTRAINT "message_overrides_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_overrides" ADD CONSTRAINT "message_overrides_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "message_override_revisions_key_idx" ON "message_override_revisions" USING btree ("locale","key","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "message_overrides_locale_key_key" ON "message_overrides" USING btree ("locale","key");--> statement-breakpoint
CREATE INDEX "message_overrides_locale_namespace_idx" ON "message_overrides" USING btree ("locale","namespace");--> statement-breakpoint
CREATE INDEX "message_overrides_pending_idx" ON "message_overrides" USING btree ("locale","namespace") WHERE "message_overrides"."draft_value" is not null;