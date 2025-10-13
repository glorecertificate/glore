CREATE POLICY "Admins can delete contributions" ON "public"."contributions" AS permissive FOR delete TO authenticated USING (
  (
    EXISTS (
      SELECT
        1
      FROM
        users u
      WHERE
        (
          (
            u.id = (
              SELECT
                auth.uid () AS uid
            )
          ) AND
          (u.is_admin = TRUE)
        )
    )
  )
);

CREATE POLICY "Admins or editors can create contributions" ON "public"."contributions" AS permissive FOR insert TO authenticated
WITH
  CHECK (
    (
      EXISTS (
        SELECT
          1
        FROM
          users u
        WHERE
          (
            (
              u.id = (
                SELECT
                  auth.uid () AS uid
              )
            ) AND
            (
              (u.is_admin = TRUE) OR
              (u.is_editor = TRUE)
            )
          )
      )
    )
  );

CREATE POLICY "Authenticated users can view contributions" ON "public"."contributions" AS permissive FOR
SELECT
  TO authenticated USING (TRUE);
