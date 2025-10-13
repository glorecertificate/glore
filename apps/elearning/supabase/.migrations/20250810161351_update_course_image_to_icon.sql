ALTER TABLE "public"."courses"
DROP COLUMN "image_url";

ALTER TABLE "public"."courses"
ADD COLUMN "icon" TEXT;

ALTER TABLE "public"."skill_groups"
DROP COLUMN "icon";
