-- Custom SQL migration file, put your code below! --
UPDATE "skill_groups" SET "slug" = CASE
  WHEN "name"->>'en' = 'Work' THEN 'work-skills'
  ELSE trim(BOTH '-' FROM regexp_replace(lower(coalesce("name"->>'en', '')), '[^a-z0-9]+', '-', 'g'))
END WHERE "slug" IS NULL;
--> statement-breakpoint
UPDATE "skill_groups" SET "slug" = 'skill-group-' || "id" WHERE "slug" = '';
