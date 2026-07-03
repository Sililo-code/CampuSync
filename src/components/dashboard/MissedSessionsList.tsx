import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AttendanceWithModule, Module } from '@/types';
import { ATTENDANCE_STATUS } from '@/lib/constants';
import { AlertTriangle, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface MissedSessionsListProps {
  attendance: AttendanceWithModule[];
  modules: Module[];
}

export function MissedSessionsList({ attendance, modules }: MissedSessionsListProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('all');

  // Filter for absent or late sessions only
  const missedRecords = useMemo(() => {
    return attendance.filter(
      (a) => a.status === ATTENDANCE_STATUS.ABSENT || a.status === ATTENDANCE_STATUS.LATE
    );
  }, [attendance]);

  // Apply module filter and sort by session date descending
  const filteredRecords = useMemo(() => {
    let result = missedRecords;
    if (selectedModuleId !== 'all') {
      result = result.filter((a) => a.sessions.modules.id === selectedModuleId);
    }
    return [...result].sort(
      (a, b) => new Date(b.sessions.session_date).getTime() - new Date(a.sessions.session_date).getTime()
    );
  }, [missedRecords, selectedModuleId]);

  return (
    <Card className="border-border rounded-xl shadow-sm overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border bg-card">
        <div>
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" />
            Sessions Missed
          </CardTitle>
          <CardDescription className="text-xs">
            Review all sessions where you were marked absent or late.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            className="flex h-8 w-[180px] rounded-md border border-input bg-background px-2.5 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Modules</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-muted rounded-xl bg-muted/20 m-6">
            <Calendar className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-semibold text-foreground">No missed sessions</p>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedModuleId === 'all'
                ? 'You have maintained 100% compliance with no absences or lates!'
                : 'You have no absences or lates recorded for this module.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead className="pr-6 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => {
                const session = record.sessions;
                const module = session.modules;

                const isAbsent = record.status === ATTENDANCE_STATUS.ABSENT;

                return (
                  <TableRow key={record.id} className="hover:bg-muted/5 transition-colors">
                    <TableCell className="pl-6 font-semibold text-xs text-foreground">
                      {format(new Date(session.session_date), 'PPP')}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{module.code}</span>
                        <span className="text-[10px] text-muted-foreground">{module.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-muted-foreground">
                      Session #{session.session_number}
                    </TableCell>
                    <TableCell className="text-xs italic text-muted-foreground max-w-[200px] truncate">
                      {session.topic || 'No topic defined'}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {isAbsent ? (
                        <Badge className="bg-destructive/10 text-destructive border-0 text-[10px] font-bold px-2 py-0.5 shadow-none hover:bg-destructive/20">
                          ABSENT
                        </Badge>
                      ) : (
                        <Badge className="bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-0 text-[10px] font-bold px-2 py-0.5 shadow-none hover:bg-[hsl(var(--warning))]/20">
                          LATE
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
