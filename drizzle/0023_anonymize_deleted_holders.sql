ALTER TABLE "certificates" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "holder_deleted_at" timestamp;