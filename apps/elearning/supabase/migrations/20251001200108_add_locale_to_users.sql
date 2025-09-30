drop trigger if exists "set_updated_at" on "public"."assessments";

drop trigger if exists "set_updated_at" on "public"."certificates";

drop trigger if exists "set_updated_at" on "public"."contributions";

drop trigger if exists "set_updated_at" on "public"."courses";

drop trigger if exists "set_updated_at" on "public"."evaluations";

drop trigger if exists "set_updated_at" on "public"."lessons";

drop trigger if exists "set_updated_at" on "public"."memberships";

drop trigger if exists "set_updated_at" on "public"."organization_regions";

drop trigger if exists "set_updated_at" on "public"."organizations";

drop trigger if exists "set_updated_at" on "public"."question_options";

drop trigger if exists "set_updated_at" on "public"."questions";

drop trigger if exists "set_updated_at" on "public"."regions";

drop trigger if exists "set_updated_at" on "public"."skill_groups";

drop trigger if exists "set_updated_at" on "public"."user_answers";

drop trigger if exists "set_updated_at" on "public"."user_assessments";

drop trigger if exists "set_updated_at" on "public"."user_courses";

drop trigger if exists "set_updated_at" on "public"."user_evaluations";

drop trigger if exists "set_updated_at" on "public"."user_lessons";

drop trigger if exists "set_updated_at" on "public"."users";

revoke delete on table "public"."assessments" from "anon";

revoke insert on table "public"."assessments" from "anon";

revoke references on table "public"."assessments" from "anon";

revoke select on table "public"."assessments" from "anon";

revoke trigger on table "public"."assessments" from "anon";

revoke truncate on table "public"."assessments" from "anon";

revoke update on table "public"."assessments" from "anon";

revoke delete on table "public"."assessments" from "authenticated";

revoke insert on table "public"."assessments" from "authenticated";

revoke references on table "public"."assessments" from "authenticated";

revoke select on table "public"."assessments" from "authenticated";

revoke trigger on table "public"."assessments" from "authenticated";

revoke truncate on table "public"."assessments" from "authenticated";

revoke update on table "public"."assessments" from "authenticated";

revoke delete on table "public"."assessments" from "service_role";

revoke insert on table "public"."assessments" from "service_role";

revoke references on table "public"."assessments" from "service_role";

revoke select on table "public"."assessments" from "service_role";

revoke trigger on table "public"."assessments" from "service_role";

revoke truncate on table "public"."assessments" from "service_role";

revoke update on table "public"."assessments" from "service_role";

revoke delete on table "public"."certificate_skills" from "anon";

revoke insert on table "public"."certificate_skills" from "anon";

revoke references on table "public"."certificate_skills" from "anon";

revoke select on table "public"."certificate_skills" from "anon";

revoke trigger on table "public"."certificate_skills" from "anon";

revoke truncate on table "public"."certificate_skills" from "anon";

revoke update on table "public"."certificate_skills" from "anon";

revoke delete on table "public"."certificate_skills" from "authenticated";

revoke insert on table "public"."certificate_skills" from "authenticated";

revoke references on table "public"."certificate_skills" from "authenticated";

revoke select on table "public"."certificate_skills" from "authenticated";

revoke trigger on table "public"."certificate_skills" from "authenticated";

revoke truncate on table "public"."certificate_skills" from "authenticated";

revoke update on table "public"."certificate_skills" from "authenticated";

revoke delete on table "public"."certificate_skills" from "service_role";

revoke insert on table "public"."certificate_skills" from "service_role";

revoke references on table "public"."certificate_skills" from "service_role";

revoke select on table "public"."certificate_skills" from "service_role";

revoke trigger on table "public"."certificate_skills" from "service_role";

revoke truncate on table "public"."certificate_skills" from "service_role";

revoke update on table "public"."certificate_skills" from "service_role";

revoke delete on table "public"."certificates" from "anon";

revoke insert on table "public"."certificates" from "anon";

