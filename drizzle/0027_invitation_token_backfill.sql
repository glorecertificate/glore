-- Custom SQL migration file, put your code below! --
UPDATE "organization_invitations" SET "token_hash" = encode(sha256(convert_to("token", 'UTF8')), 'hex') WHERE "token_hash" IS NULL;
--> statement-breakpoint
UPDATE "organization_invite_links" SET "token_hash" = encode(sha256(convert_to("token", 'UTF8')), 'hex') WHERE "token_hash" IS NULL;
--> statement-breakpoint
UPDATE "team_invitations" SET "token_hash" = encode(sha256(convert_to("token", 'UTF8')), 'hex') WHERE "token_hash" IS NULL;
--> statement-breakpoint
UPDATE "notifications" SET "url" = CASE WHEN "data" ? 'invitationId' THEN '/api/v1/invitations/' || ("data"->>'invitationId') ELSE NULL END WHERE "url" LIKE '/invite/%';
