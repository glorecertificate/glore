DROP TRIGGER if EXISTS "create_username" ON "public"."users";

DROP POLICY "Service roles can create users" ON "public"."users";

DROP POLICY "Anyone can read public users" ON "public"."users";

ALTER TABLE "public"."courses"
DROP COLUMN "archived";

ALTER TABLE "public"."courses"
ADD COLUMN "archived_at" TIMESTAMP WITH TIME ZONE;

ALTER TABLE "public"."organizations"
ALTER COLUMN "rating"
SET DATA TYPE REAL USING "rating"::REAL;

ALTER TABLE "public"."users"
ALTER COLUMN "is_admin"
DROP NOT NULL;

ALTER TABLE "public"."users"
ALTER COLUMN "is_editor"
DROP NOT NULL;

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
    last_name
  )
  values (
    new.id,
    new.email,
    new.phone,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  return new;
end;
$function$;

CREATE POLICY "Admins, service roles, and users with is_admin can delete membe" ON "public"."memberships" AS permissive FOR delete TO authenticated USING (
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

CREATE POLICY "Admins, service roles, and users with is_admin can insert membe" ON "public"."memberships" AS permissive FOR insert TO authenticated
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

CREATE POLICY "Admins, service roles, and users with is_admin can select membe" ON "public"."memberships" AS permissive FOR
SELECT
  TO authenticated USING (
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

CREATE POLICY "Admins, service roles, and users with is_admin can update membe" ON "public"."memberships" AS permissive
FOR UPDATE
  TO authenticated
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

CREATE POLICY "Users can see their own memberships" ON "public"."memberships" AS permissive FOR
SELECT
  TO authenticated USING ((user_id = auth.uid ()));

CREATE POLICY "Anyone can read public users" ON "public"."users" AS permissive FOR
SELECT
  TO anon USING (TRUE);

CREATE TRIGGER create_username before insert ON public.users FOR each ROW
EXECUTE function set_username ();

DROP TRIGGER if EXISTS "after_auth_user_update" ON "auth"."users";

CREATE TRIGGER after_user_update
AFTER
UPDATE ON auth.users FOR each ROW
EXECUTE function update_public_user ();