revoke references on table "public"."certificates" from "anon";

revoke select on table "public"."certificates" from "anon";

revoke trigger on table "public"."certificates" from "anon";

revoke truncate on table "public"."certificates" from "anon";

revoke update on table "public"."certificates" from "anon";

revoke delete on table "public"."certificates" from "authenticated";

revoke insert on table "public"."certificates" from "authenticated";

revoke references on table "public"."certificates" from "authenticated";

revoke select on table "public"."certificates" from "authenticated";

revoke trigger on table "public"."certificates" from "authenticated";

revoke truncate on table "public"."certificates" from "authenticated";

revoke update on table "public"."certificates" from "authenticated";

revoke delete on table "public"."certificates" from "service_role";

revoke insert on table "public"."certificates" from "service_role";

revoke references on table "public"."certificates" from "service_role";

revoke select on table "public"."certificates" from "service_role";

revoke trigger on table "public"."certificates" from "service_role";

revoke truncate on table "public"."certificates" from "service_role";

revoke update on table "public"."certificates" from "service_role";

revoke delete on table "public"."contributions" from "anon";

revoke insert on table "public"."contributions" from "anon";

revoke references on table "public"."contributions" from "anon";

revoke select on table "public"."contributions" from "anon";

revoke trigger on table "public"."contributions" from "anon";

revoke truncate on table "public"."contributions" from "anon";

revoke update on table "public"."contributions" from "anon";

revoke delete on table "public"."contributions" from "authenticated";

revoke insert on table "public"."contributions" from "authenticated";

revoke references on table "public"."contributions" from "authenticated";

revoke select on table "public"."contributions" from "authenticated";

revoke trigger on table "public"."contributions" from "authenticated";

revoke truncate on table "public"."contributions" from "authenticated";

revoke update on table "public"."contributions" from "authenticated";

revoke delete on table "public"."contributions" from "service_role";

revoke insert on table "public"."contributions" from "service_role";

revoke references on table "public"."contributions" from "service_role";

revoke select on table "public"."contributions" from "service_role";

revoke trigger on table "public"."contributions" from "service_role";

revoke truncate on table "public"."contributions" from "service_role";

revoke update on table "public"."contributions" from "service_role";

revoke delete on table "public"."courses" from "anon";

revoke insert on table "public"."courses" from "anon";

revoke references on table "public"."courses" from "anon";

revoke select on table "public"."courses" from "anon";

revoke trigger on table "public"."courses" from "anon";

revoke truncate on table "public"."courses" from "anon";

revoke update on table "public"."courses" from "anon";

revoke delete on table "public"."courses" from "authenticated";

revoke insert on table "public"."courses" from "authenticated";

revoke references on table "public"."courses" from "authenticated";

revoke select on table "public"."courses" from "authenticated";

revoke trigger on table "public"."courses" from "authenticated";

revoke truncate on table "public"."courses" from "authenticated";

revoke update on table "public"."courses" from "authenticated";

revoke delete on table "public"."courses" from "service_role";

revoke insert on table "public"."courses" from "service_role";

revoke references on table "public"."courses" from "service_role";

revoke select on table "public"."courses" from "service_role";

revoke trigger on table "public"."courses" from "service_role";

revoke truncate on table "public"."courses" from "service_role";

revoke update on table "public"."courses" from "service_role";

revoke delete on table "public"."evaluations" from "anon";

revoke insert on table "public"."evaluations" from "anon";

revoke references on table "public"."evaluations" from "anon";

revoke select on table "public"."evaluations" from "anon";

revoke trigger on table "public"."evaluations" from "anon";

revoke truncate on table "public"."evaluations" from "anon";

revoke update on table "public"."evaluations" from "anon";

revoke delete on table "public"."evaluations" from "authenticated";

revoke insert on table "public"."evaluations" from "authenticated";

revoke references on table "public"."evaluations" from "authenticated";

revoke select on table "public"."evaluations" from "authenticated";

revoke trigger on table "public"."evaluations" from "authenticated";

