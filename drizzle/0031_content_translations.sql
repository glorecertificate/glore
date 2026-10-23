CREATE TYPE "public"."content_entity_type" AS ENUM('course', 'lesson', 'doc_article', 'doc_category', 'skill_group');--> statement-breakpoint
CREATE TYPE "public"."content_translation_status" AS ENUM('machine', 'draft', 'reviewed');--> statement-breakpoint
CREATE TABLE "content_translations" (
	"entity_type" "content_entity_type" NOT NULL,
	"entity_id" integer NOT NULL,
	"locale" text NOT NULL,
	"status" "content_translation_status" NOT NULL,
	"source_hash" text NOT NULL,
	"translated_by_id" text,
	"reviewed_by_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_translations_entity_type_entity_id_locale_pk" PRIMARY KEY("entity_type","entity_id","locale")
);
--> statement-breakpoint
ALTER TABLE "doc_articles" ADD COLUMN "languages" text[] DEFAULT '{en,es,it}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "content_translations" ADD CONSTRAINT "content_translations_translated_by_id_users_id_fk" FOREIGN KEY ("translated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_translations" ADD CONSTRAINT "content_translations_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_translations_locale_status_idx" ON "content_translations" USING btree ("locale","status");