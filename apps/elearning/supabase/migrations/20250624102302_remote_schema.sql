

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."course_duration" AS ENUM (
    'short',
    'medium',
    'long'
);


ALTER TYPE "public"."course_duration" OWNER TO "postgres";


COMMENT ON TYPE "public"."course_duration" IS 'Duration of a course';



CREATE TYPE "public"."course_type" AS ENUM (
    'introduction',
    'assessment'
);


ALTER TYPE "public"."course_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."course_type" IS 'Type of course depending on its content';



CREATE TYPE "public"."lesson_type" AS ENUM (
    'descriptive',
    'questions',
    'evaluations',
    'assessment'
);


ALTER TYPE "public"."lesson_type" OWNER TO "postgres";


CREATE TYPE "public"."locale" AS ENUM (
    'es',
    'en',
    'it'
);


ALTER TYPE "public"."locale" OWNER TO "postgres";


COMMENT ON TYPE "public"."locale" IS 'Application locale value';



CREATE TYPE "public"."organization_role" AS ENUM (
    'representative',
    'tutor',
    'volunteer',
    'learner'
);


ALTER TYPE "public"."organization_role" OWNER TO "postgres";


COMMENT ON TYPE "public"."organization_role" IS 'Role of an user in the organization';



CREATE TYPE "public"."publication_status" AS ENUM (
    'active',
    'inactive',
    'draft',
    'archived'
);


ALTER TYPE "public"."publication_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."publication_status" IS 'Publishing status of a resource';



CREATE TYPE "public"."sex" AS ENUM (
    'female',
    'male',
    'non-binary',
    'unspecified'
);


ALTER TYPE "public"."sex" OWNER TO "postgres";


COMMENT ON TYPE "public"."sex" IS 'Sex of an user';



CREATE OR REPLACE FUNCTION "public"."create_public_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$begin
    -- Insert a new user into the public.users table
    insert into public.users (id, email, phone)
    values (auth.uid(), new.email, new.phone);
    return new;
end;$$;


ALTER FUNCTION "public"."create_public_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_user_into_public"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    INSERT INTO public.users (id, email, phone)
    VALUES (NEW.id, NEW.email, NEW.phone);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."insert_user_into_public"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_skill_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$begin
    -- Retrieve the skill_id from the associated assessment
    select skill_id into new.skill_id
    from public.assessments
    where id = new.assessment_id;
    return new;
end;$$;


ALTER FUNCTION "public"."set_skill_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_username"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.username := regexp_replace(lower(regexp_replace(NEW.first_name, ' ', '.', 'g') || '.' || regexp_replace(NEW.last_name, ' ', '.', 'g')), '[^a-z0-9.]+', '', 'g');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_username"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_public_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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


ALTER FUNCTION "public"."update_public_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."assessments" (
    "id" bigint NOT NULL,
    "lesson_id" bigint NOT NULL,
    "skill_id" bigint NOT NULL,
    "description" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."assessments" OWNER TO "postgres";


COMMENT ON TABLE "public"."assessments" IS 'Self-assessments of a soft skill';



