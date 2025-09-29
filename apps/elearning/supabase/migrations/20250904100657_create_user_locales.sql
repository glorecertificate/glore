CREATE TABLE "public"."user_locales" (
  "email" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "locale" language NOT NULL DEFAULT 'en'::language
);

ALTER TABLE "public"."user_locales" enable ROW level security;

CREATE UNIQUE INDEX user_locales_email_key ON public.user_locales USING btree (email);

CREATE UNIQUE INDEX user_locales_pkey ON public.user_locales USING btree (email);

ALTER TABLE "public"."user_locales"
ADD CONSTRAINT "user_locales_pkey" PRIMARY KEY USING index "user_locales_pkey";

ALTER TABLE "public"."user_locales"
ADD CONSTRAINT "user_locales_email_key" UNIQUE USING index "user_locales_email_key";

GRANT delete ON TABLE "public"."user_locales" TO "anon";

GRANT insert ON TABLE "public"."user_locales" TO "anon";

GRANT REFERENCES ON TABLE "public"."user_locales" TO "anon";

GRANT
SELECT
  ON TABLE "public"."user_locales" TO "anon";

GRANT trigger ON TABLE "public"."user_locales" TO "anon";

GRANT
TRUNCATE ON TABLE "public"."user_locales" TO "anon";

GRANT
UPDATE ON TABLE "public"."user_locales" TO "anon";

GRANT delete ON TABLE "public"."user_locales" TO "authenticated";

GRANT insert ON TABLE "public"."user_locales" TO "authenticated";

GRANT REFERENCES ON TABLE "public"."user_locales" TO "authenticated";

GRANT
SELECT
  ON TABLE "public"."user_locales" TO "authenticated";

GRANT trigger ON TABLE "public"."user_locales" TO "authenticated";

GRANT
TRUNCATE ON TABLE "public"."user_locales" TO "authenticated";

GRANT
UPDATE ON TABLE "public"."user_locales" TO "authenticated";

GRANT delete ON TABLE "public"."user_locales" TO "service_role";

GRANT insert ON TABLE "public"."user_locales" TO "service_role";

GRANT REFERENCES ON TABLE "public"."user_locales" TO "service_role";

GRANT
SELECT
  ON TABLE "public"."user_locales" TO "service_role";

GRANT trigger ON TABLE "public"."user_locales" TO "service_role";

GRANT
TRUNCATE ON TABLE "public"."user_locales" TO "service_role";

GRANT
UPDATE ON TABLE "public"."user_locales" TO "service_role";

GRANT delete ON TABLE "public"."users" TO "supabase_auth_admin";

GRANT insert ON TABLE "public"."users" TO "supabase_auth_admin";

GRANT REFERENCES ON TABLE "public"."users" TO "supabase_auth_admin";

GRANT
SELECT
  ON TABLE "public"."users" TO "supabase_auth_admin";

GRANT trigger ON TABLE "public"."users" TO "supabase_auth_admin";

GRANT
TRUNCATE ON TABLE "public"."users" TO "supabase_auth_admin";

GRANT
UPDATE ON TABLE "public"."users" TO "supabase_auth_admin";

CREATE POLICY "Allow any user to insert user_locales" ON "public"."user_locales" AS permissive FOR insert TO anon,
authenticated
WITH
  CHECK (TRUE);

CREATE POLICY "Allow any user to read user_locales" ON "public"."user_locales" AS permissive FOR
SELECT
  TO anon,
  authenticated USING (TRUE);

CREATE POLICY "Allow any user to update user_locales" ON "public"."user_locales" AS permissive
FOR UPDATE
  TO anon,
  authenticated USING (TRUE)
WITH
  CHECK (TRUE);
