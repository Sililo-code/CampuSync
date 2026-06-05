import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from './keys';
import { StudentWithStats } from '@/types';
import { ATTENDANCE_THRESHOLD_DEFAULT, ATTENDANCE_STATUS } from '@/lib/constants';

/**
 * Hook to fetch all students below the attendance threshold for a specific module.
 */
export function useAtRiskStudents(moduleId?: string, threshold: number = ATTENDANCE_THRESHOLD_DEFAULT) {
  return useQuery({
    queryKey: [QUERY_KEYS.AT_RISK_STUDENTS, moduleId, threshold],
    queryFn: async () => {
      if (!moduleId) return [];

      // 1. Get all students enrolled in the module
      const { data: enrolled, error: enrolledError } = await supabase
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

      if (enrolledError) throw enrolledError;
      const students = (enrolled as unknown as { profiles: Profile }[]).map((item) => item.profiles);

      // 2. Get all sessions for this module
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id')
        .eq('module_id', moduleId);

      if (sessionsError) throw sessionsError;
      const sessionIds = sessions.map(s => s.id);

      if (sessionIds.length === 0) return [];

      // 3. Get all attendance records for these sessions
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, status')
        .in('session_id', sessionIds);

      if (attendanceError) throw attendanceError;

      // 4. Compute stats per student and filter those below threshold
      const totalSessions = sessionIds.length;
      const atRiskStudents: StudentWithStats[] = [];

      students.forEach(student => {
        const studentAttendance = attendance.filter(a => a.student_id === student.id);
        const present = studentAttendance.filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length;
        const late = studentAttendance.filter(a => a.status === ATTENDANCE_STATUS.LATE).length;
        const absent = studentAttendance.filter(a => a.status === ATTENDANCE_STATUS.ABSENT).length;
        
        const percentage = totalSessions > 0 ? ((present + late) / totalSessions) * 100 : 100;
        
        if (percentage < threshold) {
          const maxAbsences = Math.floor(totalSessions * (1 - threshold / 100));
          const absencesRemaining = Math.max(0, maxAbsences - absent);

          atRiskStudents.push({
            ...student,
            stats: {
              total: totalSessions,
              present,
              late,
              absent,
              percentage,
              isAtRisk: true,
              absencesRemaining,
            }
          });
        }
      });

      return atRiskStudents;
    },
    enabled: !!moduleId,
  });
}