CREATE TABLE IF NOT EXISTS "public"."evaluations" (
    "id" bigint NOT NULL,
    "lesson_id" bigint NOT NULL,
    "description" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."evaluations" OWNER TO "postgres";


COMMENT ON TABLE "public"."evaluations" IS 'Generic evaluations unrelated to a skill';



ALTER TABLE "public"."evaluations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."assessments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."certificate_skills" (
    "id" bigint NOT NULL,
    "certificate_id" bigint NOT NULL,
    "skill_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."certificate_skills" OWNER TO "postgres";


COMMENT ON TABLE "public"."certificate_skills" IS 'Relation between a certificate and the related skills';



ALTER TABLE "public"."certificate_skills" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."certificate_skills_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."certificates" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reviewer_id" "uuid",
    "organization_id" bigint NOT NULL,
    "language" "public"."locale" NOT NULL,
    "activity_start_date" "date" NOT NULL,
    "activity_end_date" "date" NOT NULL,
    "activity_duration" smallint NOT NULL,
    "activity_location" "text" NOT NULL,
    "activity_description" "text" NOT NULL,
    "organization_rating" smallint NOT NULL,
    "reviewer_comment" "text",
    "document_url" "text",
    "issued_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "handle" "text" NOT NULL
);


ALTER TABLE "public"."certificates" OWNER TO "postgres";


COMMENT ON TABLE "public"."certificates" IS 'User certificates';



ALTER TABLE "public"."certificates" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."certificates_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_answers" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "option_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."user_answers" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_answers" IS 'User answers to closed questions';



ALTER TABLE "public"."user_answers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."closed_question_answers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."question_options" (
    "id" bigint NOT NULL,
    "question_id" bigint NOT NULL,
    "content" "jsonb" NOT NULL,
    "is_correct" boolean NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."question_options" OWNER TO "postgres";


COMMENT ON TABLE "public"."question_options" IS 'Options for a course question';



ALTER TABLE "public"."question_options" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."closed_question_options_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" bigint NOT NULL,
    "lesson_id" bigint NOT NULL,
    "description" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "explanation" "jsonb"
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


COMMENT ON TABLE "public"."questions" IS 'Questions with a single answer';



ALTER TABLE "public"."questions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."closed_questions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."contributions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "lesson_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."contributions" OWNER TO "postgres";


COMMENT ON TABLE "public"."contributions" IS 'Editor contributions to a course';



ALTER TABLE "public"."contributions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."contributions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" bigint NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "skill_id" bigint,
    "title" "jsonb" NOT NULL,
    "description" "jsonb",
    "duration" "public"."course_duration" NOT NULL,
    "image_url" "text",
    "publication_status" "public"."publication_status" NOT NULL,
    "sort_order" smallint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "type" "public"."course_type" NOT NULL,
    "slug" "text" NOT NULL,
    "tags" "text"[]
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


COMMENT ON TABLE "public"."courses" IS 'Learning modules';



ALTER TABLE "public"."courses" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."courses_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" bigint NOT NULL,
    "course_id" bigint NOT NULL,
    "type" "public"."lesson_type" DEFAULT 'descriptive'::"public"."lesson_type" NOT NULL,
    "title" "jsonb" NOT NULL,
    "content" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


COMMENT ON TABLE "public"."lessons" IS 'Steps of a course';



ALTER TABLE "public"."lessons" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lessons_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."memberships" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_id" bigint NOT NULL,
    "role" "public"."organization_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."memberships" OWNER TO "postgres";


COMMENT ON TABLE "public"."memberships" IS 'User organizations';



ALTER TABLE "public"."memberships" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."memberships_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."organization_regions" (
    "id" bigint NOT NULL,
    "region_id" bigint NOT NULL,
    "organization_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."organization_regions" OWNER TO "postgres";


COMMENT ON TABLE "public"."organization_regions" IS 'Organizations per region';



ALTER TABLE "public"."organization_regions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."organization_regions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" bigint NOT NULL,
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
    "rating" smallint,
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "valid_url" CHECK (("website" ~* '^(https?://)?(www\\.)?([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,6}(/.*)?$'::"text"))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


COMMENT ON TABLE "public"."organizations" IS 'Volunteering organizations';



ALTER TABLE "public"."organizations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."organizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."regions" (
    "id" bigint NOT NULL,
    "name" "jsonb" NOT NULL,
    "coordinator_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."regions" OWNER TO "postgres";


COMMENT ON TABLE "public"."regions" IS 'Groups of organizations';



ALTER TABLE "public"."regions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."regions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_assessments" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "skill_id" bigint,
    "assessment_id" bigint,
    "value" smallint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."user_assessments" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_assessments" IS 'Self-assessments of a skill';



ALTER TABLE "public"."user_assessments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."self_ skill_assessments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_evaluations" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "evaluation_id" bigint NOT NULL,
    "value" smallint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."user_evaluations" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_evaluations" IS 'User evaluations unrelated to a skill';



ALTER TABLE "public"."user_evaluations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."self_assessments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."skill_areas" (
    "id" bigint NOT NULL,
    "name" "jsonb" NOT NULL,
    "description" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."skill_areas" OWNER TO "postgres";


COMMENT ON TABLE "public"."skill_areas" IS 'Areas grouping soft skills';



ALTER TABLE "public"."skill_areas" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."skill_areas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."assessments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."skill_assessments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."skills" (
    "id" bigint NOT NULL,
    "skill_area_id" bigint,
    "name" "jsonb" NOT NULL,
    "description" "jsonb",
    "icon_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."skills" OWNER TO "postgres";


COMMENT ON TABLE "public"."skills" IS 'Soft skills';



ALTER TABLE "public"."skills" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."skills_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_courses" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."user_courses" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_courses" IS 'Subscriptions to a course';



ALTER TABLE "public"."user_courses" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_courses_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_lessons" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "lesson_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."user_lessons" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_lessons" IS 'Completed lessons in a course';



ALTER TABLE "public"."user_lessons" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_lessons_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "first_name" "text",
    "last_name" "text",
    "birthday" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "sex" "public"."sex",
    "pronouns" "text",
    "nationality" "text",
    "country" "text",
    "city" "text",
    "avatar_url" "text",
    "bio" "jsonb",
    "is_admin" boolean DEFAULT false NOT NULL,
    "is_editor" boolean DEFAULT false NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'User profiles';



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



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "profiles_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



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



CREATE OR REPLACE TRIGGER "before_insert_user_assessment" BEFORE INSERT ON "public"."user_assessments" FOR EACH ROW EXECUTE FUNCTION "public"."set_skill_id"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."assessments" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."certificates" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."contributions" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."courses" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."evaluations" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."lessons" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."memberships" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."organization_regions" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."question_options" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."questions" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."regions" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."skill_areas" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."skills" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."user_answers" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."user_assessments" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."user_courses" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."user_evaluations" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."user_lessons" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "update_username" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."set_username"();



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."certificate_skills"
    ADD CONSTRAINT "certificate_skills_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certificate_skills"
    ADD CONSTRAINT "certificate_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contributions"
    ADD CONSTRAINT "contributions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contributions"
    ADD CONSTRAINT "contributions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_creator_id_fkey1" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_regions"
    ADD CONSTRAINT "organization_regions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_regions"
    ADD CONSTRAINT "organization_regions_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."question_options"
    ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."regions"
    ADD CONSTRAINT "regions_coordinator_id_fkey" FOREIGN KEY ("coordinator_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."skills"
    ADD CONSTRAINT "skills_skill_area_id_fkey" FOREIGN KEY ("skill_area_id") REFERENCES "public"."skill_areas"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_answers"
    ADD CONSTRAINT "user_answers_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."question_options"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_answers"
    ADD CONSTRAINT "user_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_assessments"
    ADD CONSTRAINT "user_assessments_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_assessments"
    ADD CONSTRAINT "user_assessments_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_assessments"
    ADD CONSTRAINT "user_assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_courses"
    ADD CONSTRAINT "user_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_courses"
    ADD CONSTRAINT "user_courses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_evaluations"
    ADD CONSTRAINT "user_evaluations_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "public"."evaluations"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_evaluations"
    ADD CONSTRAINT "user_evaluations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_lessons"
    ADD CONSTRAINT "user_lessons_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_lessons"
    ADD CONSTRAINT "user_lessons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Anyone can read public users" ON "public"."users" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Users can create their own lessons" ON "public"."user_lessons" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own lessons or by admin, rep" ON "public"."user_lessons" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ( SELECT "users"."is_admin"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) OR ("user_id" IN ( SELECT "memberships"."user_id"
   FROM "public"."memberships"
  WHERE ("memberships"."organization_id" IN ( SELECT "memberships_1"."organization_id"
           FROM "public"."memberships" "memberships_1"
          WHERE (("memberships_1"."user_id" = "auth"."uid"()) AND ("memberships_1"."role" = 'representative'::"public"."organization_role"))))))));



CREATE POLICY "Users can update their own lessons or by admin, rep, or tutor" ON "public"."user_lessons" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ( SELECT "users"."is_admin"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) OR ("user_id" IN ( SELECT "memberships"."user_id"
   FROM "public"."memberships"
  WHERE ("memberships"."organization_id" IN ( SELECT "memberships_1"."organization_id"
           FROM "public"."memberships" "memberships_1"
          WHERE (("memberships_1"."user_id" = "auth"."uid"()) AND ("memberships_1"."role" = ANY (ARRAY['representative'::"public"."organization_role", 'tutor'::"public"."organization_role"]))))))))) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own lessons or by admin, rep, or tutor" ON "public"."user_lessons" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ( SELECT "users"."is_admin"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())) OR ("user_id" IN ( SELECT "memberships"."user_id"
   FROM "public"."memberships"
  WHERE ("memberships"."organization_id" IN ( SELECT "memberships_1"."organization_id"
           FROM "public"."memberships" "memberships_1"
          WHERE (("memberships_1"."user_id" = "auth"."uid"()) AND ("memberships_1"."role" = ANY (ARRAY['representative'::"public"."organization_role", 'tutor'::"public"."organization_role"])))))))));