revoke truncate on table "public"."evaluations" from "authenticated";

revoke update on table "public"."evaluations" from "authenticated";

revoke delete on table "public"."evaluations" from "service_role";

revoke insert on table "public"."evaluations" from "service_role";

revoke references on table "public"."evaluations" from "service_role";

revoke select on table "public"."evaluations" from "service_role";

revoke trigger on table "public"."evaluations" from "service_role";

revoke truncate on table "public"."evaluations" from "service_role";

revoke update on table "public"."evaluations" from "service_role";

revoke delete on table "public"."lessons" from "anon";

revoke insert on table "public"."lessons" from "anon";

revoke references on table "public"."lessons" from "anon";

revoke select on table "public"."lessons" from "anon";

revoke trigger on table "public"."lessons" from "anon";

revoke truncate on table "public"."lessons" from "anon";

revoke update on table "public"."lessons" from "anon";

revoke delete on table "public"."lessons" from "authenticated";

revoke insert on table "public"."lessons" from "authenticated";

revoke references on table "public"."lessons" from "authenticated";

revoke select on table "public"."lessons" from "authenticated";

revoke trigger on table "public"."lessons" from "authenticated";

revoke truncate on table "public"."lessons" from "authenticated";

revoke update on table "public"."lessons" from "authenticated";

revoke delete on table "public"."lessons" from "service_role";

revoke insert on table "public"."lessons" from "service_role";

revoke references on table "public"."lessons" from "service_role";

revoke select on table "public"."lessons" from "service_role";

revoke trigger on table "public"."lessons" from "service_role";

revoke truncate on table "public"."lessons" from "service_role";

revoke update on table "public"."lessons" from "service_role";

revoke delete on table "public"."memberships" from "anon";

revoke insert on table "public"."memberships" from "anon";

revoke references on table "public"."memberships" from "anon";

revoke select on table "public"."memberships" from "anon";

revoke trigger on table "public"."memberships" from "anon";

revoke truncate on table "public"."memberships" from "anon";

revoke update on table "public"."memberships" from "anon";

revoke delete on table "public"."memberships" from "authenticated";

revoke insert on table "public"."memberships" from "authenticated";

revoke references on table "public"."memberships" from "authenticated";

revoke select on table "public"."memberships" from "authenticated";

revoke trigger on table "public"."memberships" from "authenticated";

revoke truncate on table "public"."memberships" from "authenticated";

revoke update on table "public"."memberships" from "authenticated";

revoke delete on table "public"."memberships" from "service_role";

revoke insert on table "public"."memberships" from "service_role";

revoke references on table "public"."memberships" from "service_role";

revoke select on table "public"."memberships" from "service_role";

revoke trigger on table "public"."memberships" from "service_role";

revoke truncate on table "public"."memberships" from "service_role";

revoke update on table "public"."memberships" from "service_role";

revoke delete on table "public"."organization_regions" from "anon";

revoke insert on table "public"."organization_regions" from "anon";

revoke references on table "public"."organization_regions" from "anon";

revoke select on table "public"."organization_regions" from "anon";

revoke trigger on table "public"."organization_regions" from "anon";

revoke truncate on table "public"."organization_regions" from "anon";

revoke update on table "public"."organization_regions" from "anon";

revoke delete on table "public"."organization_regions" from "authenticated";

revoke insert on table "public"."organization_regions" from "authenticated";

revoke references on table "public"."organization_regions" from "authenticated";

revoke select on table "public"."organization_regions" from "authenticated";

revoke trigger on table "public"."organization_regions" from "authenticated";

revoke truncate on table "public"."organization_regions" from "authenticated";

revoke update on table "public"."organization_regions" from "authenticated";

revoke delete on table "public"."organization_regions" from "service_role";

revoke insert on table "public"."organization_regions" from "service_role";

revoke references on table "public"."organization_regions" from "service_role";

revoke select on table "public"."organization_regions" from "service_role";

revoke trigger on table "public"."organization_regions" from "service_role";

