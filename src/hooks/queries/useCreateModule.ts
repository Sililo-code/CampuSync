import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { CreateModuleFormValues } from '@/schemas';

/**
 * Hook to create a new academic module.
 */
export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: CreateModuleFormValues & { lecturerId?: string }) => {
      const { data, error } = await supabase
        .from('modules')
        .insert({
          code: values.code,
          name: values.name,
          description: values.description,
          attendance_threshold: values.attendanceThreshold,
          lecturer_id: values.lecturerId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MODULES] });
    },
  });
}
