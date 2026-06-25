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
  confirmOverwrite?: boolean;
}

/**
 * Hook to mark attendance for multiple students in a session at once.
 */
export function useMarkBatchAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, records, confirmOverwrite = false }: MarkBatchAttendanceParams) => {
      if (!confirmOverwrite) {
        const { data: existingRecords, error: checkError } = await supabase
          .from('attendance')
          .select('id')
          .eq('session_id', sessionId)
          .limit(1);

        if (checkError) throw checkError;

        if (existingRecords && existingRecords.length > 0) {
          throw new Error('ATTENDANCE_ALREADY_RECORDED');
        }
      }

      const { data, error } = await supabase
        .from('attendance')
        .upsert(
          records.map(record => ({
            session_id: sessionId,
            student_id: record.studentId,
            status: record.status,
            marked_by: record.markedBy,
            marked_at: new Date().toISOString(),
          })),
          { onConflict: 'student_id,session_id' }
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
