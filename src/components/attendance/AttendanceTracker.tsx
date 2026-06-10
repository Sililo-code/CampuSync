import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useEnrolledStudents } from '@/hooks/queries/useEnrolledStudents';
import { useSessions } from '@/hooks/queries/useSessions';
import { useCreateSession } from '@/hooks/queries/useCreateSession';
import { useMarkBatchAttendance } from '@/hooks/queries/useMarkBatchAttendance';
import { useAttendance } from '@/hooks/queries/useAttendance';
import { useAtRiskStudents } from '@/hooks/queries/useAtRiskStudents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Clock, Calendar, Plus, Save, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSessionSchema, CreateSessionFormValues } from '@/schemas';
import { ATTENDANCE_STATUS, ATTENDANCE_THRESHOLD_DEFAULT, AttendanceStatus } from '@/lib/constants';

interface AttendanceTrackerProps {
  moduleId: string;
}

interface MarkRosterItem {
  studentId: string;
  fullName: string;
  status: AttendanceStatus;
}

export default function AttendanceTracker({ moduleId }: AttendanceTrackerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [markRoster, setMarkRoster] = useState<MarkRosterItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Queries
  const { data: students = [], isLoading: loadingStudents } = useEnrolledStudents(moduleId);
  const { data: sessions = [], isLoading: loadingSessions } = useSessions(moduleId);
  const { data: sessionAttendance = [], isLoading: loadingAttendance } = useAttendance(activeSessionId);
  const { data: atRiskStudents = [] } = useAtRiskStudents(moduleId);

  // Mutations
  const createSession = useCreateSession();
  const markBatchAttendance = useMarkBatchAttendance();

  // Session form
  const form = useForm<CreateSessionFormValues>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      moduleId: moduleId,
      sessionDate: new Date().toISOString().split('T')[0],
      sessionNumber: sessions.length + 1,
      startTime: format(new Date(), 'HH:mm'),
      topic: '',
    },
  });

  // Reset form when sessions count changes
  useEffect(() => {
    form.setValue('sessionNumber', sessions.length + 1);
  }, [sessions.length, form]);

  // Initialize roster when students are loaded and no attendance exists for active session
  useEffect(() => {
    if (activeSessionId && students.length > 0 && sessionAttendance.length === 0) {
      setMarkRoster(
        students.map((student) => ({
          studentId: student.id,
          fullName: student.full_name,
          status: ATTENDANCE_STATUS.PRESENT,
        }))
      );
    } else {
      setMarkRoster([]);
    }
  }, [activeSessionId, students, sessionAttendance.length]);

  const handleCreateSession = async (values: CreateSessionFormValues) => {
    if (!user) return;

    try {
      const newSession = await createSession.mutateAsync({
        ...values,
        createdBy: user.id,
      });
      setActiveSessionId(newSession.id);
      setDialogOpen(false);
      form.reset();
      toast({
        title: 'Session created',
        description: `Session ${values.sessionNumber} has been created successfully.`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: 'Error creating session',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setMarkRoster((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, status } : item))
    );
  };

  const handleSubmitAttendance = async () => {
    if (!user || !activeSessionId) return;

    try {
      await markBatchAttendance.mutateAsync({
        sessionId: activeSessionId,
        moduleId: moduleId,
        records: markRoster.map((item) => ({
          studentId: item.studentId,
          status: item.status,
          markedBy: user.id,
        })),
      });

      toast({
        title: 'Attendance submitted',
        description: `Attendance for ${markRoster.length} students has been recorded.`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: 'Error submitting attendance',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      [ATTENDANCE_STATUS.PRESENT]: { variant: 'default' as const, icon: CheckCircle2, color: 'text-secondary-foreground' },
      [ATTENDANCE_STATUS.LATE]: { variant: 'secondary' as const, icon: Clock, color: 'text-accent-foreground' },
      [ATTENDANCE_STATUS.ABSENT]: { variant: 'destructive' as const, icon: XCircle, color: 'text-destructive-foreground' },
    };

    const config = variants[status as keyof typeof variants] || variants[ATTENDANCE_STATUS.ABSENT];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const isAtRisk = (studentId: string) => {
    return atRiskStudents.some((s) => s.id === studentId);
  };

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.full_name || 'Unknown Student';
  };

  if (loadingStudents || loadingSessions) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold">Attendance Marking</h3>
          <p className="text-sm text-muted-foreground">Select a session or create a new one to mark attendance</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={activeSessionId} onValueChange={setActiveSessionId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  Session {session.session_number} ({format(new Date(session.session_date), 'MMM dd')})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Teaching Session</DialogTitle>
                <DialogDescription>Define the session details before marking attendance</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateSession)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="sessionNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Number</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sessionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Introduction to SQL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createSession.isPending}>
                    {createSession.isPending ? 'Creating...' : 'Create Session'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!activeSessionId ? (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
            <h4 className="text-lg font-medium">No Session Selected</h4>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Please select an existing session from the dropdown or create a new one to start tracking attendance.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {loadingAttendance ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessionAttendance.length > 0 ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Attendance Records</CardTitle>
                  <CardDescription>Records for Session {sessions.find(s => s.id === activeSessionId)?.session_number}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Marked
                </Badge>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionAttendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {getStudentName(record.student_id)}
                          {isAtRisk(record.student_id) && (
                            <Badge variant="destructive" className="ml-2 text-[10px] py-0 h-4">At Risk</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="bg-primary/5 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Mark Batch Attendance</CardTitle>
                    <CardDescription>Recording participation for Session {sessions.find(s => s.id === activeSessionId)?.session_number}</CardDescription>
                  </div>
                  <Button 
                    onClick={handleSubmitAttendance} 
                    disabled={markBatchAttendance.isPending || markRoster.length === 0}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {markBatchAttendance.isPending ? 'Saving...' : 'Submit Attendance'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Student Name</TableHead>
                      <TableHead className="text-center w-[300px]">Attendance Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {markRoster.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                          No students enrolled in this module
                        </TableCell>
                      </TableRow>
                    ) : (
                      markRoster.map((item) => (
                        <TableRow key={item.studentId}>
                          <TableCell className="pl-6 font-medium">
                            <div className="flex items-center gap-2">
                              {item.fullName}
                              {isAtRisk(item.studentId) && (
                                <Badge variant="destructive" className="text-[10px] py-0 h-4">
                                  <AlertTriangle className="w-2 h-2 mr-1" /> At Risk
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center p-2">
                            <div className="flex justify-center gap-1">
                              <Button
                                size="sm"
                                variant={item.status === ATTENDANCE_STATUS.PRESENT ? 'default' : 'outline'}
                                className={item.status === ATTENDANCE_STATUS.PRESENT ? 'bg-secondary hover:bg-secondary/90' : ''}
                                onClick={() => handleStatusChange(item.studentId, ATTENDANCE_STATUS.PRESENT)}
                              >
                                Present
                              </Button>
                              <Button
                                size="sm"
                                variant={item.status === ATTENDANCE_STATUS.LATE ? 'default' : 'outline'}
                                className={item.status === ATTENDANCE_STATUS.LATE ? 'bg-accent hover:bg-accent/90' : ''}
                                onClick={() => handleStatusChange(item.studentId, ATTENDANCE_STATUS.LATE)}
                              >
                                Late
                              </Button>
                              <Button
                                size="sm"
                                variant={item.status === ATTENDANCE_STATUS.ABSENT ? 'default' : 'outline'}
                                className={item.status === ATTENDANCE_STATUS.ABSENT ? 'bg-destructive hover:bg-destructive/90' : ''}
                                onClick={() => handleStatusChange(item.studentId, ATTENDANCE_STATUS.ABSENT)}
                              >
                                Absent
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>Overview of all recorded sessions for this module</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                    No sessions created yet
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id} className={activeSessionId === session.id ? 'bg-muted/50' : ''}>
                    <TableCell className="font-bold">#{session.session_number}</TableCell>
                    <TableCell>{format(new Date(session.session_date), 'PPP')}</TableCell>
                    <TableCell className="italic text-muted-foreground">{session.topic || 'No topic set'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setActiveSessionId(session.id)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
