import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { Profile } from '@/types';

/**
 * Fetches profiles whose email matches any value in the provided array.
 * Uses a single .in() query — never one request per email.
 * Returns an empty array when the email list is empty.
 */
export function useStudentsByEmail(emails: string[]) {
  const normalised = emails.map((e) => e.toLowerCase().trim());

  return useQuery<Profile[]>({
    queryKey: [QUERY_KEYS.STUDENTS_BY_EMAIL, normalised],
    queryFn: async () => {
      if (normalised.length === 0) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at, updated_at')
        .in('email', normalised);

      if (error) throw error;
      return (data ?? []) as Profile[];
    },
    enabled: normalised.length > 0,
  });
}
