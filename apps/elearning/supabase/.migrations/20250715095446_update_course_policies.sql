ALTER TABLE "public"."users"
ADD COLUMN "languages" TEXT[];

ALTER TABLE "public"."users"
ALTER COLUMN "bio"
SET DATA TYPE TEXT USING "bio"::TEXT;

CREATE POLICY "Admins and editors can delete assessments" ON "public"."assessments" AS permissive FOR delete TO authenticated USING (
  (
    (
      SELECT
        users.is_admin
      FROM
        users
      WHERE
        (users.id = auth.uid ())
    ) OR
    (
      SELECT
        users.is_editor
      FROM
        users
      WHERE
        (users.id = auth.uid ())
    )
  )
);

CREATE POLICY "Admins and editors can insert assessments" ON "public"."assessments" AS permissive FOR insert TO authenticated
WITH
  CHECK (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can select assessments" ON "public"."assessments" AS permissive FOR
SELECT
  TO authenticated USING (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can update assessments" ON "public"."assessments" AS permissive
FOR UPDATE
  TO authenticated USING (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  )
WITH
  CHECK (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can delete courses" ON "public"."courses" AS permissive FOR delete TO authenticated USING (
  (
    (
      SELECT
        users.is_admin
      FROM
        users
      WHERE
        (users.id = auth.uid ())
    ) OR
    (
      SELECT
        users.is_editor
      FROM
        users
      WHERE
        (users.id = auth.uid ())
    )
  )
);

CREATE POLICY "Admins and editors can insert courses" ON "public"."courses" AS permissive FOR insert TO authenticated
WITH
  CHECK (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can update courses" ON "public"."courses" AS permissive
FOR UPDATE
  TO authenticated USING (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  )
WITH
  CHECK (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can view courses" ON "public"."courses" AS permissive FOR
SELECT
  TO authenticated USING (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can delete evaluations" ON "public"."evaluations" AS permissive FOR delete TO authenticated USING (
  (
    (
      SELECT
        users.is_admin
      FROM
        users
      WHERE
        (users.id = auth.uid ())
    ) OR
    (
      SELECT
        users.is_editor
      FROM
        users
      WHERE
        (users.id = auth.uid ())
    )
  )
);

CREATE POLICY "Admins and editors can insert evaluations" ON "public"."evaluations" AS permissive FOR insert TO authenticated
WITH
  CHECK (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can select evaluations" ON "public"."evaluations" AS permissive FOR
SELECT
  TO authenticated USING (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can update evaluations" ON "public"."evaluations" AS permissive
FOR UPDATE
  TO authenticated USING (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  )
WITH
  CHECK (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can delete lessons" ON "public"."lessons" AS permissive FOR delete TO authenticated USING (
  (
    (
      SELECT
        users.is_admin
      FROM
        users
      WHERE
        (users.id = auth.uid ())
    ) OR
    (
      SELECT
        users.is_editor
      FROM
        users
      WHERE
        (users.id = auth.uid ())
    )
  )
);

CREATE POLICY "Admins and editors can insert lessons" ON "public"."lessons" AS permissive FOR insert TO authenticated
WITH
  CHECK (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can select lessons" ON "public"."lessons" AS permissive FOR
SELECT
  TO authenticated USING (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can update lessons" ON "public"."lessons" AS permissive
FOR UPDATE
  TO authenticated USING (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  )
WITH
  CHECK (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can delete question_options" ON "public"."question_options" AS permissive FOR delete TO authenticated USING (
  (
    (
      SELECT
        users.is_admin
      FROM
        users
      WHERE
        (users.id = auth.uid ())
    ) OR
    (
      SELECT
        users.is_editor
      FROM
        users
      WHERE
        (users.id = auth.uid ())
    )
  )
);

CREATE POLICY "Admins and editors can insert question_options" ON "public"."question_options" AS permissive FOR insert TO authenticated
WITH
  CHECK (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can select question_options" ON "public"."question_options" AS permissive FOR
SELECT
  TO authenticated USING (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can update question_options" ON "public"."question_options" AS permissive
FOR UPDATE
  TO authenticated USING (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  )
WITH
  CHECK (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can delete questions" ON "public"."questions" AS permissive FOR delete TO authenticated USING (
  (
    (
      SELECT
        users.is_admin
      FROM
        users
      WHERE
        (users.id = auth.uid ())
    ) OR
    (
      SELECT
        users.is_editor
      FROM
        users
      WHERE
        (users.id = auth.uid ())
    )
  )
);

CREATE POLICY "Admins and editors can insert questions" ON "public"."questions" AS permissive FOR insert TO authenticated
WITH
  CHECK (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can select questions" ON "public"."questions" AS permissive FOR
SELECT
  TO authenticated USING (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );

CREATE POLICY "Admins and editors can update questions" ON "public"."questions" AS permissive
FOR UPDATE
  TO authenticated USING (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  )
WITH
  CHECK (
    (
      (
        SELECT
          users.is_admin
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      ) OR
      (
        SELECT
          users.is_editor
        FROM
          users
        WHERE
          (users.id = auth.uid ())
      )
    )
  );
