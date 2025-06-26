SET
  statement_timeout = 0;

SET
  lock_timeout = 0;

SET
  idle_in_transaction_session_timeout = 0;

SET
  transaction_timeout = 0;

SET
  client_encoding = 'UTF8';

SET
  standard_conforming_strings = ON;

SELECT
  pg_catalog.set_config ('search_path', '', FALSE);

SET
  check_function_bodies = FALSE;

SET
  xmloption = content;

SET
  client_min_messages = warning;

SET
  row_security = off;

CREATE EXTENSION if NOT EXISTS "pg_cron"
WITH
  schema "pg_catalog";

CREATE EXTENSION if NOT EXISTS "pg_net"
WITH
  schema "extensions";

comment ON schema "public" IS 'standard public schema';

CREATE EXTENSION if NOT EXISTS "moddatetime"
WITH
  schema "extensions";

CREATE EXTENSION if NOT EXISTS "pg_graphql"
WITH
  schema "graphql";

CREATE EXTENSION if NOT EXISTS "pg_stat_statements"
WITH
  schema "extensions";

CREATE EXTENSION if NOT EXISTS "pgcrypto"
WITH
  schema "extensions";

CREATE EXTENSION if NOT EXISTS "supabase_vault"
WITH
  schema "vault";

CREATE EXTENSION if NOT EXISTS "uuid-ossp"
WITH
  schema "extensions";

CREATE TYPE "public"."course_type" AS ENUM('introduction', 'assessment');

ALTER TYPE "public"."course_type" owner TO "postgres";

comment ON type "public"."course_type" IS 'Type of course depending on its content';

CREATE TYPE "public"."lesson_type" AS ENUM('descriptive', 'questions', 'evaluations', 'assessment');

ALTER TYPE "public"."lesson_type" owner TO "postgres";

CREATE TYPE "public"."locale" AS ENUM('es', 'en', 'it');

ALTER TYPE "public"."locale" owner TO "postgres";

comment ON type "public"."locale" IS 'Application locale value';

CREATE TYPE "public"."organization_role" AS ENUM('representative', 'tutor', 'volunteer', 'learner');

ALTER TYPE "public"."organization_role" owner TO "postgres";

comment ON type "public"."organization_role" IS 'Role of an user in the organization';

CREATE TYPE "public"."publication_status" AS ENUM('active', 'inactive', 'draft', 'archived');

ALTER TYPE "public"."publication_status" owner TO "postgres";

comment ON type "public"."publication_status" IS 'Publishing status of a resource';

CREATE TYPE "public"."sex" AS ENUM('female', 'male', 'non-binary', 'unspecified');

ALTER TYPE "public"."sex" owner TO "postgres";

comment ON type "public"."sex" IS 'Sex of an user';

CREATE OR REPLACE FUNCTION "public"."insert_public_user" () returns "trigger" language "plpgsql" security definer AS $$
BEGIN
    -- Ensure raw_user_meta_data is of type json
    IF pg_typeof(NEW.raw_user_meta_data) = 'text'::regtype THEN
        NEW.raw_user_meta_data := NEW.raw_user_meta_data::json;
    END IF;

    -- Insert into public.users
    INSERT INTO public.users (id, email, phone, first_name, last_name, is_admin, is_editor)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.phone,
        (NEW.raw_user_meta_data::json ->> 'first_name'),
        (NEW.raw_user_meta_data::json ->> 'last_name'),
        COALESCE((NEW.raw_user_meta_data::json ->> 'is_admin')::boolean, FALSE),
        COALESCE((NEW.raw_user_meta_data::json ->> 'is_editor')::boolean, FALSE)
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error instead of raising an exception
        RAISE NOTICE 'Error inserting into public.users: %', SQLERRM;
        RETURN NULL; -- Optionally return NULL to indicate failure
END;
$$;

ALTER FUNCTION "public"."insert_public_user" () owner TO "postgres";

CREATE OR REPLACE FUNCTION "public"."set_skill_id" () returns "trigger" language "plpgsql" AS $$begin
    -- Retrieve the skill_id from the associated assessment
    select skill_id into new.skill_id
    from public.assessments
    where id = new.assessment_id;
    return new;
end;$$;

ALTER FUNCTION "public"."set_skill_id" () owner TO "postgres";

CREATE OR REPLACE FUNCTION "public"."set_username" () returns "trigger" language "plpgsql" AS $$
BEGIN
    NEW.username := regexp_replace(lower(regexp_replace(NEW.first_name, ' ', '.', 'g') || '.' || regexp_replace(NEW.last_name, ' ', '.', 'g')), '[^a-z0-9.]+', '', 'g');
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."set_username" () owner TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_public_user" () returns "trigger" language "plpgsql" AS $$
BEGIN
    -- Update the email and phone only if they have changed
    IF NEW.email IS DISTINCT FROM OLD.email THEN
        UPDATE public.users
        SET email = NEW.email
        WHERE id = OLD.id;
    END IF;

    IF NEW.phone IS DISTINCT FROM OLD.phone THEN
        UPDATE public.users
        SET phone = NEW.phone
        WHERE id = OLD.id;
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_public_user" () owner TO "postgres";

