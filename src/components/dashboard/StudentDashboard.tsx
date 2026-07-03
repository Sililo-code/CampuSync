import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, BookOpen, Clock } from 'lucide-react';
import { useStudentAttendance } from '@/hooks/queries/useStudentAttendance';
import { useModules } from '@/hooks/queries/useModules';
import { MissedSessionsList } from './MissedSessionsList';
import { ATTENDANCE_STATUS, ATTENDANCE_THRESHOLD_DEFAULT } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const { data: modules = [], isLoading: isModulesLoading } = useModules();
  const { data: attendance = [], isLoading: isAttendanceLoading } = useStudentAttendance(user?.id);

  const isLoading = isModulesLoading || isAttendanceLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  // Derive stats
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student';
  
  const totalSessions = attendance.length;
  const presentCount = attendance.filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length;
  const lateCount = attendance.filter(a => a.status === ATTENDANCE_STATUS.LATE).length;
  const attendedCount = presentCount + lateCount;
  const overallRate = totalSessions > 0 ? (attendedCount / totalSessions) * 100 : 0;

  // Group attendance by module
  const moduleStats = modules.map(module => {
    const moduleAttendance = attendance.filter(a => a.sessions.modules.code === module.code);
    const mTotal = moduleAttendance.length;
    const mPresent = moduleAttendance.filter(a => a.status === ATTENDANCE_STATUS.PRESENT).length;
    const mLate = moduleAttendance.filter(a => a.status === ATTENDANCE_STATUS.LATE).length;
    const mAttended = mPresent + mLate;
    const mRate = mTotal > 0 ? (mAttended / mTotal) * 100 : 100; // Default to 100 if no sessions yet
    
    // Use module specific threshold with global fallback
    const moduleThreshold = module.attendance_threshold ?? ATTENDANCE_THRESHOLD_DEFAULT;
    
    return {
      ...module,
      total: mTotal,
      attended: mAttended,
      rate: mRate,
      isAtRisk: mTotal > 0 && mRate < moduleThreshold
    };
  });

  const atRiskModules = moduleStats.filter(m => m.isAtRisk);
  // Overall compliance is true if no module is at risk
  const isOverallCompliant = atRiskModules.length === 0;

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Greeting Hero */}
      <div className="bg-primary rounded-xl px-6 py-5 flex items-center justify-between shadow-lg shadow-primary/10">
        <div className="space-y-1">
          <h1 className="text-white text-xl font-bold">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {firstName}
          </h1>
          <p className="text-white/55 text-xs font-medium">
            {format(new Date(), 'EEEE, dd MMMM yyyy')}
          </p>
        </div>
        <div className={`text-xs font-semibold px-3 py-1 rounded-full border ${
          isOverallCompliant 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        }`}>
          {isOverallCompliant ? 'Compliant' : 'At Risk'}
        </div>
      </div>

      {/* At-Risk Banner */}
      {atRiskModules.length > 0 && (
        <div className="bg-[hsl(var(--warning))]/[0.08] border border-[hsl(var(--warning))]/25 rounded-lg px-4 py-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="text-[hsl(var(--warning))] w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="text-sm space-y-1">
            {atRiskModules.map(m => (
              <p key={m.id} className="text-foreground/80">
                <span className="font-bold text-foreground">{m.code}</span> is at risk — <span className="font-bold text-[hsl(var(--warning))]">{m.rate.toFixed(1)}%</span> attendance, below the {m.attendance_threshold ?? ATTENDANCE_THRESHOLD_DEFAULT}% required threshold.
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { 
            label: 'Total Sessions', 
            value: totalSessions, 
            sub: `Across ${modules.length} modules`,
            color: 'text-foreground'
          },
          { 
            label: 'Present', 
            value: presentCount, 
            sub: 'On-time attendance',
            color: 'text-secondary' 
          },
          { 
            label: 'Late', 
            value: lateCount, 
            sub: 'Counts toward rate',
            color: 'text-[hsl(var(--warning))]' 
          },
          { 
            label: 'Overall Rate', 
            value: `${overallRate.toFixed(1)}%`, 
            sub: `Threshold: ${ATTENDANCE_THRESHOLD_DEFAULT}%`,
            color: isOverallCompliant ? 'text-secondary' : 'text-[hsl(var(--warning))]'
          }
        ].map((stat, i) => (
          <Card key={i} className="bg-card border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-1 block">
                {stat.label}
              </span>
              <div>
                <span className={`text-3xl font-bold leading-none ${stat.color}`}>
                  {stat.value}
                </span>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {stat.sub}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Module Breakdown */}
        <Card className="border-border rounded-xl shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Module breakdown</h3>
            <div className="space-y-5">
              {modules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-xl bg-muted/20">
                  <BookOpen className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <h4 className="text-sm font-semibold text-foreground/60">No modules enrolled yet</h4>
                  <p className="text-xs text-muted-foreground">Contact your administrator for enrolment</p>
                </div>
              ) : (
                moduleStats.map(m => {
                  const moduleThreshold = m.attendance_threshold ?? ATTENDANCE_THRESHOLD_DEFAULT;
                  const rateColorText = m.rate >= moduleThreshold 
                    ? 'text-secondary' 
                    : m.rate >= 60 
                    ? 'text-[hsl(var(--warning))]' 
                    : 'text-destructive';
                  
                  const rateColorBg = m.rate >= moduleThreshold 
                    ? 'bg-secondary' 
                    : m.rate >= 60 
                    ? 'bg-[hsl(var(--warning))]' 
                    : 'bg-destructive';
                  
                  return (
                    <div key={m.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 pr-4">
                          <span className="text-xs font-semibold text-foreground mr-2">{m.code}</span>
                          <span className="text-xs text-muted-foreground truncate">{m.name}</span>
                        </div>
                        <span className={`text-xs font-bold ${rateColorText}`}>
                          {m.rate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${rateColorBg}`}
                          style={{ width: `${m.rate}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {m.attended}/{m.total} sessions
                        </span>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${m.isAtRisk ? 'text-[hsl(var(--warning))]' : 'text-secondary'}`}>
                          {m.isAtRisk ? 'At Risk' : m.total > 0 ? 'Compliant' : 'No Data'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="border-border rounded-xl shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Recent sessions</h3>
            <div className="space-y-3">
              {attendance.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-xl bg-muted/20">
                  <Clock className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <h4 className="text-sm font-semibold text-foreground/60">No attendance records yet</h4>
                  <p className="text-xs text-muted-foreground">Your recent session history will appear here</p>
                </div>
              ) : (
                [...attendance]
                  .sort((a, b) => new Date(b.sessions.session_date).getTime() - new Date(a.sessions.session_date).getTime())
                  .slice(0, 10)
                  .map(record => {
                  const statusConfig = {
                    [ATTENDANCE_STATUS.PRESENT]: { dot: 'bg-secondary', badge: 'bg-secondary/10 text-secondary' },
                    [ATTENDANCE_STATUS.LATE]: { dot: 'bg-[hsl(var(--warning))]', badge: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]' },
                    [ATTENDANCE_STATUS.ABSENT]: { dot: 'bg-destructive', badge: 'bg-destructive/10 text-destructive' }
                  };
                  const config = statusConfig[record.status as keyof typeof statusConfig];

                  return (
                    <div key={record.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-accent/5 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground">{record.sessions.modules.code}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(record.sessions.session_date), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </div>
                      <Badge className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border-0 ${config.badge} shadow-none`}>
                        {record.status.toUpperCase()}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missed Sessions List */}
      <MissedSessionsList attendance={attendance} modules={modules} />
    </div>
  );
}
