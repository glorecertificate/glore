CREATE TABLE "organization_profiles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organization_profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"organization_id" integer NOT NULL,
	"description" jsonb,
	"url" text,
	"phone" text,
	"country" text,
	"region" text,
	"postcode" text,
	"address" text,
	"rating" integer,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_profiles_organizationId_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
ALTER TABLE "organization_profiles" ADD CONSTRAINT "organization_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_profiles_organization_id_idx" ON "organization_profiles" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "url";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "country";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "region";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "postcode";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "address";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "rating";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "avatar_url";