SET
  default_tablespace = '';

SET
  default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."assessments" (
  "id" BIGINT NOT NULL,
  "lesson_id" BIGINT NOT NULL,
  "skill_id" BIGINT NOT NULL,
  "description" "jsonb",
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "public"."assessments" owner TO "postgres";

comment ON TABLE "public"."assessments" IS 'Self-assessments of a soft skill';

CREATE TABLE IF NOT EXISTS "public"."evaluations" (
  "id" BIGINT NOT NULL,
  "lesson_id" BIGINT NOT NULL,
  "description" "jsonb" NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "public"."evaluations" owner TO "postgres";

comment ON TABLE "public"."evaluations" IS 'Generic evaluations unrelated to a skill';

ALTER TABLE "public"."evaluations"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."assessments_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."certificate_skills" (
  "id" BIGINT NOT NULL,
  "certificate_id" BIGINT NOT NULL,
  "skill_id" BIGINT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "public"."certificate_skills" owner TO "postgres";

comment ON TABLE "public"."certificate_skills" IS 'Relation between a certificate and the related skills';

ALTER TABLE "public"."certificate_skills"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."certificate_skills_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."certificates" (
  "id" BIGINT NOT NULL,
  "user_id" "uuid" NOT NULL,
  "reviewer_id" "uuid",
  "organization_id" BIGINT NOT NULL,
  "language" "public"."locale" NOT NULL,
  "activity_start_date" "date" NOT NULL,
  "activity_end_date" "date" NOT NULL,
  "activity_duration" SMALLINT NOT NULL,
  "activity_location" "text" NOT NULL,
  "activity_description" "text" NOT NULL,
  "organization_rating" SMALLINT NOT NULL,
  "reviewer_comment" "text",
  "document_url" "text",
  "issued_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "handle" "text" NOT NULL
);

ALTER TABLE "public"."certificates" owner TO "postgres";

comment ON TABLE "public"."certificates" IS 'User certificates';

ALTER TABLE "public"."certificates"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."certificates_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."user_answers" (
  "id" BIGINT NOT NULL,
  "user_id" "uuid" NOT NULL,
  "option_id" BIGINT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "public"."user_answers" owner TO "postgres";

comment ON TABLE "public"."user_answers" IS 'User answers to closed questions';

ALTER TABLE "public"."user_answers"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."closed_question_answers_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."question_options" (
  "id" BIGINT NOT NULL,
  "question_id" BIGINT NOT NULL,
  "content" "jsonb" NOT NULL,
  "is_correct" BOOLEAN NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "public"."question_options" owner TO "postgres";

comment ON TABLE "public"."question_options" IS 'Options for a course question';

ALTER TABLE "public"."question_options"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."closed_question_options_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."questions" (
  "id" BIGINT NOT NULL,
  "lesson_id" BIGINT NOT NULL,
  "description" "jsonb" NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "explanation" "jsonb"
);

ALTER TABLE "public"."questions" owner TO "postgres";

comment ON TABLE "public"."questions" IS 'Questions with a single answer';

ALTER TABLE "public"."questions"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."closed_questions_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."contributions" (
  "id" BIGINT NOT NULL,
  "user_id" "uuid" NOT NULL,
  "lesson_id" BIGINT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "public"."contributions" owner TO "postgres";

comment ON TABLE "public"."contributions" IS 'Editor contributions to a course';

ALTER TABLE "public"."contributions"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."contributions_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."courses" (
  "id" BIGINT NOT NULL,
  "creator_id" "uuid" DEFAULT "auth"."uid" (),
  "skill_id" BIGINT,
  "title" "jsonb" NOT NULL,
  "description" "jsonb",
  "image_url" "text",
  "publication_status" "public"."publication_status" NOT NULL,
  "sort_order" SMALLINT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "type" "public"."course_type" NOT NULL,
  "slug" "text" NOT NULL
);

ALTER TABLE "public"."courses" owner TO "postgres";

comment ON TABLE "public"."courses" IS 'Learning modules';

ALTER TABLE "public"."courses"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."courses_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."lessons" (
  "id" BIGINT NOT NULL,
  "course_id" BIGINT NOT NULL,
  "type" "public"."lesson_type" DEFAULT 'descriptive'::"public"."lesson_type" NOT NULL,
  "title" "jsonb" NOT NULL,
  "content" "jsonb",
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "sort_order" SMALLINT NOT NULL
);

ALTER TABLE "public"."lessons" owner TO "postgres";

comment ON TABLE "public"."lessons" IS 'Steps of a course';

ALTER TABLE "public"."lessons"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."lessons_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."memberships" (
  "id" BIGINT NOT NULL,
  "user_id" "uuid" NOT NULL,
  "organization_id" BIGINT NOT NULL,
  "role" "public"."organization_role" NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "public"."memberships" owner TO "postgres";

comment ON TABLE "public"."memberships" IS 'User organizations';

