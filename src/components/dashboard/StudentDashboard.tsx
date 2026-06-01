import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CheckCircle2, XCircle, Clock, BookOpen } from 'lucide-react';

interface Module {
  id: string;
  code: string;
  name: string;
}

interface Attendance {
  id: string;
  date: string;
  status: string;
  modules: {
    code: string;
    name: string;
  };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
    fetchAttendance();
  }, [user]);

  const fetchModules = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('student_modules')
      .select(`
        module_id,
        modules (
          id,
          code,
          name
        )
      `)
      .eq('student_id', user.id);

    if (error) {
      toast({
        title: 'Error fetching modules',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const moduleList = (data as unknown as { modules: Module }[])?.map((item) => item.modules).filter(Boolean) || [];
    setModules(moduleList);
    setLoading(false);
  };

  const fetchAttendance = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        date,
        status,
        modules (
          code,
          name
        )
      `)
      .eq('student_id', user.id)
      .order('date', { ascending: false })
      .limit(50);

    if (error) {
      toast({
        title: 'Error fetching attendance',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setAttendance(data as unknown as Attendance[] || []);
  };

  const getAttendanceStats = () => {
    const total = attendance.length;
    const present = attendance.filter((a) => a.status === 'present').length;
    const late = attendance.filter((a) => a.status === 'late').length;
    const percentage = total > 0 ? ((present + late) / total) * 100 : 0;

    return { total, present, late, percentage };
  };

  const stats = getAttendanceStats();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="w-4 h-4 text-secondary" />;
      case 'late':
        return <Clock className="w-4 h-4 text-accent" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  if (loading) {
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
                        <p className="text-sm font-medium">{record.modules.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        record.status === 'present'
                          ? 'default'
                          : record.status === 'late'
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