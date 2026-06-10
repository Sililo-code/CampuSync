import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { Profile } from '@/types';
import { UserRole } from '@/lib/constants';

/**
 * Hook to fetch multiple user profiles, optionally filtered by role.
 */
export function useProfiles(role?: UserRole) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROFILES, role],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (role) {
        query = query.eq('role', role);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Profile[];
    },
  });
}