revoke truncate on table "public"."organization_regions" from "service_role";

revoke update on table "public"."organization_regions" from "service_role";

revoke delete on table "public"."organizations" from "anon";

revoke insert on table "public"."organizations" from "anon";

revoke references on table "public"."organizations" from "anon";

revoke select on table "public"."organizations" from "anon";

revoke trigger on table "public"."organizations" from "anon";

revoke truncate on table "public"."organizations" from "anon";

revoke update on table "public"."organizations" from "anon";

revoke delete on table "public"."organizations" from "authenticated";

revoke insert on table "public"."organizations" from "authenticated";

revoke references on table "public"."organizations" from "authenticated";

revoke select on table "public"."organizations" from "authenticated";

revoke trigger on table "public"."organizations" from "authenticated";

revoke truncate on table "public"."organizations" from "authenticated";

revoke update on table "public"."organizations" from "authenticated";

revoke delete on table "public"."organizations" from "service_role";

revoke insert on table "public"."organizations" from "service_role";

revoke references on table "public"."organizations" from "service_role";

revoke select on table "public"."organizations" from "service_role";

revoke trigger on table "public"."organizations" from "service_role";

revoke truncate on table "public"."organizations" from "service_role";

revoke update on table "public"."organizations" from "service_role";

revoke delete on table "public"."question_options" from "anon";

revoke insert on table "public"."question_options" from "anon";

revoke references on table "public"."question_options" from "anon";

revoke select on table "public"."question_options" from "anon";

revoke trigger on table "public"."question_options" from "anon";

revoke truncate on table "public"."question_options" from "anon";

revoke update on table "public"."question_options" from "anon";

revoke delete on table "public"."question_options" from "authenticated";

revoke insert on table "public"."question_options" from "authenticated";

revoke references on table "public"."question_options" from "authenticated";

revoke select on table "public"."question_options" from "authenticated";

revoke trigger on table "public"."question_options" from "authenticated";

revoke truncate on table "public"."question_options" from "authenticated";

revoke update on table "public"."question_options" from "authenticated";

revoke delete on table "public"."question_options" from "service_role";

revoke insert on table "public"."question_options" from "service_role";

revoke references on table "public"."question_options" from "service_role";

revoke select on table "public"."question_options" from "service_role";

revoke trigger on table "public"."question_options" from "service_role";

revoke truncate on table "public"."question_options" from "service_role";

revoke update on table "public"."question_options" from "service_role";

revoke delete on table "public"."questions" from "anon";

revoke insert on table "public"."questions" from "anon";

revoke references on table "public"."questions" from "anon";

revoke select on table "public"."questions" from "anon";

revoke trigger on table "public"."questions" from "anon";

revoke truncate on table "public"."questions" from "anon";

revoke update on table "public"."questions" from "anon";

revoke delete on table "public"."questions" from "authenticated";

revoke insert on table "public"."questions" from "authenticated";

revoke references on table "public"."questions" from "authenticated";

revoke select on table "public"."questions" from "authenticated";

revoke trigger on table "public"."questions" from "authenticated";

revoke truncate on table "public"."questions" from "authenticated";

revoke update on table "public"."questions" from "authenticated";

revoke delete on table "public"."questions" from "service_role";

revoke insert on table "public"."questions" from "service_role";

revoke references on table "public"."questions" from "service_role";

revoke select on table "public"."questions" from "service_role";

revoke trigger on table "public"."questions" from "service_role";

revoke truncate on table "public"."questions" from "service_role";

revoke update on table "public"."questions" from "service_role";

revoke delete on table "public"."regions" from "anon";

revoke insert on table "public"."regions" from "anon";

revoke references on table "public"."regions" from "anon";

revoke select on table "public"."regions" from "anon";

revoke trigger on table "public"."regions" from "anon";

revoke truncate on table "public"."regions" from "anon";

revoke update on table "public"."regions" from "anon";

revoke delete on table "public"."regions" from "authenticated";

