import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { UpdateModuleThresholdFormValues } from '@/schemas';

/**
 * Mutation hook to update a module's attendance threshold.
 */
export function useUpdateModule(moduleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: UpdateModuleThresholdFormValues) => {
      const { data, error } = await supabase
        .from('modules')
        .update({
          attendance_threshold: values.attendanceThreshold,
          updated_at: new Date().toISOString(),
        })
        .eq('id', moduleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all queries that depend on module configuration
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MODULES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MODULE, moduleId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_STATS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AT_RISK_STUDENTS] });
    },
  });
}