ALTER TABLE "public"."memberships"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."memberships_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."organization_regions" (
  "id" BIGINT NOT NULL,
  "region_id" BIGINT NOT NULL,
  "organization_id" BIGINT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "public"."organization_regions" owner TO "postgres";

comment ON TABLE "public"."organization_regions" IS 'Organizations per region';

ALTER TABLE "public"."organization_regions"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."organization_regions_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."organizations" (
  "id" BIGINT NOT NULL,
  "handle" "text" NOT NULL,
  "name" "text" NOT NULL,
  "email" "text" NOT NULL,
  "description" "jsonb",
  "website" "text",
  "phone" "text",
  "country" "text",
  "region" "text",
  "postcode" "text",
  "city" "text",
  "address" "text",
  "avatar_url" "text",
  "rating" SMALLINT,
  "approved_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  CONSTRAINT "valid_url" CHECK (
    (
      "website" ~* '^(https?://)?(www\\.)?([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,6}(/.*)?$'::"text"
    )
  )
);

ALTER TABLE "public"."organizations" owner TO "postgres";

comment ON TABLE "public"."organizations" IS 'Volunteering organizations';

ALTER TABLE "public"."organizations"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."organizations_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."regions" (
  "id" BIGINT NOT NULL,
  "name" "jsonb" NOT NULL,
  "coordinator_id" "uuid",
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "public"."regions" owner TO "postgres";

comment ON TABLE "public"."regions" IS 'Groups of organizations';

ALTER TABLE "public"."regions"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."regions_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."user_assessments" (
  "id" BIGINT NOT NULL,
  "user_id" "uuid" NOT NULL,
  "skill_id" BIGINT,
  "assessment_id" BIGINT,
  "value" SMALLINT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "public"."user_assessments" owner TO "postgres";

comment ON TABLE "public"."user_assessments" IS 'Self-assessments of a skill';

ALTER TABLE "public"."user_assessments"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."self_ skill_assessments_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."user_evaluations" (
  "id" BIGINT NOT NULL,
  "user_id" "uuid" NOT NULL,
  "evaluation_id" BIGINT NOT NULL,
  "value" SMALLINT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "public"."user_evaluations" owner TO "postgres";

comment ON TABLE "public"."user_evaluations" IS 'User evaluations unrelated to a skill';

ALTER TABLE "public"."user_evaluations"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."self_assessments_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."skill_areas" (
  "id" BIGINT NOT NULL,
  "name" "jsonb" NOT NULL,
  "description" "jsonb",
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "public"."skill_areas" owner TO "postgres";

comment ON TABLE "public"."skill_areas" IS 'Areas grouping soft skills';

ALTER TABLE "public"."skill_areas"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."skill_areas_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

ALTER TABLE "public"."assessments"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."skill_assessments_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."skills" (
  "id" BIGINT NOT NULL,
  "skill_area_id" BIGINT,
  "name" "jsonb" NOT NULL,
  "description" "jsonb",
  "icon_url" "text",
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "public"."skills" owner TO "postgres";

comment ON TABLE "public"."skills" IS 'Soft skills';

ALTER TABLE "public"."skills"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."skills_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."user_courses" (
  "id" BIGINT NOT NULL,
  "user_id" "uuid" NOT NULL,
  "course_id" BIGINT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "public"."user_courses" owner TO "postgres";

comment ON TABLE "public"."user_courses" IS 'Subscriptions to a course';

ALTER TABLE "public"."user_courses"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."user_courses_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."user_lessons" (
  "id" BIGINT NOT NULL,
  "user_id" "uuid" NOT NULL,
  "lesson_id" BIGINT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE
);

ALTER TABLE "public"."user_lessons" owner TO "postgres";

comment ON TABLE "public"."user_lessons" IS 'Completed lessons in a course';

ALTER TABLE "public"."user_lessons"
ALTER COLUMN "id"
ADD GENERATED BY DEFAULT AS IDENTITY (
  sequence name "public"."user_lessons_id_seq" start
  WITH
    1 increment by 1 no minvalue no maxvalue cache 1
);

CREATE TABLE IF NOT EXISTS "public"."users" (
  "id" "uuid" NOT NULL,
  "username" "text",
  "first_name" "text",
  "last_name" "text",
  "birthday" "date",
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT "now" () NOT NULL,
  "deleted_at" TIMESTAMP WITH TIME ZONE,
  "sex" "public"."sex",
  "pronouns" "text",
  "nationality" "text",
  "country" "text",
  "city" "text",
  "avatar_url" "text",
  "bio" "jsonb",
  "is_admin" BOOLEAN DEFAULT FALSE NOT NULL,
  "is_editor" BOOLEAN DEFAULT FALSE NOT NULL,
  "email" "text" NOT NULL,
  "phone" "text"
);

ALTER TABLE "public"."users" owner TO "postgres";

comment ON TABLE "public"."users" IS 'User profiles';