revoke insert on table "public"."regions" from "authenticated";

revoke references on table "public"."regions" from "authenticated";

revoke select on table "public"."regions" from "authenticated";

revoke trigger on table "public"."regions" from "authenticated";

revoke truncate on table "public"."regions" from "authenticated";

revoke update on table "public"."regions" from "authenticated";

revoke delete on table "public"."regions" from "service_role";

revoke insert on table "public"."regions" from "service_role";

revoke references on table "public"."regions" from "service_role";

revoke select on table "public"."regions" from "service_role";

revoke trigger on table "public"."regions" from "service_role";

revoke truncate on table "public"."regions" from "service_role";

revoke update on table "public"."regions" from "service_role";

revoke delete on table "public"."skill_groups" from "anon";

revoke insert on table "public"."skill_groups" from "anon";

revoke references on table "public"."skill_groups" from "anon";

revoke select on table "public"."skill_groups" from "anon";

revoke trigger on table "public"."skill_groups" from "anon";

revoke truncate on table "public"."skill_groups" from "anon";

revoke update on table "public"."skill_groups" from "anon";

revoke delete on table "public"."skill_groups" from "authenticated";

revoke insert on table "public"."skill_groups" from "authenticated";

revoke references on table "public"."skill_groups" from "authenticated";

revoke select on table "public"."skill_groups" from "authenticated";

revoke trigger on table "public"."skill_groups" from "authenticated";

revoke truncate on table "public"."skill_groups" from "authenticated";

revoke update on table "public"."skill_groups" from "authenticated";

revoke delete on table "public"."skill_groups" from "service_role";

revoke insert on table "public"."skill_groups" from "service_role";

revoke references on table "public"."skill_groups" from "service_role";

revoke select on table "public"."skill_groups" from "service_role";

revoke trigger on table "public"."skill_groups" from "service_role";

revoke truncate on table "public"."skill_groups" from "service_role";

revoke update on table "public"."skill_groups" from "service_role";

revoke delete on table "public"."user_answers" from "anon";

revoke insert on table "public"."user_answers" from "anon";

revoke references on table "public"."user_answers" from "anon";

revoke select on table "public"."user_answers" from "anon";

revoke trigger on table "public"."user_answers" from "anon";

revoke truncate on table "public"."user_answers" from "anon";

revoke update on table "public"."user_answers" from "anon";

revoke delete on table "public"."user_answers" from "authenticated";

revoke insert on table "public"."user_answers" from "authenticated";

revoke references on table "public"."user_answers" from "authenticated";

revoke select on table "public"."user_answers" from "authenticated";

revoke trigger on table "public"."user_answers" from "authenticated";

revoke truncate on table "public"."user_answers" from "authenticated";

revoke update on table "public"."user_answers" from "authenticated";

revoke delete on table "public"."user_answers" from "service_role";

revoke insert on table "public"."user_answers" from "service_role";

revoke references on table "public"."user_answers" from "service_role";

revoke select on table "public"."user_answers" from "service_role";

revoke trigger on table "public"."user_answers" from "service_role";

revoke truncate on table "public"."user_answers" from "service_role";

revoke update on table "public"."user_answers" from "service_role";

revoke delete on table "public"."user_assessments" from "anon";

revoke insert on table "public"."user_assessments" from "anon";

revoke references on table "public"."user_assessments" from "anon";

revoke select on table "public"."user_assessments" from "anon";

revoke trigger on table "public"."user_assessments" from "anon";

revoke truncate on table "public"."user_assessments" from "anon";

revoke update on table "public"."user_assessments" from "anon";

revoke delete on table "public"."user_assessments" from "authenticated";

revoke insert on table "public"."user_assessments" from "authenticated";

revoke references on table "public"."user_assessments" from "authenticated";

revoke select on table "public"."user_assessments" from "authenticated";

revoke trigger on table "public"."user_assessments" from "authenticated";

revoke truncate on table "public"."user_assessments" from "authenticated";

