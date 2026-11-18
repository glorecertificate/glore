ALTER TABLE "certificate_skills" DROP CONSTRAINT "certificate_skills_self_level_check";--> statement-breakpoint
ALTER TABLE "certificate_skills" DROP CONSTRAINT "certificate_skills_level_check";--> statement-breakpoint
ALTER TABLE "certificate_skills" ALTER COLUMN "self_level" SET DATA TYPE "public"."skill_level" USING "self_level"::"public"."skill_level";--> statement-breakpoint
ALTER TABLE "certificate_skills" ALTER COLUMN "level" SET DATA TYPE "public"."skill_level" USING "level"::"public"."skill_level";--> statement-breakpoint
ALTER TABLE "user_assessments" ALTER COLUMN "value" SET DATA TYPE "public"."skill_level" USING "value"::"public"."skill_level";--> statement-breakpoint
ALTER TABLE "certificate_skills" DROP COLUMN "statement";