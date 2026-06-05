import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { Profile } from '@/types';

/**
 * Hook to fetch all students enrolled in a specific module.
 */
export function useEnrolledStudents(moduleId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.ENROLLED_STUDENTS, moduleId],
    queryFn: async () => {
      if (!moduleId) return [];

      const { data, error } = await supabase
        .from('student_modules')
        .select(`
          profiles (
            id,
            email,
            full_name,
            role,
            created_at,
            updated_at
          )
        `)
        .eq('module_id', moduleId);

      if (error) throw error;
      
      // Flatten the result to return an array of Profiles
      return (data as unknown as { profiles: Profile }[]).map((item) => item.profiles);
    },
    enabled: !!moduleId,
  });
}