CREATE POLICY "Users, admins and representative can update a public record" ON "public"."users" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "id") OR ( SELECT "users_1"."is_admin"
   FROM "public"."users" "users_1"
  WHERE ("users_1"."id" = "auth"."uid"())) OR ("id" IN ( SELECT "memberships"."user_id"
   FROM "public"."memberships"
  WHERE ("memberships"."organization_id" IN ( SELECT "memberships_1"."organization_id"
           FROM "public"."memberships" "memberships_1"
          WHERE (("memberships_1"."user_id" = "auth"."uid"()) AND ("memberships_1"."role" = ANY (ARRAY['representative'::"public"."organization_role", 'tutor'::"public"."organization_role"]))))))))) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certificate_skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certificates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contributions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evaluations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_regions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."question_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."regions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."skill_areas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_evaluations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."create_public_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_public_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_public_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_user_into_public"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_user_into_public"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_user_into_public"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_skill_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_skill_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_skill_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_username"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_username"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_username"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_public_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_public_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_public_user"() TO "service_role";
























GRANT ALL ON TABLE "public"."assessments" TO "anon";
GRANT ALL ON TABLE "public"."assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."assessments" TO "service_role";



GRANT ALL ON TABLE "public"."evaluations" TO "anon";
GRANT ALL ON TABLE "public"."evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."assessments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."assessments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."assessments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."certificate_skills" TO "anon";
GRANT ALL ON TABLE "public"."certificate_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."certificate_skills" TO "service_role";



