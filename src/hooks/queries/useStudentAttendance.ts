import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { AttendanceWithModule } from '@/types';

/**
 * Hook to fetch all attendance records for a specific student.
 */
export function useStudentAttendance(studentId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.STUDENT_ATTENDANCE, studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          sessions (
            *,
            modules (*)
          )
        `)
        .eq('student_id', studentId)
        .order('marked_at', { ascending: false });

      if (error) throw error;
      return data as unknown as AttendanceWithModule[];
    },
    enabled: !!studentId,
  });
}