ALTER TABLE ONLY "public"."evaluations"
ADD CONSTRAINT "assessments_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."evaluations"
ADD CONSTRAINT "assessments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."certificate_skills"
ADD CONSTRAINT "certificate_skills_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."certificate_skills"
ADD CONSTRAINT "certificate_skills_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."certificates"
ADD CONSTRAINT "certificates_handle_key" UNIQUE ("handle");

ALTER TABLE ONLY "public"."certificates"
ADD CONSTRAINT "certificates_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."certificates"
ADD CONSTRAINT "certificates_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_answers"
ADD CONSTRAINT "closed_question_answers_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."user_answers"
ADD CONSTRAINT "closed_question_answers_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."question_options"
ADD CONSTRAINT "closed_question_options_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."question_options"
ADD CONSTRAINT "closed_question_options_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."questions"
ADD CONSTRAINT "closed_questions_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."questions"
ADD CONSTRAINT "closed_questions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."contributions"
ADD CONSTRAINT "contributions_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."contributions"
ADD CONSTRAINT "contributions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."courses"
ADD CONSTRAINT "courses_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."courses"
ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."courses"
ADD CONSTRAINT "courses_slug_key" UNIQUE ("slug");

ALTER TABLE ONLY "public"."courses"
ADD CONSTRAINT "courses_sort_order_key" UNIQUE ("sort_order");

ALTER TABLE ONLY "public"."courses"
ADD CONSTRAINT "courses_title_key" UNIQUE ("title");

ALTER TABLE ONLY "public"."lessons"
ADD CONSTRAINT "lessons_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."lessons"
ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."memberships"
ADD CONSTRAINT "memberships_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."organization_regions"
ADD CONSTRAINT "organization_regions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."organizations"
ADD CONSTRAINT "organizations_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."organizations"
ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."organizations"
ADD CONSTRAINT "organizations_slug_key" UNIQUE ("handle");

ALTER TABLE ONLY "public"."regions"
ADD CONSTRAINT "regions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_assessments"
ADD CONSTRAINT "self_ skill_assessments_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."user_assessments"
ADD CONSTRAINT "self_ skill_assessments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_evaluations"
ADD CONSTRAINT "self_assessments_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."user_evaluations"
ADD CONSTRAINT "self_assessments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."skill_areas"
ADD CONSTRAINT "skill_areas_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."skill_areas"
ADD CONSTRAINT "skill_areas_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."skill_areas"
ADD CONSTRAINT "skill_areas_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."assessments"
ADD CONSTRAINT "skill_assessments_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."assessments"
ADD CONSTRAINT "skill_assessments_lesson_id_key" UNIQUE ("lesson_id");

ALTER TABLE ONLY "public"."assessments"
ADD CONSTRAINT "skill_assessments_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."assessments"
ADD CONSTRAINT "skill_assessments_skill_id_key" UNIQUE ("skill_id");

ALTER TABLE ONLY "public"."skills"
ADD CONSTRAINT "skills_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."skills"
ADD CONSTRAINT "skills_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."skills"
ADD CONSTRAINT "skills_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_courses"
ADD CONSTRAINT "user_courses_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."user_lessons"
ADD CONSTRAINT "user_lessons_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."users"
ADD CONSTRAINT "users_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."users"
ADD CONSTRAINT "users_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."users"
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."users"
ADD CONSTRAINT "users_username_key" UNIQUE ("username");

CREATE OR REPLACE TRIGGER "before_insert_user_assessment" before insert ON "public"."user_assessments" FOR each ROW
EXECUTE function "public"."set_skill_id" ();

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."assessments" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."certificates" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."contributions" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."courses" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."evaluations" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."lessons" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."memberships" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."organization_regions" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."organizations" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."question_options" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."questions" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."regions" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."skill_areas" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."skills" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."user_answers" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."user_assessments" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."user_courses" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."user_evaluations" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."user_lessons" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "set_updated_at" before
UPDATE ON "public"."users" FOR each ROW
EXECUTE function "extensions"."moddatetime" ('updated_at');

CREATE OR REPLACE TRIGGER "update_username" before
UPDATE ON "public"."users" FOR each ROW
EXECUTE function "public"."set_username" ();