GRANT ALL ON SEQUENCE "public"."certificate_skills_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."certificate_skills_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."certificate_skills_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."certificates" TO "anon";
GRANT ALL ON TABLE "public"."certificates" TO "authenticated";
GRANT ALL ON TABLE "public"."certificates" TO "service_role";



GRANT ALL ON SEQUENCE "public"."certificates_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."certificates_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."certificates_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_answers" TO "anon";
GRANT ALL ON TABLE "public"."user_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."user_answers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."closed_question_answers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."closed_question_answers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."closed_question_answers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."question_options" TO "anon";
GRANT ALL ON TABLE "public"."question_options" TO "authenticated";
GRANT ALL ON TABLE "public"."question_options" TO "service_role";



GRANT ALL ON SEQUENCE "public"."closed_question_options_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."closed_question_options_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."closed_question_options_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."closed_questions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."closed_questions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."closed_questions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."contributions" TO "anon";
GRANT ALL ON TABLE "public"."contributions" TO "authenticated";
GRANT ALL ON TABLE "public"."contributions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."contributions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."contributions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."contributions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."courses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."courses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."courses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lessons_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lessons_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lessons_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."memberships" TO "anon";
GRANT ALL ON TABLE "public"."memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."memberships" TO "service_role";



GRANT ALL ON SEQUENCE "public"."memberships_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."memberships_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."memberships_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."organization_regions" TO "anon";
GRANT ALL ON TABLE "public"."organization_regions" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_regions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."organization_regions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."organization_regions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."organization_regions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."organizations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."organizations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."organizations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."regions" TO "anon";
GRANT ALL ON TABLE "public"."regions" TO "authenticated";
GRANT ALL ON TABLE "public"."regions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."regions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."regions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."regions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_assessments" TO "anon";
GRANT ALL ON TABLE "public"."user_assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."user_assessments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."self_ skill_assessments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."self_ skill_assessments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."self_ skill_assessments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_evaluations" TO "anon";
GRANT ALL ON TABLE "public"."user_evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_evaluations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."self_assessments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."self_assessments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."self_assessments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."skill_areas" TO "anon";
GRANT ALL ON TABLE "public"."skill_areas" TO "authenticated";
GRANT ALL ON TABLE "public"."skill_areas" TO "service_role";



GRANT ALL ON SEQUENCE "public"."skill_areas_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."skill_areas_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."skill_areas_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."skill_assessments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."skill_assessments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."skill_assessments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."skills" TO "anon";
GRANT ALL ON TABLE "public"."skills" TO "authenticated";
GRANT ALL ON TABLE "public"."skills" TO "service_role";



GRANT ALL ON SEQUENCE "public"."skills_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."skills_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."skills_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_courses" TO "anon";
GRANT ALL ON TABLE "public"."user_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."user_courses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_courses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_courses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_courses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_lessons" TO "anon";
GRANT ALL ON TABLE "public"."user_lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."user_lessons" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_lessons_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_lessons_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_lessons_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
