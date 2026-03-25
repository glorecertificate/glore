CREATE INDEX "certificates_status_idx" ON "certificates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "doc_articles_category_id_idx" ON "doc_articles" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "doc_categories_slug_idx" ON "doc_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "org_join_requests_status_idx" ON "organization_join_requests" USING btree ("status");