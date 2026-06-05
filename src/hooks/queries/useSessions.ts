import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { Session } from '@/types';

/**
 * Hook to fetch all sessions for a specific module.
 */
export function useSessions(moduleId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.SESSIONS, moduleId],
    queryFn: async () => {
      if (!moduleId) return [];

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('module_id', moduleId)
        .order('session_number', { ascending: true });

      if (error) throw error;
      return data as Session[];
    },
    enabled: !!moduleId,
  });
}
