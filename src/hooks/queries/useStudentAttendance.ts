import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { AttendanceRecord } from '@/types';

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
        .select('*')
        .eq('student_id', studentId);

      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!studentId,
  });
}