ALTER TABLE ONLY "public"."assessments"
ADD CONSTRAINT "assessments_lesson_id_fkey" FOREIGN key ("lesson_id") REFERENCES "public"."lessons" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."assessments"
ADD CONSTRAINT "assessments_skill_id_fkey" FOREIGN key ("skill_id") REFERENCES "public"."skills" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."certificate_skills"
ADD CONSTRAINT "certificate_skills_certificate_id_fkey" FOREIGN key ("certificate_id") REFERENCES "public"."certificates" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."certificate_skills"
ADD CONSTRAINT "certificate_skills_skill_id_fkey" FOREIGN key ("skill_id") REFERENCES "public"."skills" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."certificates"
ADD CONSTRAINT "certificates_organization_id_fkey" FOREIGN key ("organization_id") REFERENCES "public"."organizations" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."certificates"
ADD CONSTRAINT "certificates_reviewer_id_fkey" FOREIGN key ("reviewer_id") REFERENCES "public"."users" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."certificates"
ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN key ("user_id") REFERENCES "public"."users" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."contributions"
ADD CONSTRAINT "contributions_lesson_id_fkey" FOREIGN key ("lesson_id") REFERENCES "public"."lessons" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."contributions"
ADD CONSTRAINT "contributions_user_id_fkey" FOREIGN key ("user_id") REFERENCES "public"."users" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."courses"
ADD CONSTRAINT "courses_creator_id_fkey1" FOREIGN key ("creator_id") REFERENCES "public"."users" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."courses"
ADD CONSTRAINT "courses_skill_id_fkey" FOREIGN key ("skill_id") REFERENCES "public"."skills" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."evaluations"
ADD CONSTRAINT "evaluations_lesson_id_fkey" FOREIGN key ("lesson_id") REFERENCES "public"."lessons" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."lessons"
ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN key ("course_id") REFERENCES "public"."courses" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."memberships"
ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN key ("organization_id") REFERENCES "public"."organizations" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."memberships"
ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN key ("user_id") REFERENCES "public"."users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."organization_regions"
ADD CONSTRAINT "organization_regions_organization_id_fkey" FOREIGN key ("organization_id") REFERENCES "public"."organizations" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."organization_regions"
ADD CONSTRAINT "organization_regions_region_id_fkey" FOREIGN key ("region_id") REFERENCES "public"."regions" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."question_options"
ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN key ("question_id") REFERENCES "public"."questions" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."questions"
ADD CONSTRAINT "questions_lesson_id_fkey" FOREIGN key ("lesson_id") REFERENCES "public"."lessons" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."regions"
ADD CONSTRAINT "regions_coordinator_id_fkey" FOREIGN key ("coordinator_id") REFERENCES "public"."users" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."skills"
ADD CONSTRAINT "skills_skill_area_id_fkey" FOREIGN key ("skill_area_id") REFERENCES "public"."skill_areas" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."user_answers"
ADD CONSTRAINT "user_answers_option_id_fkey" FOREIGN key ("option_id") REFERENCES "public"."question_options" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_answers"
ADD CONSTRAINT "user_answers_user_id_fkey" FOREIGN key ("user_id") REFERENCES "public"."users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_assessments"
ADD CONSTRAINT "user_assessments_assessment_id_fkey" FOREIGN key ("assessment_id") REFERENCES "public"."assessments" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."user_assessments"
ADD CONSTRAINT "user_assessments_skill_id_fkey" FOREIGN key ("skill_id") REFERENCES "public"."skills" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."user_assessments"
ADD CONSTRAINT "user_assessments_user_id_fkey" FOREIGN key ("user_id") REFERENCES "public"."users" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."user_courses"
ADD CONSTRAINT "user_courses_course_id_fkey" FOREIGN key ("course_id") REFERENCES "public"."courses" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_courses"
ADD CONSTRAINT "user_courses_user_id_fkey" FOREIGN key ("user_id") REFERENCES "public"."users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_evaluations"
ADD CONSTRAINT "user_evaluations_evaluation_id_fkey" FOREIGN key ("evaluation_id") REFERENCES "public"."evaluations" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."user_evaluations"
ADD CONSTRAINT "user_evaluations_user_id_fkey" FOREIGN key ("user_id") REFERENCES "public"."users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_lessons"
ADD CONSTRAINT "user_lessons_lesson_id_fkey" FOREIGN key ("lesson_id") REFERENCES "public"."lessons" ("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."user_lessons"
ADD CONSTRAINT "user_lessons_user_id_fkey" FOREIGN key ("user_id") REFERENCES "public"."users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."users"
ADD CONSTRAINT "users_id_fkey" FOREIGN key ("id") REFERENCES "auth"."users" ("id") ON UPDATE CASCADE ON DELETE CASCADE;

CREATE POLICY "Anyone can read public users" ON "public"."users" FOR
SELECT
  TO "authenticated",
  "anon",
  "service_role" USING (TRUE);

CREATE POLICY "Service roles can create users" ON "public"."users" FOR insert TO "service_role"
WITH
  CHECK (TRUE);

CREATE POLICY "Service roles can delete users" ON "public"."users" FOR delete TO "service_role" USING (TRUE);

CREATE POLICY "Service roles can insert users" ON "public"."users" FOR insert TO "service_role"
WITH
  CHECK (TRUE);

CREATE POLICY "Service roles can update users" ON "public"."users"
FOR UPDATE
  TO "service_role" USING (TRUE)
WITH
  CHECK (TRUE);

CREATE POLICY "Users can create their own lessons" ON "public"."user_lessons" FOR insert TO "authenticated"
WITH
  CHECK (("auth"."uid" () = "user_id"));

CREATE POLICY "Users can delete their own lessons or by admin, rep" ON "public"."user_lessons" FOR delete TO "authenticated" USING (
  (
    ("auth"."uid" () = "user_id") OR
    (
      SELECT
        "users"."is_admin"
      FROM
        "public"."users"
      WHERE
        ("users"."id" = "auth"."uid" ())
    ) OR
    (
      "user_id" IN (
        SELECT
          "memberships"."user_id"
        FROM
          "public"."memberships"
        WHERE
          (
            "memberships"."organization_id" IN (
              SELECT
                "memberships_1"."organization_id"
              FROM
                "public"."memberships" "memberships_1"
              WHERE
                (
                  ("memberships_1"."user_id" = "auth"."uid" ()) AND
                  ("memberships_1"."role" = 'representative'::"public"."organization_role")
                )
            )
          )
      )
    )
  )
);

CREATE POLICY "Users can update their own lessons or by admin, rep, or tutor" ON "public"."user_lessons"
FOR UPDATE
  TO "authenticated" USING (
    (
      ("auth"."uid" () = "user_id") OR
      (
        SELECT
          "users"."is_admin"
        FROM
          "public"."users"
        WHERE
          ("users"."id" = "auth"."uid" ())
      ) OR
      (
        "user_id" IN (
          SELECT
            "memberships"."user_id"
          FROM
            "public"."memberships"
          WHERE
            (
              "memberships"."organization_id" IN (
                SELECT
                  "memberships_1"."organization_id"
                FROM
                  "public"."memberships" "memberships_1"
                WHERE
                  (
                    ("memberships_1"."user_id" = "auth"."uid" ()) AND
                    (
                      "memberships_1"."role" = ANY (
                        ARRAY[
                          'representative'::"public"."organization_role",
                          'tutor'::"public"."organization_role"
                        ]
                      )
                    )
                  )
              )
            )
        )
      )
    )
  )
WITH
  CHECK (("auth"."uid" () = "user_id"));

CREATE POLICY "Users can view their own lessons or by admin, rep, or tutor" ON "public"."user_lessons" FOR
SELECT
  TO "authenticated" USING (
    (
      ("auth"."uid" () = "user_id") OR
      (
        SELECT
          "users"."is_admin"
        FROM
          "public"."users"
        WHERE
          ("users"."id" = "auth"."uid" ())
      ) OR
      (
        "user_id" IN (
          SELECT
            "memberships"."user_id"
          FROM
            "public"."memberships"
          WHERE
            (
              "memberships"."organization_id" IN (
                SELECT
                  "memberships_1"."organization_id"
                FROM
                  "public"."memberships" "memberships_1"
                WHERE
                  (
                    ("memberships_1"."user_id" = "auth"."uid" ()) AND
                    (
                      "memberships_1"."role" = ANY (
                        ARRAY[
                          'representative'::"public"."organization_role",
                          'tutor'::"public"."organization_role"
                        ]
                      )
                    )
                  )
              )
            )
        )
      )
    )
  );

CREATE POLICY "Users, admins and representative can update a public record" ON "public"."users"
FOR UPDATE
  TO "authenticated" USING (
    (
      ("auth"."uid" () = "id") OR
      (
        SELECT
          "users_1"."is_admin"
        FROM
          "public"."users" "users_1"
        WHERE
          ("users_1"."id" = "auth"."uid" ())
      ) OR
      (
        "id" IN (
          SELECT
            "memberships"."user_id"
          FROM
            "public"."memberships"
          WHERE
            (
              "memberships"."organization_id" IN (
                SELECT
                  "memberships_1"."organization_id"
                FROM
                  "public"."memberships" "memberships_1"
                WHERE
                  (
                    ("memberships_1"."user_id" = "auth"."uid" ()) AND
                    (
                      "memberships_1"."role" = ANY (
                        ARRAY[
                          'representative'::"public"."organization_role",
                          'tutor'::"public"."organization_role"
                        ]
                      )
                    )
                  )
              )
            )
        )
      )
    )
  )
WITH
  CHECK (("auth"."uid" () = "id"));

ALTER TABLE "public"."assessments" enable ROW level security;

ALTER TABLE "public"."certificate_skills" enable ROW level security;

ALTER TABLE "public"."certificates" enable ROW level security;

ALTER TABLE "public"."contributions" enable ROW level security;

ALTER TABLE "public"."courses" enable ROW level security;

ALTER TABLE "public"."evaluations" enable ROW level security;

ALTER TABLE "public"."lessons" enable ROW level security;

ALTER TABLE "public"."memberships" enable ROW level security;

ALTER TABLE "public"."organization_regions" enable ROW level security;

ALTER TABLE "public"."organizations" enable ROW level security;

ALTER TABLE "public"."question_options" enable ROW level security;

ALTER TABLE "public"."questions" enable ROW level security;

ALTER TABLE "public"."regions" enable ROW level security;

ALTER TABLE "public"."skill_areas" enable ROW level security;

ALTER TABLE "public"."skills" enable ROW level security;

ALTER TABLE "public"."user_answers" enable ROW level security;

ALTER TABLE "public"."user_assessments" enable ROW level security;

ALTER TABLE "public"."user_courses" enable ROW level security;

ALTER TABLE "public"."user_evaluations" enable ROW level security;

ALTER TABLE "public"."user_lessons" enable ROW level security;

ALTER TABLE "public"."users" enable ROW level security;

ALTER PUBLICATION "supabase_realtime" owner TO "postgres";

GRANT usage ON schema "public" TO "postgres";

GRANT usage ON schema "public" TO "anon";

GRANT usage ON schema "public" TO "authenticated";

GRANT usage ON schema "public" TO "service_role";

GRANT ALL ON function "public"."insert_public_user" () TO "anon";

GRANT ALL ON function "public"."insert_public_user" () TO "authenticated";

GRANT ALL ON function "public"."insert_public_user" () TO "service_role";

GRANT ALL ON function "public"."set_skill_id" () TO "anon";

GRANT ALL ON function "public"."set_skill_id" () TO "authenticated";

GRANT ALL ON function "public"."set_skill_id" () TO "service_role";

GRANT ALL ON function "public"."set_username" () TO "anon";

GRANT ALL ON function "public"."set_username" () TO "authenticated";

GRANT ALL ON function "public"."set_username" () TO "service_role";

GRANT ALL ON function "public"."update_public_user" () TO "anon";

GRANT ALL ON function "public"."update_public_user" () TO "authenticated";

GRANT ALL ON function "public"."update_public_user" () TO "service_role";

GRANT ALL ON TABLE "public"."assessments" TO "anon";

GRANT ALL ON TABLE "public"."assessments" TO "authenticated";

GRANT ALL ON TABLE "public"."assessments" TO "service_role";

GRANT ALL ON TABLE "public"."evaluations" TO "anon";

GRANT ALL ON TABLE "public"."evaluations" TO "authenticated";

GRANT ALL ON TABLE "public"."evaluations" TO "service_role";

GRANT ALL ON sequence "public"."assessments_id_seq" TO "anon";

GRANT ALL ON sequence "public"."assessments_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."assessments_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."certificate_skills" TO "anon";

GRANT ALL ON TABLE "public"."certificate_skills" TO "authenticated";

GRANT ALL ON TABLE "public"."certificate_skills" TO "service_role";

GRANT ALL ON sequence "public"."certificate_skills_id_seq" TO "anon";

GRANT ALL ON sequence "public"."certificate_skills_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."certificate_skills_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."certificates" TO "anon";

GRANT ALL ON TABLE "public"."certificates" TO "authenticated";

GRANT ALL ON TABLE "public"."certificates" TO "service_role";

GRANT ALL ON sequence "public"."certificates_id_seq" TO "anon";

GRANT ALL ON sequence "public"."certificates_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."certificates_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."user_answers" TO "anon";

GRANT ALL ON TABLE "public"."user_answers" TO "authenticated";

GRANT ALL ON TABLE "public"."user_answers" TO "service_role";

GRANT ALL ON sequence "public"."closed_question_answers_id_seq" TO "anon";

GRANT ALL ON sequence "public"."closed_question_answers_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."closed_question_answers_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."question_options" TO "anon";

GRANT ALL ON TABLE "public"."question_options" TO "authenticated";

GRANT ALL ON TABLE "public"."question_options" TO "service_role";

GRANT ALL ON sequence "public"."closed_question_options_id_seq" TO "anon";

GRANT ALL ON sequence "public"."closed_question_options_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."closed_question_options_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."questions" TO "anon";

GRANT ALL ON TABLE "public"."questions" TO "authenticated";

GRANT ALL ON TABLE "public"."questions" TO "service_role";

GRANT ALL ON sequence "public"."closed_questions_id_seq" TO "anon";

GRANT ALL ON sequence "public"."closed_questions_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."closed_questions_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."contributions" TO "anon";

GRANT ALL ON TABLE "public"."contributions" TO "authenticated";

GRANT ALL ON TABLE "public"."contributions" TO "service_role";

GRANT ALL ON sequence "public"."contributions_id_seq" TO "anon";

GRANT ALL ON sequence "public"."contributions_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."contributions_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."courses" TO "anon";

GRANT ALL ON TABLE "public"."courses" TO "authenticated";

GRANT ALL ON TABLE "public"."courses" TO "service_role";

GRANT ALL ON sequence "public"."courses_id_seq" TO "anon";

GRANT ALL ON sequence "public"."courses_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."courses_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."lessons" TO "anon";

GRANT ALL ON TABLE "public"."lessons" TO "authenticated";

GRANT ALL ON TABLE "public"."lessons" TO "service_role";

GRANT ALL ON sequence "public"."lessons_id_seq" TO "anon";

GRANT ALL ON sequence "public"."lessons_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."lessons_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."memberships" TO "anon";

GRANT ALL ON TABLE "public"."memberships" TO "authenticated";

GRANT ALL ON TABLE "public"."memberships" TO "service_role";

GRANT ALL ON sequence "public"."memberships_id_seq" TO "anon";

GRANT ALL ON sequence "public"."memberships_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."memberships_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."organization_regions" TO "anon";

GRANT ALL ON TABLE "public"."organization_regions" TO "authenticated";

GRANT ALL ON TABLE "public"."organization_regions" TO "service_role";

GRANT ALL ON sequence "public"."organization_regions_id_seq" TO "anon";

GRANT ALL ON sequence "public"."organization_regions_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."organization_regions_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."organizations" TO "anon";

GRANT ALL ON TABLE "public"."organizations" TO "authenticated";

GRANT ALL ON TABLE "public"."organizations" TO "service_role";

GRANT ALL ON sequence "public"."organizations_id_seq" TO "anon";

GRANT ALL ON sequence "public"."organizations_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."organizations_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."regions" TO "anon";

GRANT ALL ON TABLE "public"."regions" TO "authenticated";

GRANT ALL ON TABLE "public"."regions" TO "service_role";

GRANT ALL ON sequence "public"."regions_id_seq" TO "anon";

GRANT ALL ON sequence "public"."regions_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."regions_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."user_assessments" TO "anon";

GRANT ALL ON TABLE "public"."user_assessments" TO "authenticated";

GRANT ALL ON TABLE "public"."user_assessments" TO "service_role";

GRANT ALL ON sequence "public"."self_ skill_assessments_id_seq" TO "anon";

GRANT ALL ON sequence "public"."self_ skill_assessments_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."self_ skill_assessments_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."user_evaluations" TO "anon";

GRANT ALL ON TABLE "public"."user_evaluations" TO "authenticated";

GRANT ALL ON TABLE "public"."user_evaluations" TO "service_role";

GRANT ALL ON sequence "public"."self_assessments_id_seq" TO "anon";

GRANT ALL ON sequence "public"."self_assessments_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."self_assessments_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."skill_areas" TO "anon";

GRANT ALL ON TABLE "public"."skill_areas" TO "authenticated";

GRANT ALL ON TABLE "public"."skill_areas" TO "service_role";

GRANT ALL ON sequence "public"."skill_areas_id_seq" TO "anon";

GRANT ALL ON sequence "public"."skill_areas_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."skill_areas_id_seq" TO "service_role";

GRANT ALL ON sequence "public"."skill_assessments_id_seq" TO "anon";

GRANT ALL ON sequence "public"."skill_assessments_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."skill_assessments_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."skills" TO "anon";

GRANT ALL ON TABLE "public"."skills" TO "authenticated";

GRANT ALL ON TABLE "public"."skills" TO "service_role";

GRANT ALL ON sequence "public"."skills_id_seq" TO "anon";

GRANT ALL ON sequence "public"."skills_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."skills_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."user_courses" TO "anon";

GRANT ALL ON TABLE "public"."user_courses" TO "authenticated";

GRANT ALL ON TABLE "public"."user_courses" TO "service_role";

GRANT ALL ON sequence "public"."user_courses_id_seq" TO "anon";

GRANT ALL ON sequence "public"."user_courses_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."user_courses_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."user_lessons" TO "anon";

GRANT ALL ON TABLE "public"."user_lessons" TO "authenticated";

GRANT ALL ON TABLE "public"."user_lessons" TO "service_role";

GRANT ALL ON sequence "public"."user_lessons_id_seq" TO "anon";

GRANT ALL ON sequence "public"."user_lessons_id_seq" TO "authenticated";

GRANT ALL ON sequence "public"."user_lessons_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."users" TO "anon";

GRANT ALL ON TABLE "public"."users" TO "authenticated";

GRANT ALL ON TABLE "public"."users" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR role "postgres" IN schema "public"
GRANT ALL ON sequences TO "postgres";

ALTER DEFAULT PRIVILEGES FOR role "postgres" IN schema "public"
GRANT ALL ON sequences TO "anon";

ALTER DEFAULT PRIVILEGES FOR role "postgres" IN schema "public"
GRANT ALL ON sequences TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR role "postgres" IN schema "public"
GRANT ALL ON sequences TO "service_role";

ALTER DEFAULT PRIVILEGES FOR role "postgres" IN schema "public"
GRANT ALL ON functions TO "postgres";

ALTER DEFAULT PRIVILEGES FOR role "postgres" IN schema "public"
GRANT ALL ON functions TO "anon";

ALTER DEFAULT PRIVILEGES FOR role "postgres" IN schema "public"
GRANT ALL ON functions TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR role "postgres" IN schema "public"
GRANT ALL ON functions TO "service_role";

ALTER DEFAULT PRIVILEGES FOR role "postgres" IN schema "public"
GRANT ALL ON tables TO "postgres";

ALTER DEFAULT PRIVILEGES FOR role "postgres" IN schema "public"
GRANT ALL ON tables TO "anon";

ALTER DEFAULT PRIVILEGES FOR role "postgres" IN schema "public"
GRANT ALL ON tables TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR role "postgres" IN schema "public"
GRANT ALL ON tables TO "service_role";

RESET ALL;

--
-- Dumped schema changes for auth and storage
--
CREATE OR REPLACE TRIGGER "after_auth_user_update"
AFTER
UPDATE ON "auth"."users" FOR each ROW
EXECUTE function "public"."update_public_user" ();

CREATE OR REPLACE TRIGGER "after_user_insert"
AFTER insert ON "auth"."users" FOR each ROW
EXECUTE function "public"."insert_public_user" ();