revoke update on table "public"."user_assessments" from "authenticated";

revoke delete on table "public"."user_assessments" from "service_role";

revoke insert on table "public"."user_assessments" from "service_role";

revoke references on table "public"."user_assessments" from "service_role";

revoke select on table "public"."user_assessments" from "service_role";

revoke trigger on table "public"."user_assessments" from "service_role";

revoke truncate on table "public"."user_assessments" from "service_role";

revoke update on table "public"."user_assessments" from "service_role";

revoke delete on table "public"."user_courses" from "anon";

revoke insert on table "public"."user_courses" from "anon";

revoke references on table "public"."user_courses" from "anon";

revoke select on table "public"."user_courses" from "anon";

revoke trigger on table "public"."user_courses" from "anon";

revoke truncate on table "public"."user_courses" from "anon";

revoke update on table "public"."user_courses" from "anon";

revoke delete on table "public"."user_courses" from "authenticated";

revoke insert on table "public"."user_courses" from "authenticated";

revoke references on table "public"."user_courses" from "authenticated";

revoke select on table "public"."user_courses" from "authenticated";

revoke trigger on table "public"."user_courses" from "authenticated";

revoke truncate on table "public"."user_courses" from "authenticated";

revoke update on table "public"."user_courses" from "authenticated";

revoke delete on table "public"."user_courses" from "service_role";

revoke insert on table "public"."user_courses" from "service_role";

revoke references on table "public"."user_courses" from "service_role";

revoke select on table "public"."user_courses" from "service_role";

revoke trigger on table "public"."user_courses" from "service_role";

revoke truncate on table "public"."user_courses" from "service_role";

revoke update on table "public"."user_courses" from "service_role";

revoke delete on table "public"."user_evaluations" from "anon";

revoke insert on table "public"."user_evaluations" from "anon";

revoke references on table "public"."user_evaluations" from "anon";

revoke select on table "public"."user_evaluations" from "anon";

revoke trigger on table "public"."user_evaluations" from "anon";

revoke truncate on table "public"."user_evaluations" from "anon";

revoke update on table "public"."user_evaluations" from "anon";

revoke delete on table "public"."user_evaluations" from "authenticated";

revoke insert on table "public"."user_evaluations" from "authenticated";

revoke references on table "public"."user_evaluations" from "authenticated";

revoke select on table "public"."user_evaluations" from "authenticated";

revoke trigger on table "public"."user_evaluations" from "authenticated";

revoke truncate on table "public"."user_evaluations" from "authenticated";

revoke update on table "public"."user_evaluations" from "authenticated";

revoke delete on table "public"."user_evaluations" from "service_role";

revoke insert on table "public"."user_evaluations" from "service_role";

revoke references on table "public"."user_evaluations" from "service_role";

revoke select on table "public"."user_evaluations" from "service_role";

revoke trigger on table "public"."user_evaluations" from "service_role";

revoke truncate on table "public"."user_evaluations" from "service_role";

revoke update on table "public"."user_evaluations" from "service_role";

revoke delete on table "public"."user_lessons" from "anon";

revoke insert on table "public"."user_lessons" from "anon";

revoke references on table "public"."user_lessons" from "anon";

revoke select on table "public"."user_lessons" from "anon";

revoke trigger on table "public"."user_lessons" from "anon";

revoke truncate on table "public"."user_lessons" from "anon";

revoke update on table "public"."user_lessons" from "anon";

revoke delete on table "public"."user_lessons" from "authenticated";

revoke insert on table "public"."user_lessons" from "authenticated";

revoke references on table "public"."user_lessons" from "authenticated";

revoke select on table "public"."user_lessons" from "authenticated";

revoke trigger on table "public"."user_lessons" from "authenticated";

revoke truncate on table "public"."user_lessons" from "authenticated";

revoke update on table "public"."user_lessons" from "authenticated";

revoke delete on table "public"."user_lessons" from "service_role";

revoke insert on table "public"."user_lessons" from "service_role";

revoke references on table "public"."user_lessons" from "service_role";

