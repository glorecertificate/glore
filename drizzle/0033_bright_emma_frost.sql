CREATE TYPE "public"."skill_level" AS ENUM('intermediate', 'good', 'advanced');--> statement-breakpoint
CREATE TABLE "skill_level_descriptions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "skill_level_descriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"assessment_id" integer NOT NULL,
	"level" "skill_level" NOT NULL,
	"description" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "skill_level_descriptions" ADD CONSTRAINT "skill_level_descriptions_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "skill_level_descriptions_assessment_level_key" ON "skill_level_descriptions" USING btree ("assessment_id","level");