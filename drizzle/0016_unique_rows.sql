DROP INDEX "memberships_user_id_organization_id_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_handle_key" ON "certificates" USING btree ("handle");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_user_id_organization_id_key" ON "memberships" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_answers_user_id_option_id_key" ON "user_answers" USING btree ("user_id","option_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_assessments_user_id_assessment_id_key" ON "user_assessments" USING btree ("user_id","assessment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_courses_user_id_course_id_key" ON "user_courses" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_evaluations_user_id_evaluation_id_key" ON "user_evaluations" USING btree ("user_id","evaluation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_lessons_user_id_lesson_id_key" ON "user_lessons" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_invitations_token_key" ON "team_invitations" USING btree ("token");