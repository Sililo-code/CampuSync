import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';

interface EnrolStudentParams {
  studentId: string;
  moduleId: string;
}

/**
 * Hook to enrol a student into a module.
 */
export function useEnrolStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, moduleId }: EnrolStudentParams) => {
      const { data, error } = await supabase
        .from('student_modules')
        .insert({
          student_id: studentId,
          module_id: moduleId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ENROLLED_STUDENTS, variables.moduleId] });
    },
  });
}