revoke select on table "public"."user_lessons" from "service_role";

revoke trigger on table "public"."user_lessons" from "service_role";

revoke truncate on table "public"."user_lessons" from "service_role";

revoke update on table "public"."user_lessons" from "service_role";

revoke delete on table "public"."user_locales" from "anon";

revoke insert on table "public"."user_locales" from "anon";

revoke references on table "public"."user_locales" from "anon";

revoke select on table "public"."user_locales" from "anon";

revoke trigger on table "public"."user_locales" from "anon";

revoke truncate on table "public"."user_locales" from "anon";

revoke update on table "public"."user_locales" from "anon";

revoke delete on table "public"."user_locales" from "authenticated";

revoke insert on table "public"."user_locales" from "authenticated";

revoke references on table "public"."user_locales" from "authenticated";

revoke select on table "public"."user_locales" from "authenticated";

revoke trigger on table "public"."user_locales" from "authenticated";

revoke truncate on table "public"."user_locales" from "authenticated";

revoke update on table "public"."user_locales" from "authenticated";

revoke delete on table "public"."user_locales" from "service_role";

revoke insert on table "public"."user_locales" from "service_role";

revoke references on table "public"."user_locales" from "service_role";

revoke select on table "public"."user_locales" from "service_role";

revoke trigger on table "public"."user_locales" from "service_role";

revoke truncate on table "public"."user_locales" from "service_role";

revoke update on table "public"."user_locales" from "service_role";

revoke delete on table "public"."users" from "anon";

revoke insert on table "public"."users" from "anon";

revoke references on table "public"."users" from "anon";

revoke select on table "public"."users" from "anon";

revoke trigger on table "public"."users" from "anon";

revoke truncate on table "public"."users" from "anon";

revoke update on table "public"."users" from "anon";

revoke delete on table "public"."users" from "authenticated";

revoke insert on table "public"."users" from "authenticated";

revoke references on table "public"."users" from "authenticated";

revoke select on table "public"."users" from "authenticated";

revoke trigger on table "public"."users" from "authenticated";

revoke truncate on table "public"."users" from "authenticated";

revoke update on table "public"."users" from "authenticated";

revoke delete on table "public"."users" from "service_role";

revoke insert on table "public"."users" from "service_role";

revoke references on table "public"."users" from "service_role";

revoke select on table "public"."users" from "service_role";

revoke trigger on table "public"."users" from "service_role";

revoke truncate on table "public"."users" from "service_role";

revoke update on table "public"."users" from "service_role";

revoke delete on table "public"."users" from "supabase_auth_admin";

revoke insert on table "public"."users" from "supabase_auth_admin";

revoke references on table "public"."users" from "supabase_auth_admin";

revoke select on table "public"."users" from "supabase_auth_admin";

revoke trigger on table "public"."users" from "supabase_auth_admin";

revoke truncate on table "public"."users" from "supabase_auth_admin";

revoke update on table "public"."users" from "supabase_auth_admin";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_public_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.users (
    id,
    email,
    phone,
    first_name,
    last_name,
    is_admin,
    is_editor
  )
  values (
    new.id,
    new.email,
    new.phone,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    COALESCE(new.raw_user_meta_data ->> 'is_admin', 'false')::boolean,
    COALESCE(new.raw_user_meta_data ->> 'is_editor', 'false')::boolean
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_skill_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    SELECT skill_id INTO new.skill_id
    FROM public.assessments
    WHERE id = new.assessment_id;
    return new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_username()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    NEW.username := regexp_replace(lower(regexp_replace(NEW.first_name, ' ', '.', 'g') || '.' || regexp_replace(NEW.last_name, ' ', '.', 'g')), '[^a-z0-9.]+', '', 'g');
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_public_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
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
$function$
;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.contributions FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.evaluations FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organization_regions FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.question_options FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.regions FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.skill_groups FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_answers FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_assessments FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_courses FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_evaluations FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_lessons FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime('updated_at');


