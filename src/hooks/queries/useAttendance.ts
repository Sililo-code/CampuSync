import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { AttendanceWithModule } from '@/types';

/**
 * Hook to fetch all attendance records for a specific session.
 */
export function useAttendance(sessionId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE, sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          sessions (
            *,
            modules (*)
          )
        `)
        .eq('session_id', sessionId);

      if (error) throw error;
      return data as unknown as AttendanceWithModule[];
    },
    enabled: !!sessionId,
  });
}
