ALTER TABLE "public"."organizations"
DROP CONSTRAINT "valid_url";

ALTER TABLE "public"."organizations"
DROP COLUMN "website";

ALTER TABLE "public"."organizations"
ADD COLUMN "url" TEXT;
