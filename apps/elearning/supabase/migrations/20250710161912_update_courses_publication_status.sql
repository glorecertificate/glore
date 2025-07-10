ALTER TABLE "public"."courses"
DROP COLUMN "publication_status";

ALTER TABLE "public"."courses"
ADD COLUMN "archived" BOOLEAN DEFAULT FALSE;

ALTER TABLE "public"."courses"
ADD COLUMN "draft_locales" locale[];

ALTER TABLE "public"."courses"
ADD COLUMN "published_locales" locale[];

DROP TYPE "public"."publication_status";
