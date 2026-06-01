import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ATTENDANCE_THRESHOLD_DEFAULT } from '@/lib/constants';

interface AttendanceTrackerProps {
  moduleId: string;
  isAdmin?: boolean;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: string;
  profiles: {
    full_name: string;
  };
}

export default function AttendanceTracker({ moduleId, isAdmin = false }: AttendanceTrackerProps) {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState<string>('present');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledStudents();
    fetchAttendance();
  }, [moduleId]);

  const fetchEnrolledStudents = async () => {
    const { data, error } = await supabase
      .from('student_modules')
      .select(`
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('module_id', moduleId);

    if (error) {
      toast({
        title: 'Error fetching students',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const studentList = (data as unknown as { profiles: Student }[])?.map((item) => item.profiles).filter(Boolean) || [];
    setStudents(studentList);
    setLoading(false);
  };

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        student_id,
        date,
        status,
        profiles (
          full_name
        )
      `)
      .eq('module_id', moduleId)
      .order('date', { ascending: false })
      .limit(100);

    if (error) {
      toast({
        title: 'Error fetching attendance',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setAttendance(data as unknown as AttendanceRecord[] || []);
  };

  const markAttendance = async () => {
    if (!selectedStudent) {
      toast({
        title: 'Error',
        description: 'Please select a student',
        variant: 'destructive',
      });
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('attendance').insert({
      student_id: selectedStudent,
      module_id: moduleId,
      status: selectedStatus,
      date: selectedDate,
      marked_by: authData.user?.id,
    });

    if (error) {
      toast({
        title: 'Error marking attendance',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Attendance marked',
      description: 'Attendance has been recorded successfully',
    });

    setDialogOpen(false);
    setSelectedStudent('');
    fetchAttendance();
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      present: { variant: 'default' as const, icon: CheckCircle2, color: 'text-secondary' },
      late: { variant: 'secondary' as const, icon: Clock, color: 'text-accent' },
      absent: { variant: 'destructive' as const, icon: XCircle, color: 'text-destructive' },
    };

    const config = variants[status as keyof typeof variants] || variants.absent;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${config.color}`} />
        {status}
      </Badge>
    );
  };

  const getStudentAttendanceStats = (studentId: string) => {
    const studentRecords = attendance.filter(a => a.student_id === studentId);
    const total = studentRecords.length;
    const present = studentRecords.filter(a => a.status === 'present').length;
    const late = studentRecords.filter(a => a.status === 'late').length;
    const percentage = total > 0 ? ((present + late) / total) * 100 : 0;

    return { total, present, late, percentage };
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Attendance Tracking</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Mark Attendance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Student Attendance</DialogTitle>
              <DialogDescription>Record attendance for a student</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Student</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={markAttendance} className="w-full">
                Submit Attendance
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Attendance Overview</CardTitle>
          <CardDescription>View attendance statistics for each student</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead className="text-center">Total Classes</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Late</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">Attendance %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No students enrolled
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => {
                  const stats = getStudentAttendanceStats(student.id);
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell className="text-center">{stats.total}</TableCell>
                      <TableCell className="text-center text-secondary font-semibold">
                        {stats.present}
                      </TableCell>
                      <TableCell className="text-center text-accent font-semibold">
                        {stats.late}
                      </TableCell>
                      <TableCell className="text-center text-destructive font-semibold">
                        {stats.absent}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={stats.percentage >= ATTENDANCE_THRESHOLD_DEFAULT ? 'default' : 'destructive'}>
                          {stats.percentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
          <CardDescription>Latest attendance entries</CardDescription>
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
                  <div>
                    <p className="font-medium">{record.profiles.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  {getStatusBadge(record.status)}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}