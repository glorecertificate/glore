-- Custom SQL migration file, put your code below! --
DELETE FROM "user_courses" a USING "user_courses" b WHERE a."user_id" = b."user_id" AND a."course_id" = b."course_id" AND a."id" > b."id";
--> statement-breakpoint
DELETE FROM "user_lessons" a USING "user_lessons" b WHERE a."user_id" = b."user_id" AND a."lesson_id" = b."lesson_id" AND a."id" > b."id";
--> statement-breakpoint
DELETE FROM "user_answers" a USING "user_answers" b WHERE a."user_id" = b."user_id" AND a."option_id" = b."option_id" AND a."id" > b."id";
--> statement-breakpoint
DELETE FROM "user_assessments" a USING "user_assessments" b WHERE a."user_id" = b."user_id" AND a."assessment_id" = b."assessment_id" AND a."id" > b."id";
--> statement-breakpoint
DELETE FROM "user_evaluations" a USING "user_evaluations" b WHERE a."user_id" = b."user_id" AND a."evaluation_id" = b."evaluation_id" AND a."id" > b."id";
--> statement-breakpoint
DELETE FROM "memberships" WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", row_number() OVER (
      PARTITION BY "user_id", "organization_id"
      ORDER BY CASE "role" WHEN 'admin' THEN 0 WHEN 'representative' THEN 1 WHEN 'tutor' THEN 2 WHEN 'volunteer' THEN 3 ELSE 4 END, "id"
    ) AS "rank" FROM "memberships"
  ) ranked WHERE "rank" > 1
);
