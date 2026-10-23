ALTER TABLE "organization_invitations" DROP CONSTRAINT "organization_invitations_token_unique";--> statement-breakpoint
ALTER TABLE "organization_invite_links" DROP CONSTRAINT "organization_invite_links_token_unique";--> statement-breakpoint
DROP INDEX "team_invitations_token_key";--> statement-breakpoint
ALTER TABLE "organization_invitations" ALTER COLUMN "token_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_invite_links" ALTER COLUMN "token_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "team_invitations" ALTER COLUMN "token_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_invitations" DROP COLUMN "token";--> statement-breakpoint
ALTER TABLE "organization_invite_links" DROP COLUMN "token";--> statement-breakpoint
ALTER TABLE "team_invitations" DROP COLUMN "token";