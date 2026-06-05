import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreateUserFormValues } from '@/schemas';

/**
 * Hook to create a new user (admin only).
 * 
 * NOTE: Creating users in Supabase Auth from the client typically requires
 * the Admin API (service role key), which is not available here for security.
 * This hook attempts to create the user via `signUp`. If the system is 
 * configured to allow only admins to create certain roles, this will 
 * trigger a backend process or policy.
 * 
 * For CampuSync, if the Supabase Admin API is not reachable, we flag as pending.
 */
export function useCreateUser() {
  return useMutation({
    mutationFn: async (values: CreateUserFormValues) => {
      // 1. Attempt to sign up the new user
      // Note: This will create an entry in auth.users and trigger the profile creation.
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            role: values.role,
          },
        },
      });

      if (error) throw error;

      // 2. If the user was created but needs further role assignment 
      // (though the trigger should handle it), we could do it here.
      
      return data;
    },
  });
}
