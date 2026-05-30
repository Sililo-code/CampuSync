import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Clock, TrendingUp, Users } from 'lucide-react';

interface AttendanceAnalyticsProps {
  moduleId?: string;
  studentId?: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  percentage: number;
}

export default function AttendanceAnalytics({ moduleId, studentId }: AttendanceAnalyticsProps) {
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceStats();
  }, [moduleId, studentId]);

  const fetchAttendanceStats = async () => {
    let query = supabase.from('attendance').select('status');

    if (moduleId) {
      query = query.eq('module_id', moduleId);
    }

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching attendance stats:', error);
      setLoading(false);
      return;
    }

    const total = data?.length || 0;
    const present = data?.filter(a => a.status === 'present').length || 0;
    const late = data?.filter(a => a.status === 'late').length || 0;
    const absent = data?.filter(a => a.status === 'absent').length || 0;
    const percentage = total > 0 ? ((present + late) / total) * 100 : 0;

    setStats({ total, present, late, absent, percentage });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
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
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.late}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.absent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Overall Attendance Rate
          </CardTitle>
          <CardDescription>
            Percentage of classes attended (present + late)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Attendance Rate</span>
              <span className="font-bold">{stats.percentage.toFixed(1)}%</span>
            </div>
            <Progress value={stats.percentage} className="h-3" />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t">
            <div>
              <div className="text-2xl font-bold text-secondary">{stats.present}</div>
              <div className="text-xs text-muted-foreground">Present</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">{stats.late}</div>
              <div className="text-xs text-muted-foreground">Late</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">{stats.absent}</div>
              <div className="text-xs text-muted-foreground">Absent</div>
            </div>
          </div>
          {stats.percentage < 75 && stats.total > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-4">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Warning: Attendance below 75%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum attendance requirement may not be met
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
