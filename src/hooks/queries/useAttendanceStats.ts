import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { AttendanceStats } from '@/types';
import { ATTENDANCE_STATUS } from '@/lib/constants';

/**
 * Hook to compute attendance statistics for a student within a module.
 */
export function useAttendanceStats(studentId?: string, moduleId?: string, threshold: number = 80) {
  return useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE_STATS, studentId, moduleId],
    queryFn: async () => {
      if (!studentId || !moduleId) return null;

      // Get all sessions for this module
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id')
        .eq('module_id', moduleId);

      if (sessionsError) throw sessionsError;

      const sessionIds = sessions.map(s => s.id);
      if (sessionIds.length === 0) {
        return {
          total: 0,
          present: 0,
          late: 0,
          absent: 0,
          percentage: 100,
          isAtRisk: false,
          absencesRemaining: Math.floor(0 * (1 - threshold / 100)),
        } as AttendanceStats;
      }

      // Get student's attendance for these sessions
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', studentId)
        .in('session_id', sessionIds);

      if (attendanceError) throw attendanceError;

      const total = sessionIds.length;
      const present = attendance.filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length;
      const late = attendance.filter(a => a.status === ATTENDANCE_STATUS.LATE).length;
      const absent = attendance.filter(a => a.status === ATTENDANCE_STATUS.ABSENT).length;
      
      // Percentage calculation: (Present + Late) / Total
      // Note: CUZ policy might vary, but typically Late counts as participation.
      const percentage = total > 0 ? ((present + late) / total) * 100 : 100;
      const isAtRisk = percentage < threshold;
      
      // Absences remaining: how many more sessions can they miss before falling below threshold?
      // Calculation: Max absences = Floor(Total * (1 - Threshold/100))
      const maxAbsences = Math.floor(total * (1 - threshold / 100));
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
    enabled: !!studentId && !!moduleId,
  });
}
