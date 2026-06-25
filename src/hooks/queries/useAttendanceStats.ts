import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { AttendanceStats } from '@/types';
import { ATTENDANCE_STATUS, ATTENDANCE_THRESHOLD_DEFAULT } from '@/lib/constants';

/**
 * Hook to compute attendance statistics.
 * Can be scoped to:
 * 1. A specific student in a specific module (both provided)
 * 2. All attendance for a specific student (only studentId provided)
 * 3. All attendance for a specific module (only moduleId provided)
 * 4. System-wide attendance (neither provided)
 */
export function useAttendanceStats(studentId?: string, moduleId?: string, threshold?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE_STATS, studentId, moduleId, threshold],
    queryFn: async () => {
      // 1. Resolve Threshold
      let finalThreshold = threshold ?? ATTENDANCE_THRESHOLD_DEFAULT;
      
      if (moduleId && !threshold) {
        const { data: moduleData } = await supabase
          .from('modules')
          .select('attendance_threshold')
          .eq('id', moduleId)
          .single();
        
        if (moduleData?.attendance_threshold) {
          finalThreshold = moduleData.attendance_threshold;
        }
      }

      let query = supabase.from('attendance').select('status');

      // 1. Scoped to Module (either for one student or all students)
      if (moduleId) {
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('id')
          .eq('module_id', moduleId);

        if (sessionsError) throw sessionsError;
        const sessionIds = sessions.map((s) => s.id);

        if (sessionIds.length === 0) {
          return {
            total: 0,
            present: 0,
            late: 0,
            absent: 0,
            percentage: 100,
            isAtRisk: false,
            absencesRemaining: 0,
          } as AttendanceStats;
        }

        query = query.in('session_id', sessionIds);
      }

      // 2. Scoped to Student (either for one module or all modules)
      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data: attendance, error: attendanceError } = await query;
      if (attendanceError) throw attendanceError;

      // Calculate stats
      // If we are scoped to a module AND a student, total is the number of sessions
      // Otherwise, total is the number of attendance records we found
      let total = 0;
      if (moduleId && studentId) {
        // Fetch sessions count again to be accurate about "total expected"
        const { count, error: countError } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('module_id', moduleId);
        if (countError) throw countError;
        total = count || 0;
      } else {
        total = attendance.length;
      }

      const present = attendance.filter((a) => a.status === ATTENDANCE_STATUS.PRESENT).length;
      const late = attendance.filter((a) => a.status === ATTENDANCE_STATUS.LATE).length;
      const absent = attendance.filter((a) => a.status === ATTENDANCE_STATUS.ABSENT).length;

      const percentage = total > 0 ? ((present + late) / total) * 100 : 100;
      const isAtRisk = percentage < finalThreshold;

      const maxAbsences = Math.floor(total * (1 - finalThreshold / 100));
      const absencesRemaining = Math.max(0, maxAbsences - absent);

      return {
        total,
        present,
        late,
        absent,
        percentage,
        isAtRisk,
        absencesRemaining,
      } as AttendanceStats;
    },
    // Always enabled to allow global stats when no IDs are provided
    enabled: true,
  });
}
