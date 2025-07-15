DROP POLICY "Admins, service roles, and users with is_admin can delete membe" ON "public"."memberships";

DROP POLICY "Admins, service roles, and users with is_admin can insert membe" ON "public"."memberships";

DROP POLICY "Admins, service roles, and users with is_admin can select membe" ON "public"."memberships";

DROP POLICY "Admins, service roles, and users with is_admin can update membe" ON "public"."memberships";

DROP POLICY "Users can see their own memberships" ON "public"."memberships";

ALTER TABLE "public"."regions"
ADD COLUMN "emoji" TEXT DEFAULT 'NULL'::TEXT;

ALTER TABLE "public"."regions"
ADD COLUMN "icon_url" TEXT DEFAULT 'NULL'::TEXT;

ALTER TABLE "public"."user_courses"
ADD COLUMN "locale" locale NOT NULL;

SET
  check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_public_user () returns trigger language plpgsql security definer
SET
  search_path TO '' AS $function$
begin
  insert into public.users (
    id,
    email,
    phone,
    first_name,
    last_name,
    is_admin,
    is_editor
  )
  values (
    new.id,
    new.email,
    new.phone,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    COALESCE(new.raw_user_meta_data ->> 'is_admin', 'false')::boolean,
    COALESCE(new.raw_user_meta_data ->> 'is_editor', 'false')::boolean
  );
  return new;
end;
$function$;

CREATE POLICY "Authenticated users can view courses with published locales" ON "public"."courses" AS permissive FOR
SELECT
  TO authenticated USING (
    (
      (published_locales IS NOT NULL) AND
      (ARRAY_LENGTH(published_locales, 1) > 0)
    )
  );

CREATE POLICY "Admins and service roles can delete memberships" ON "public"."memberships" AS permissive FOR ALL TO authenticated USING (
  (
    (
      SELECT
        users.is_admin
      FROM
        users
      WHERE
        (users.id = auth.uid ())
    ) OR
    (
      SELECT
        users.is_admin
      FROM
        users
      WHERE
        (users.id = auth.uid ())
    ) OR
    (
      SELECT
        (auth.role () = 'service_role'::TEXT)
    )
  )
);

CREATE POLICY "Admins and service roles can insert memberships" ON "public"."memberships" AS permissive FOR ALL TO authenticated
WITH
  CHECK (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          (auth.role () = 'service_role'::TEXT)
      )
    )
  );

CREATE POLICY "Admins and service roles can update memberships" ON "public"."memberships" AS permissive FOR ALL TO authenticated
WITH
  CHECK (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          (auth.role () = 'service_role'::TEXT)
      )
    )
  );

CREATE POLICY "Authenticated users can select memberships" ON "public"."memberships" AS permissive FOR
SELECT
  TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can view all organizations" ON "public"."organizations" AS permissive FOR
SELECT
  TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can view all users" ON "public"."users" AS permissive FOR
SELECT
  TO authenticated USING (TRUE);

CREATE POLICY "Service roles can select users" ON "public"."users" AS permissive FOR
SELECT
  TO service_role USING (TRUE);

CREATE POLICY "Users can view their own records" ON "public"."users" AS permissive FOR
SELECT
  TO authenticated USING ((id = auth.uid ()));
