-- Custom SQL migration file, put your code below! --
UPDATE "certificates" SET "code" = (
  SELECT string_agg(
    substr('0123456789ABCDEFGHJKMNPQRSTVWXYZ', (get_byte(bytes, CASE WHEN i < 6 THEN i ELSE i + 1 END) & 31) + 1, 1) || CASE WHEN i IN (3, 7) THEN '-' ELSE '' END,
    '' ORDER BY i
  )
  FROM (SELECT uuid_send(gen_random_uuid()) AS bytes) AS random_source, generate_series(0, 11) AS i
  WHERE "certificates"."id" IS NOT NULL
) WHERE "code" IS NULL;
--> statement-breakpoint
INSERT INTO "organization_ratings" ("certificate_id", "organization_id", "experience", "created_at", "updated_at")
SELECT "id", "organization_id", "organization_rating", "created_at", "updated_at"
FROM "certificates"
WHERE "organization_rating" BETWEEN 1 AND 5
ON CONFLICT ("certificate_id") DO NOTHING;
