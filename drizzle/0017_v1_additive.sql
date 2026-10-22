CREATE TYPE "public"."certificate_review_decision" AS ENUM('approved', 'changes_requested', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."skill_compass_kind" AS ENUM('strength', 'goal');--> statement-breakpoint
ALTER TYPE "public"."certificate_status" ADD VALUE 'rejected';--> statement-breakpoint
ALTER TYPE "public"."certificate_status" ADD VALUE 'withdrawn';--> statement-breakpoint
ALTER TYPE "public"."certificate_status" ADD VALUE 'revoked';--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "activity_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"actor_id" text,
	"organization_id" integer,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificate_reviews" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "certificate_reviews_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"certificate_id" integer NOT NULL,
	"reviewer_id" text,
	"decision" "certificate_review_decision" NOT NULL,
	"comment" text,
	"section_comments" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score_engagement" smallint,
	"score_evidence" smallint,
	"score_reflection" smallint,
	"score_growth" smallint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "certificate_reviews_score_engagement_check" CHECK (score_engagement is null or score_engagement between 1 and 5),
	CONSTRAINT "certificate_reviews_score_evidence_check" CHECK (score_evidence is null or score_evidence between 1 and 5),
	CONSTRAINT "certificate_reviews_score_reflection_check" CHECK (score_reflection is null or score_reflection between 1 and 5),
	CONSTRAINT "certificate_reviews_score_growth_check" CHECK (score_growth is null or score_growth between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "organization_ratings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organization_ratings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"certificate_id" integer NOT NULL,
	"organization_id" integer NOT NULL,
	"experience" smallint,
	"support" smallint,
	"certification_support" smallint,
	"would_recommend" boolean,
	"comment" varchar(400),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_ratings_certificateId_unique" UNIQUE("certificate_id"),
	CONSTRAINT "organization_ratings_experience_check" CHECK (experience is null or experience between 1 and 5),
	CONSTRAINT "organization_ratings_support_check" CHECK (support is null or support between 1 and 5),
	CONSTRAINT "organization_ratings_certification_support_check" CHECK (certification_support is null or certification_support between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "course_ratings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "course_ratings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"course_id" integer NOT NULL,
	"rating" smallint NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_ratings_rating_check" CHECK ("course_ratings"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"url" text,
	"read_at" timestamp,
	"emailed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_invitations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organization_invitations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organization_id" integer NOT NULL,
	"email" text NOT NULL,
	"role" "role" NOT NULL,
	"token" text NOT NULL,
	"invited_by_id" text,
	"user_id" text,
	"locale" text,
	"message" text,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"declined_at" timestamp,
	"revoked_at" timestamp,
	"last_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "organization_invite_links" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organization_invite_links_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organization_id" integer NOT NULL,
	"role" "role" NOT NULL,
	"token" text NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"max_uses" integer,
	"uses" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_invite_links_token_unique" UNIQUE("token"),
	CONSTRAINT "org_invite_links_role_check" CHECK ("organization_invite_links"."role" in ('volunteer', 'learner'))
);
--> statement-breakpoint
CREATE TABLE "user_skill_compass" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_skill_compass_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"course_id" integer NOT NULL,
	"kind" "skill_compass_kind" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certificate_skills" DROP CONSTRAINT "certificate_skills_certificate_id_certificates_id_fk";
--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "courses_creator_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "team_invitations" DROP CONSTRAINT "team_invitations_invited_by_users_id_fk";
--> statement-breakpoint
DROP INDEX "doc_categories_slug_idx";--> statement-breakpoint
DROP INDEX "organization_profiles_organization_id_idx";--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "creator_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "team_invitations" ALTER COLUMN "invited_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "certificate_skills" ADD COLUMN "self_level" smallint;--> statement-breakpoint
ALTER TABLE "certificate_skills" ADD COLUMN "level" smallint;--> statement-breakpoint
ALTER TABLE "certificate_skills" ADD COLUMN "evidence" text;--> statement-breakpoint
ALTER TABLE "certificate_skills" ADD COLUMN "statement" text;--> statement-breakpoint
ALTER TABLE "certificate_skills" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "tasks" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "rejected_reason" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "revoked_at" timestamp;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "revoked_by_id" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "revoked_reason" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "withdrawn_at" timestamp;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "duration_minutes" integer;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "outcomes" jsonb;--> statement-breakpoint
ALTER TABLE "organization_join_requests" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "organization_join_requests" ADD COLUMN "invite_link_id" integer;--> statement-breakpoint
ALTER TABLE "organization_profiles" ADD COLUMN "legal_name" text;--> statement-breakpoint
ALTER TABLE "organization_profiles" ADD COLUMN "registry_id" text;--> statement-breakpoint
ALTER TABLE "organization_profiles" ADD COLUMN "legal_representative" text;--> statement-breakpoint
ALTER TABLE "organization_profiles" ADD COLUMN "signature_url" text;--> statement-breakpoint
ALTER TABLE "organization_profiles" ADD COLUMN "contact_name" text;--> statement-breakpoint
ALTER TABLE "organization_profiles" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "organization_profiles" ADD COLUMN "volunteers_per_year" integer;--> statement-breakpoint
ALTER TABLE "organization_profiles" ADD COLUMN "motivation" text;--> statement-breakpoint
ALTER TABLE "organization_profiles" ADD COLUMN "charter_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_assessments" ADD COLUMN "reflection" text;--> statement-breakpoint
ALTER TABLE "user_courses" ADD COLUMN "last_lesson_id" integer;--> statement-breakpoint
ALTER TABLE "user_courses" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "skill_groups" ADD COLUMN "description" jsonb;--> statement-breakpoint
ALTER TABLE "skill_groups" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "skill_groups" ADD COLUMN "sort_order" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birth_place" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nationality" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "public_profile" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notification_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_reviews" ADD CONSTRAINT "certificate_reviews_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_reviews" ADD CONSTRAINT "certificate_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_ratings" ADD CONSTRAINT "organization_ratings_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_ratings" ADD CONSTRAINT "organization_ratings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_ratings" ADD CONSTRAINT "course_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_ratings" ADD CONSTRAINT "course_ratings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite_links" ADD CONSTRAINT "organization_invite_links_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invite_links" ADD CONSTRAINT "organization_invite_links_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_compass" ADD CONSTRAINT "user_skill_compass_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_compass" ADD CONSTRAINT "user_skill_compass_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_events_subject_idx" ON "activity_events" USING btree ("subject_type","subject_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_events_organization_id_idx" ON "activity_events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_events_actor_id_idx" ON "activity_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "certificate_reviews_certificate_id_idx" ON "certificate_reviews" USING btree ("certificate_id","created_at");--> statement-breakpoint
CREATE INDEX "certificate_reviews_reviewer_id_idx" ON "certificate_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "organization_ratings_organization_id_idx" ON "organization_ratings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "course_ratings_course_id_idx" ON "course_ratings" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_ratings_user_id_course_id_key" ON "course_ratings" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications" USING btree ("user_id","read_at","created_at");--> statement-breakpoint
CREATE INDEX "org_invitations_organization_id_idx" ON "organization_invitations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "org_invitations_user_id_idx" ON "organization_invitations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "org_invitations_invited_by_id_idx" ON "organization_invitations" USING btree ("invited_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_invitations_open_email_key" ON "organization_invitations" USING btree ("organization_id",lower("email")) WHERE accepted_at is null and declined_at is null and revoked_at is null;--> statement-breakpoint
CREATE INDEX "org_invite_links_organization_id_idx" ON "organization_invite_links" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "org_invite_links_created_by_id_idx" ON "organization_invite_links" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "user_skill_compass_course_id_idx" ON "user_skill_compass" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_skill_compass_user_id_course_id_kind_key" ON "user_skill_compass" USING btree ("user_id","course_id","kind");--> statement-breakpoint
ALTER TABLE "certificate_skills" ADD CONSTRAINT "certificate_skills_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_revoked_by_id_users_id_fk" FOREIGN KEY ("revoked_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_join_requests" ADD CONSTRAINT "organization_join_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_join_requests" ADD CONSTRAINT "organization_join_requests_invite_link_id_organization_invite_links_id_fk" FOREIGN KEY ("invite_link_id") REFERENCES "public"."organization_invite_links"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_last_lesson_id_lessons_id_fk" FOREIGN KEY ("last_lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "certificate_skills_certificate_id_course_id_key" ON "certificate_skills" USING btree ("certificate_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "doc_articles_slug_key" ON "doc_articles" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "doc_categories_slug_key" ON "doc_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "org_join_requests_user_id_idx" ON "organization_join_requests" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_join_requests_pending_email_key" ON "organization_join_requests" USING btree ("organization_id",lower("email")) WHERE status = 'pending';--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_code_unique" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "certificate_skills" ADD CONSTRAINT "certificate_skills_self_level_check" CHECK (self_level is null or self_level between 1 and 5);--> statement-breakpoint
ALTER TABLE "certificate_skills" ADD CONSTRAINT "certificate_skills_level_check" CHECK (level is null or level between 1 and 5);