-- Phase 1: Data Model Redesign (Corrected)
-- Applied manually via Supabase SQL Editor due to Docker constraint.

-- 1. Add attendance_threshold to modules
ALTER TABLE public.modules 
ADD COLUMN attendance_threshold SMALLINT NOT NULL DEFAULT 80 
CHECK (attendance_threshold BETWEEN 0 AND 100);

-- 2. Create sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_number SMALLINT NOT NULL,
  start_time TIME NOT NULL,
  topic TEXT CHECK (char_length(topic) <= 200),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_id, session_date, session_number)
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- 3. Create attendance_status ENUM
CREATE TYPE public.attendance_status AS ENUM ('present', 'late', 'absent');

-- 4. Drop the old unique constraint on attendance
ALTER TABLE public.attendance 
  DROP CONSTRAINT IF EXISTS attendance_student_id_module_id_date_key;

-- 5. Add session_id and marked_at columns
ALTER TABLE public.attendance 
  ADD COLUMN session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE;

ALTER TABLE public.attendance 
  ADD COLUMN marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 6. Drop the CHECK constraint on status before converting type
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT conname INTO v_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.attendance'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';
  IF v_constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.attendance DROP CONSTRAINT ' 
      || quote_ident(v_constraint_name);
  END IF;
END $$;

-- 7. Convert status column to ENUM
ALTER TABLE public.attendance
  ALTER COLUMN status TYPE public.attendance_status 
  USING status::public.attendance_status;

-- 8. Add new unique constraint
ALTER TABLE public.attendance 
  ADD CONSTRAINT attendance_student_id_session_id_key 
  UNIQUE (student_id, session_id);

-- 9. Drop old columns
ALTER TABLE public.attendance DROP COLUMN IF EXISTS date;
ALTER TABLE public.attendance DROP COLUMN IF EXISTS module_id;

-- 10. Enforce NOT NULL on session_id
ALTER TABLE public.attendance ALTER COLUMN session_id SET NOT NULL;

-- 11. RLS policies for sessions
CREATE POLICY "Everyone can view sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lecturers can create sessions"
  ON public.sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    (created_by = auth.uid() AND public.has_role(auth.uid(), 'lecturer'))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update sessions"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sessions"
  ON public.sessions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 12. Drop old attendance policies and replace
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Lecturers and students can mark attendance" ON public.attendance;
DROP POLICY IF EXISTS "Lecturers and admins can mark attendance" ON public.attendance;
DROP POLICY IF EXISTS "Lecturers can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can delete attendance" ON public.attendance;

CREATE POLICY "Students can view their own attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.has_role(auth.uid(), 'lecturer')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Lecturers and admins can mark attendance"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      public.has_role(auth.uid(), 'lecturer')
      AND EXISTS (
        SELECT 1 FROM public.sessions s
        JOIN public.modules m ON s.module_id = m.id
        WHERE s.id = session_id AND m.lecturer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Lecturers and admins can update attendance"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      public.has_role(auth.uid(), 'lecturer')
      AND EXISTS (
        SELECT 1 FROM public.sessions s
        JOIN public.modules m ON s.module_id = m.id
        WHERE s.id = session_id AND m.lecturer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can delete attendance"
  ON public.attendance FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
