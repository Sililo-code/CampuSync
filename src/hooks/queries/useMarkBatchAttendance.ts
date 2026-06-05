import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { AttendanceStatus } from '@/lib/constants';

interface MarkBatchAttendanceParams {
  sessionId: string;
  moduleId: string; // Used for invalidation
  records: {
    studentId: string;
    status: AttendanceStatus;
    markedBy: string;
  }[];
}

/**
 * Hook to mark attendance for multiple students in a session at once.
 */
export function useMarkBatchAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, records }: MarkBatchAttendanceParams) => {
      const { data, error } = await supabase
        .from('attendance')
        .insert(
          records.map(record => ({
            session_id: sessionId,
            student_id: record.studentId,
            status: record.status,
            marked_by: record.markedBy,
            marked_at: new Date().toISOString(),
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE, variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_STATS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AT_RISK_STUDENTS, variables.moduleId] });
    },
  });
}
