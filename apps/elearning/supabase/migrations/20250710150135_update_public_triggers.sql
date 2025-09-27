DROP TRIGGER if EXISTS "before_insert_user_assessment" ON "public"."user_assessments";

CREATE TRIGGER set_assessment_skill before insert ON public.user_assessments FOR each ROW
EXECUTE function set_skill_id ();

CREATE TRIGGER create_username
AFTER insert ON public.users FOR each ROW
EXECUTE function set_username (),
