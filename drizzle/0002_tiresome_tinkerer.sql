CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "assessments" RENAME COLUMN "lessonId" TO "lesson_id";--> statement-breakpoint
ALTER TABLE "assessments" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "assessments" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "evaluations" RENAME COLUMN "lessonId" TO "lesson_id";--> statement-breakpoint
ALTER TABLE "evaluations" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "question_options" RENAME COLUMN "questionId" TO "question_id";--> statement-breakpoint
ALTER TABLE "question_options" RENAME COLUMN "isCorrect" TO "is_correct";--> statement-breakpoint
ALTER TABLE "question_options" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "question_options" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "questions" RENAME COLUMN "lessonId" TO "lesson_id";--> statement-breakpoint
ALTER TABLE "questions" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "questions" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "certificate_skills" RENAME COLUMN "certificateId" TO "certificate_id";--> statement-breakpoint
ALTER TABLE "certificate_skills" RENAME COLUMN "courseId" TO "course_id";--> statement-breakpoint
ALTER TABLE "certificate_skills" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "certificate_skills" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "certificates" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "certificates" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "certificates" RENAME COLUMN "activityStartDate" TO "activity_start_date";--> statement-breakpoint
ALTER TABLE "certificates" RENAME COLUMN "activityEndDate" TO "activity_end_date";--> statement-breakpoint
ALTER TABLE "certificates" RENAME COLUMN "activityDuration" TO "activity_duration";--> statement-breakpoint
ALTER TABLE "certificates" RENAME COLUMN "activityLocation" TO "activity_location";--> statement-breakpoint
ALTER TABLE "certificates" RENAME COLUMN "activityDescription" TO "activity_description";--> statement-breakpoint
ALTER TABLE "certificates" RENAME COLUMN "organizationRating" TO "organization_rating";--> statement-breakpoint
ALTER TABLE "certificates" RENAME COLUMN "reviewerId" TO "reviewer_id";--> statement-breakpoint
ALTER TABLE "certificates" RENAME COLUMN "reviewerComment" TO "reviewer_comment";--> statement-breakpoint
ALTER TABLE "certificates" RENAME COLUMN "documentUrl" TO "document_url";--> statement-breakpoint
ALTER TABLE "certificates" RENAME COLUMN "issuedAt" TO "issued_at";--> statement-breakpoint
ALTER TABLE "certificates" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "certificates" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "contributions" RENAME COLUMN "lessonId" TO "lesson_id";--> statement-breakpoint
ALTER TABLE "contributions" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "contributions" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "contributions" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "courses" RENAME COLUMN "skillGroupId" TO "skill_group_id";--> statement-breakpoint
ALTER TABLE "courses" RENAME COLUMN "creatorId" TO "creator_id";--> statement-breakpoint
ALTER TABLE "courses" RENAME COLUMN "sortOrder" TO "sort_order";--> statement-breakpoint
ALTER TABLE "courses" RENAME COLUMN "archivedAt" TO "archived_at";--> statement-breakpoint
ALTER TABLE "courses" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "courses" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "lessons" RENAME COLUMN "courseId" TO "course_id";--> statement-breakpoint
ALTER TABLE "lessons" RENAME COLUMN "sortOrder" TO "sort_order";--> statement-breakpoint
ALTER TABLE "lessons" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "lessons" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "doc_articles" RENAME COLUMN "categoryId" TO "category_id";--> statement-breakpoint
ALTER TABLE "doc_articles" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "doc_articles" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "doc_categories" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "doc_categories" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "memberships" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "memberships" RENAME COLUMN "organizationId" TO "organization_id";--> statement-breakpoint
ALTER TABLE "memberships" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "memberships" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "organizations" RENAME COLUMN "avatarUrl" TO "avatar_url";--> statement-breakpoint
ALTER TABLE "organizations" RENAME COLUMN "approvedAt" TO "approved_at";--> statement-breakpoint
ALTER TABLE "organizations" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "organizations" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "user_answers" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "user_answers" RENAME COLUMN "optionId" TO "option_id";--> statement-breakpoint
ALTER TABLE "user_answers" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "user_answers" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "user_assessments" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "user_assessments" RENAME COLUMN "assessmentId" TO "assessment_id";--> statement-breakpoint
ALTER TABLE "user_assessments" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "user_assessments" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "user_courses" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "user_courses" RENAME COLUMN "courseId" TO "course_id";--> statement-breakpoint
ALTER TABLE "user_courses" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "user_courses" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "user_evaluations" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "user_evaluations" RENAME COLUMN "evaluationId" TO "evaluation_id";--> statement-breakpoint
ALTER TABLE "user_evaluations" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "user_evaluations" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "user_lessons" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "user_lessons" RENAME COLUMN "lessonId" TO "lesson_id";--> statement-breakpoint
ALTER TABLE "user_lessons" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "user_lessons" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "regions" RENAME COLUMN "coordinatorId" TO "coordinator_id";--> statement-breakpoint
ALTER TABLE "regions" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "regions" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "skill_groups" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "skill_groups" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "team_invitations" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "team_invitations" RENAME COLUMN "firstName" TO "first_name";--> statement-breakpoint
ALTER TABLE "team_invitations" RENAME COLUMN "lastName" TO "last_name";--> statement-breakpoint
ALTER TABLE "team_invitations" RENAME COLUMN "invitedBy" TO "invited_by";--> statement-breakpoint
ALTER TABLE "team_invitations" RENAME COLUMN "expiresAt" TO "expires_at";--> statement-breakpoint
ALTER TABLE "team_invitations" RENAME COLUMN "acceptedAt" TO "accepted_at";--> statement-breakpoint
ALTER TABLE "team_invitations" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "team_invitations" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "firstName" TO "first_name";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "lastName" TO "last_name";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "avatarUrl" TO "avatar_url";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "isEditor" TO "is_editor";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "onboardedAt" TO "onboarded_at";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "assessments" DROP CONSTRAINT "assessments_lessonId_lessons_id_fk";
--> statement-breakpoint
ALTER TABLE "evaluations" DROP CONSTRAINT "evaluations_lessonId_lessons_id_fk";
--> statement-breakpoint
ALTER TABLE "question_options" DROP CONSTRAINT "question_options_questionId_questions_id_fk";
--> statement-breakpoint
ALTER TABLE "questions" DROP CONSTRAINT "questions_lessonId_lessons_id_fk";
--> statement-breakpoint
ALTER TABLE "certificate_skills" DROP CONSTRAINT "certificate_skills_certificateId_certificates_id_fk";
--> statement-breakpoint
ALTER TABLE "certificate_skills" DROP CONSTRAINT "certificate_skills_courseId_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "certificates" DROP CONSTRAINT "certificates_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "certificates" DROP CONSTRAINT "certificates_organizationId_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "certificates" DROP CONSTRAINT "certificates_reviewerId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "contributions" DROP CONSTRAINT "contributions_lessonId_lessons_id_fk";
--> statement-breakpoint
ALTER TABLE "contributions" DROP CONSTRAINT "contributions_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "courses_skillGroupId_skill_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "courses_creatorId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "lessons" DROP CONSTRAINT "lessons_courseId_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "doc_articles" DROP CONSTRAINT "doc_articles_categoryId_doc_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_organizationId_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "user_answers" DROP CONSTRAINT "user_answers_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_answers" DROP CONSTRAINT "user_answers_optionId_question_options_id_fk";
--> statement-breakpoint
ALTER TABLE "user_assessments" DROP CONSTRAINT "user_assessments_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_assessments" DROP CONSTRAINT "user_assessments_assessmentId_assessments_id_fk";
--> statement-breakpoint
ALTER TABLE "user_courses" DROP CONSTRAINT "user_courses_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_courses" DROP CONSTRAINT "user_courses_courseId_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "user_evaluations" DROP CONSTRAINT "user_evaluations_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_evaluations" DROP CONSTRAINT "user_evaluations_evaluationId_evaluations_id_fk";
--> statement-breakpoint
ALTER TABLE "user_lessons" DROP CONSTRAINT "user_lessons_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_lessons" DROP CONSTRAINT "user_lessons_lessonId_lessons_id_fk";
--> statement-breakpoint
ALTER TABLE "regions" DROP CONSTRAINT "regions_coordinatorId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "team_invitations" DROP CONSTRAINT "team_invitations_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "team_invitations" DROP CONSTRAINT "team_invitations_invitedBy_users_id_fk";
--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "evaluations" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "display_username" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "reviewer_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "contributions" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "creator_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "memberships" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_answers" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_assessments" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_courses" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_evaluations" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_lessons" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "regions" ALTER COLUMN "coordinator_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "team_invitations" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "team_invitations" ALTER COLUMN "invited_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_skills" ADD CONSTRAINT "certificate_skills_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_skills" ADD CONSTRAINT "certificate_skills_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_skill_group_id_skill_groups_id_fk" FOREIGN KEY ("skill_group_id") REFERENCES "public"."skill_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_articles" ADD CONSTRAINT "doc_articles_category_id_doc_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."doc_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_option_id_question_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."question_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assessments" ADD CONSTRAINT "user_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assessments" ADD CONSTRAINT "user_assessments_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_evaluations" ADD CONSTRAINT "user_evaluations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_evaluations" ADD CONSTRAINT "user_evaluations_evaluation_id_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lessons" ADD CONSTRAINT "user_lessons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lessons" ADD CONSTRAINT "user_lessons_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_coordinator_id_users_id_fk" FOREIGN KEY ("coordinator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "isAdmin";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
