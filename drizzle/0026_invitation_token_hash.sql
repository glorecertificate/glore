ALTER TABLE "organization_invitations" ADD COLUMN "token_hash" text;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD COLUMN "token_cipher" text;--> statement-breakpoint
ALTER TABLE "organization_invite_links" ADD COLUMN "token_hash" text;--> statement-breakpoint
ALTER TABLE "organization_invite_links" ADD COLUMN "token_cipher" text;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD COLUMN "token_hash" text;--> statement-breakpoint
CREATE UNIQUE INDEX "team_invitations_token_hash_key" ON "team_invitations" USING btree ("token_hash");--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_token_hash_unique" UNIQUE("token_hash");--> statement-breakpoint
ALTER TABLE "organization_invite_links" ADD CONSTRAINT "organization_invite_links_token_hash_unique" UNIQUE("token_hash");