import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { Module } from '@/types';

/**
 * Hook to fetch all modules accessible to the current user.
 * RLS on the database handles the role-based filtering.
 */
export function useModules() {
  return useQuery({
    queryKey: [QUERY_KEYS.MODULES],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;
      return data as Module[];
    },
  });
}
