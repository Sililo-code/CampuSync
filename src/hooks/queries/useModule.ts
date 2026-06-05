import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { Module } from '@/types';

/**
 * Hook to fetch a single module by ID.
 */
export function useModule(moduleId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.MODULE, moduleId],
    queryFn: async () => {
      if (!moduleId) return null;

      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single();

      if (error) throw error;
      return data as Module;
    },
    enabled: !!moduleId,
  });
}
