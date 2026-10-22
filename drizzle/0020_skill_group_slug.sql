ALTER TABLE "skill_groups" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "skill_groups" ADD CONSTRAINT "skill_groups_slug_unique" UNIQUE("slug");