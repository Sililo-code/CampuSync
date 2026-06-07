import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, XCircle, Clock, BookOpen } from 'lucide-react';
import { useStudentAttendance } from '@/hooks/queries/useStudentAttendance';
import { useModules } from '@/hooks/queries/useModules';
import { ATTENDANCE_STATUS } from '@/lib/constants';

export default function StudentDashboard() {
  const { user } = useAuth();
  
  // Use Phase 2 hooks for data fetching
  // Note: useModules is used for the modules list as per instructions
  const { data: modules = [], isLoading: isModulesLoading } = useModules();
  const { data: attendance = [], isLoading: isAttendanceLoading } = useStudentAttendance(user?.id);

  // Combine loading states from hooks
  const isLoading = isModulesLoading || isAttendanceLoading;

  const getAttendanceStats = () => {
    const total = attendance.length;
    const present = attendance.filter((a) => a.status === ATTENDANCE_STATUS.PRESENT).length;
    const late = attendance.filter((a) => a.status === ATTENDANCE_STATUS.LATE).length;
    const percentage = total > 0 ? ((present + late) / total) * 100 : 0;

    return { total, present, late, percentage };
  };

  const stats = getAttendanceStats();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case ATTENDANCE_STATUS.PRESENT:
        return <CheckCircle2 className="w-4 h-4 text-secondary" />;
      case ATTENDANCE_STATUS.LATE:
        return <Clock className="w-4 h-4 text-accent" />;
      case ATTENDANCE_STATUS.ABSENT:
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.present}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.late}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.percentage.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Modules</CardTitle>
            <CardDescription>View your enrolled modules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  You are not enrolled in any modules yet
                </p>
              ) : (
                modules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    <div>
                      <p className="font-semibold">{module.code}</p>
                      <p className="text-sm text-muted-foreground">{module.name}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Your attendance history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No attendance records yet
                </p>
              ) : (
                attendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(record.status)}
                      <div>
                        {/* Traverse Phase 1 schema: attendance -> sessions -> modules */}
                        <p className="text-sm font-medium">{record.sessions.modules.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.sessions.session_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        record.status === ATTENDANCE_STATUS.PRESENT
                          ? 'default'
                          : record.status === ATTENDANCE_STATUS.LATE
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {record.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
