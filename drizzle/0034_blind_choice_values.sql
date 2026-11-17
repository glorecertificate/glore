DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "certificates" c
		JOIN "certificate_skills" s ON s."certificate_id" = c."id"
		WHERE c."status" IN ('approved', 'revoked') AND c."snapshot" IS NULL AND s."statement" IS NOT NULL
	) THEN
		RAISE EXCEPTION 'Issued certificates without a snapshot still carry tutor statements. Copy them into a snapshot before dropping certificate_skills.statement.';
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "certificate_skills" DROP CONSTRAINT "certificate_skills_self_level_check";--> statement-breakpoint
ALTER TABLE "certificate_skills" DROP CONSTRAINT "certificate_skills_level_check";--> statement-breakpoint
ALTER TABLE "certificate_skills" ALTER COLUMN "self_level" SET DATA TYPE text USING (CASE WHEN "self_level" IS NULL THEN NULL WHEN "self_level" >= 5 THEN 'advanced' WHEN "self_level" = 4 THEN 'good' ELSE 'intermediate' END);--> statement-breakpoint
ALTER TABLE "certificate_skills" ALTER COLUMN "level" SET DATA TYPE text USING (CASE WHEN "level" IS NULL THEN NULL WHEN "level" >= 5 THEN 'advanced' WHEN "level" = 4 THEN 'good' ELSE 'intermediate' END);--> statement-breakpoint
ALTER TABLE "user_assessments" ALTER COLUMN "value" SET DATA TYPE text USING (CASE WHEN "value" >= 5 THEN 'advanced' WHEN "value" = 4 THEN 'good' ELSE 'intermediate' END);
--> statement-breakpoint
ALTER TABLE "certificate_skills" ADD CONSTRAINT "certificate_skills_self_level_check" CHECK ("self_level" IS NULL OR "self_level" IN ('intermediate', 'good', 'advanced'));--> statement-breakpoint
ALTER TABLE "certificate_skills" ADD CONSTRAINT "certificate_skills_level_check" CHECK ("level" IS NULL OR "level" IN ('intermediate', 'good', 'advanced'));
