CREATE TYPE "public"."legal_translation_status" AS ENUM('draft', 'machine', 'reviewed');--> statement-breakpoint
CREATE TYPE "public"."legal_version_status" AS ENUM('draft', 'published', 'superseded');--> statement-breakpoint
CREATE TABLE "legal_acceptances" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "legal_acceptances_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"version_id" integer NOT NULL,
	"locale" text NOT NULL,
	"accepted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"slug" text PRIMARY KEY NOT NULL,
	"requires_acceptance" boolean DEFAULT false NOT NULL,
	"current_version_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_translations" (
	"version_id" integer NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"status" "legal_translation_status" DEFAULT 'draft' NOT NULL,
	"source_hash" text,
	"updated_by_id" text,
	"reviewed_by_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "legal_translations_pkey" PRIMARY KEY("version_id","locale")
);
--> statement-breakpoint
CREATE TABLE "legal_versions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "legal_versions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"document_slug" text NOT NULL,
	"version" integer NOT NULL,
	"status" "legal_version_status" DEFAULT 'draft' NOT NULL,
	"material" boolean DEFAULT false NOT NULL,
	"change_note" text,
	"effective_at" date,
	"published_at" timestamp,
	"published_by_id" text,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_version_id_legal_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."legal_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_current_version_id_legal_versions_id_fk" FOREIGN KEY ("current_version_id") REFERENCES "public"."legal_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_translations" ADD CONSTRAINT "legal_translations_version_id_legal_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."legal_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_translations" ADD CONSTRAINT "legal_translations_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_translations" ADD CONSTRAINT "legal_translations_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_versions" ADD CONSTRAINT "legal_versions_document_slug_legal_documents_slug_fk" FOREIGN KEY ("document_slug") REFERENCES "public"."legal_documents"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_versions" ADD CONSTRAINT "legal_versions_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_versions" ADD CONSTRAINT "legal_versions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "legal_acceptances_user_id_version_id_key" ON "legal_acceptances" USING btree ("user_id","version_id");--> statement-breakpoint
CREATE INDEX "legal_acceptances_version_id_idx" ON "legal_acceptances" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "legal_translations_updated_by_id_idx" ON "legal_translations" USING btree ("updated_by_id");--> statement-breakpoint
CREATE INDEX "legal_translations_reviewed_by_id_idx" ON "legal_translations" USING btree ("reviewed_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_versions_document_slug_version_key" ON "legal_versions" USING btree ("document_slug","version");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_versions_one_draft_key" ON "legal_versions" USING btree ("document_slug") WHERE "legal_versions"."status" = 'draft';--> statement-breakpoint
CREATE INDEX "legal_versions_published_by_id_idx" ON "legal_versions" USING btree ("published_by_id");--> statement-breakpoint
CREATE INDEX "legal_versions_created_by_id_idx" ON "legal_versions" USING btree ("created_by_id");