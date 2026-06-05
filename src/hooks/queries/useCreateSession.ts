import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { CreateSessionFormValues } from '@/schemas';

/**
 * Hook to create a new teaching session.
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: CreateSessionFormValues & { createdBy: string }) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          module_id: values.moduleId,
          session_date: values.sessionDate,
          session_number: values.sessionNumber,
          start_time: values.startTime,
          topic: values.topic,
          created_by: values.createdBy,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SESSIONS, variables.moduleId] });
    },
  });
}
