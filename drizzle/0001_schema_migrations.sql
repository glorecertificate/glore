ALTER TYPE "public"."role" ADD VALUE 'admin';--> statement-breakpoint
CREATE TYPE "public"."certificate_status" AS ENUM('draft', 'submitted', 'in_review', 'changes_requested', 'approved');--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "status" "certificate_status" NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "is_default" boolean NOT NULL DEFAULT false;
