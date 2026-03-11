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
ALTER TABLE "team_invitations" ALTER COLUMN "invited_by" SET DATA TYPE text;