import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { AttendanceStatus } from '@/lib/constants';

interface UpdateAttendanceParams {
  id: string;
  sessionId: string;
  moduleId: string; // Used for invalidation
  status: AttendanceStatus;
  markedBy: string;
}

/**
 * Hook to update an existing attendance record.
 */
export function useUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, markedBy }: UpdateAttendanceParams) => {
      const { data, error } = await supabase
        .from('attendance')
        .update({
          status,
          marked_by: markedBy,
          marked_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

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
