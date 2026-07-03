-- Migration: attendance_audit_log
-- Creates the attendance_audit table, a SECURITY DEFINER trigger function,
-- and an admin-only RLS policy. Writes happen exclusively via the trigger —
-- no client-side INSERT/UPDATE/DELETE policies are granted.

-- Table
CREATE TABLE IF NOT EXISTS public.attendance_audit (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID       NOT NULL REFERENCES public.attendance(id) ON DELETE CASCADE,
  changed_by   UUID        NOT NULL REFERENCES public.profiles(id),
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  old_status   TEXT        NULL,
  new_status   TEXT        NOT NULL,
  change_type  TEXT        NOT NULL CHECK (change_type IN ('insert', 'update'))
);

-- Trigger function — SECURITY DEFINER so it can write to attendance_audit
-- regardless of the calling user's RLS permissions on that table.
CREATE OR REPLACE FUNCTION public.log_attendance_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.attendance_audit
      (attendance_id, changed_by, old_status, new_status, change_type)
    VALUES
      (NEW.id, NEW.marked_by, NULL, NEW.status::TEXT, 'insert');

  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only log when the status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.attendance_audit
        (attendance_id, changed_by, old_status, new_status, change_type)
      VALUES
        (NEW.id, NEW.marked_by, OLD.status::TEXT, NEW.status::TEXT, 'update');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to the attendance table
DROP TRIGGER IF EXISTS trg_attendance_audit ON public.attendance;
CREATE TRIGGER trg_attendance_audit
  AFTER INSERT OR UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.log_attendance_change();

-- Row-Level Security
ALTER TABLE public.attendance_audit ENABLE ROW LEVEL SECURITY;

-- Administrators can read all audit rows
CREATE POLICY "Admins can read attendance_audit"
  ON public.attendance_audit
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
-- No INSERT / UPDATE / DELETE client policies — trigger-only writes.
