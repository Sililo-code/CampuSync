-- Drop the existing attendance insertion policy
DROP POLICY IF EXISTS "Lecturers and students can mark attendance" ON public.attendance;

-- Create a new policy that only permits lecturers and admins to insert attendance records
-- Students are no longer permitted to mark their own attendance
CREATE POLICY "Lecturers and admins can mark attendance"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'lecturer')
    OR public.has_role(auth.uid(), 'admin')
  );
