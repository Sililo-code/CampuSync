import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { AttendanceAuditRecord } from '@/types';
import { AttendanceStatus } from '@/lib/constants';

/**
 * Hook to fetch all attendance audit logs for administrators.
 */
export function useAttendanceAudit() {
  return useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE_AUDIT],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_audit')
        .select(`
          id,
          attendance_id,
          changed_by,
          changed_at,
          old_status,
          new_status,
          change_type,
          profiles!attendance_audit_changed_by_fkey (
            full_name,
            email
          ),
          attendance (
            student_id,
            profiles!attendance_student_id_fkey (
              full_name,
              email
            ),
            sessions (
              session_date,
              session_number,
              modules (
                code,
                name
              )
            )
          )
        `)
        .order('changed_at', { ascending: false });

      if (error) throw error;

      interface RawAuditRow {
        id: string;
        attendance_id: string;
        changed_by: string;
        changed_at: string;
        old_status: AttendanceStatus | null;
        new_status: AttendanceStatus;
        change_type: string;
        profiles: {
          full_name: string;
          email: string;
        } | null;
        attendance: {
          student_id: string;
          profiles: {
            full_name: string;
            email: string;
          } | null;
          sessions: {
            session_date: string;
            session_number: number;
            modules: {
              code: string;
              name: string;
            } | null;
          } | null;
        } | null;
      }

      const rawRows = (data ?? []) as unknown as RawAuditRow[];

      return rawRows.map((row): AttendanceAuditRecord => ({
        id: row.id,
        attendance_id: row.attendance_id,
        changed_by: row.changed_by,
        changed_at: row.changed_at,
        old_status: row.old_status,
        new_status: row.new_status,
        change_type: row.change_type,
        profiles: row.profiles ? {
          full_name: row.profiles.full_name,
          email: row.profiles.email,
        } : null,
        attendance: row.attendance ? {
          student_id: row.attendance.student_id,
          profiles: row.attendance.profiles ? {
            full_name: row.attendance.profiles.full_name,
            email: row.attendance.profiles.email,
          } : null,
          sessions: row.attendance.sessions ? {
            session_date: row.attendance.sessions.session_date,
            session_number: row.attendance.sessions.session_number,
            modules: row.attendance.sessions.modules ? {
              code: row.attendance.sessions.modules.code,
              name: row.attendance.sessions.modules.name,
            } : null,
          } : null,
        } : null,
      }));
    },
  });
}

