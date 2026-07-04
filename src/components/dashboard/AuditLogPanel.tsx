import { useAttendanceAudit } from '@/hooks/queries/useAttendanceAudit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { History, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export function AuditLogPanel() {
  const { data: logs = [], isLoading } = useAttendanceAudit();

  const getStatusBadgeColor = (status: string | null) => {
    if (!status) return 'bg-muted text-muted-foreground hover:bg-muted';
    switch (status.toLowerCase()) {
      case 'present':
        return 'bg-secondary/15 text-secondary border-0 font-bold hover:bg-secondary/25';
      case 'late':
        return 'bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-0 font-bold hover:bg-[hsl(var(--warning))]/25';
      case 'absent':
        return 'bg-destructive/15 text-destructive border-0 font-bold hover:bg-destructive/25';
      default:
        return 'bg-muted text-muted-foreground hover:bg-muted';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Attendance Audit Log</CardTitle>
          <CardDescription>System-wide record of attendance changes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border rounded-xl shadow-sm overflow-hidden">
      <CardHeader>
        <CardTitle>Attendance Audit Log</CardTitle>
        <CardDescription>System-wide record of attendance changes</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-muted rounded-xl bg-muted/20 m-6">
            <History className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-semibold text-foreground">No audit logs found</p>
            <p className="text-xs text-muted-foreground mt-1">Changes to attendance records will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Timestamp</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead className="pr-6 text-right">Change Details</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
            <div className="overflow-y-auto max-h-[280px]" style={{ scrollBehavior: 'smooth' }}>
              <Table>
                <TableBody>
                  {logs.map((log) => {
                    const session = log.attendance?.sessions;
                    const module = session?.modules;
                    const student = log.attendance?.profiles;
                    const editor = log.profiles;

                    const formattedDate = session?.session_date
                      ? format(new Date(session.session_date), 'MMM dd')
                      : '—';

                    return (
                      <TableRow key={log.id} className="hover:bg-muted/5 transition-colors">
                        <TableCell className="pl-6 font-medium text-xs text-muted-foreground">
                          {format(new Date(log.changed_at), 'Pp')}
                        </TableCell>
                        <TableCell className="font-bold text-xs">
                          {module?.code ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs">
                          Session #{session?.session_number ?? '—'} ({formattedDate})
                        </TableCell>
                        <TableCell className="font-semibold text-xs">
                          {student?.full_name ?? '—'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {editor?.full_name ?? '—'}
                        </TableCell>
                        <TableCell className="pr-6 text-right text-xs">
                          <div className="flex items-center justify-end gap-1.5">
                            {log.change_type === 'insert' ? (
                              <>
                                <Badge className="bg-muted text-muted-foreground border-0 text-[10px] font-bold px-2 py-0.5">
                                  initial
                                </Badge>
                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                                <Badge className={`${getStatusBadgeColor(log.new_status)} text-[10px] px-2 py-0.5`}>
                                  {log.new_status}
                                </Badge>
                              </>
                            ) : (
                              <>
                                <Badge className={`${getStatusBadgeColor(log.old_status)} text-[10px] px-2 py-0.5`}>
                                  {log.old_status}
                                </Badge>
                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                                <Badge className={`${getStatusBadgeColor(log.new_status)} text-[10px] px-2 py-0.5`}>
                                  {log.new_status}
                                </Badge>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
