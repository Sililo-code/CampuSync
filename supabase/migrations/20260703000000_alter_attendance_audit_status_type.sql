-- Migration: alter_attendance_audit_status_type
-- Alter old_status and new_status columns in public.attendance_audit to be of type attendance_status
-- and update trigger function log_attendance_change to avoid ::TEXT cast.

ALTER TABLE public.attendance_audit
  ALTER COLUMN old_status TYPE public.attendance_status USING old_status::public.attendance_status;

ALTER TABLE public.attendance_audit
  ALTER COLUMN new_status TYPE public.attendance_status USING new_status::public.attendance_status;

-- Update trigger function to remove now-unnecessary ::TEXT casts
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
      (NEW.id, NEW.marked_by, NULL, NEW.status, 'insert');

  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only log when the status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.attendance_audit
        (attendance_id, changed_by, old_status, new_status, change_type)
      VALUES
        (NEW.id, NEW.marked_by, OLD.status, NEW.status, 'update');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
