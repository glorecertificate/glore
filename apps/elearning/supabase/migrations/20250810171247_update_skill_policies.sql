CREATE POLICY "Allow all users to view skill groups" ON "public"."skill_groups" AS permissive FOR
SELECT
  TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can view skills" ON "public"."skills" AS permissive FOR
SELECT
  TO authenticated USING (TRUE);
