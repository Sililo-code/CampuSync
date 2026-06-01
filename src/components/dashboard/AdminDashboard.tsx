import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, BookOpen, GraduationCap, BarChart3, Calendar as CalendarIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { z } from 'zod';
import AttendanceAnalytics from '@/components/attendance/AttendanceAnalytics';

const userSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).max(255),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  fullName: z.string().trim().min(1, { message: 'Full name is required' }).max(100),
  role: z.enum(['student', 'lecturer']),
});

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface Module {
  id: string;
  code: string;
  name: string;
  lecturer_id: string | null;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Profile[]>([]);
  const [lecturers, setLecturers] = useState<Profile[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student' as 'student' | 'lecturer',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([fetchStudents(), fetchLecturers(), fetchModules()]);
    setLoading(false);
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name');

    if (error) {
      toast({
        title: 'Error fetching students',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setStudents(data || []);
  };

  const fetchLecturers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'lecturer')
      .order('full_name');

    if (error) {
      toast({
        title: 'Error fetching lecturers',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setLecturers(data || []);
  };

  const fetchModules = async () => {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .order('code');

    if (error) {
      toast({
        title: 'Error fetching modules',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setModules(data || []);
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = userSchema.parse(newUser);

      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: validated.fullName,
            role: validated.role,
          },
        },
      });

      if (error) throw error;

      toast({
        title: 'User created successfully',
        description: `${validated.role === 'student' ? 'Student' : 'Lecturer'} account has been created`,
      });

      setNewUser({ email: '', password: '', fullName: '', role: 'student' });
      setDialogOpen(false);
      fetchAllData();
    } catch (error) {
      toast({
        title: 'Error creating user',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      });
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
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new student or lecturer to the system</DialogDescription>
            </DialogHeader>
            <form onSubmit={createUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: 'student' | 'lecturer') =>
                    setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="lecturer">Lecturer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="John Doe"
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@cuz.ac.zm"
                  required
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full">Create User</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lecturers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lecturers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="lecturers">Lecturers</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="attendance">
            <BarChart3 className="w-4 h-4 mr-2" />
            Attendance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>Manage student accounts and view attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No students registered yet
                  </p>
                ) : (
                  students.map((student) => (
                    <div
                      key={student.id}
                      className="p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{student.full_name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedModule(student.id)}
                        >
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          View Attendance
                        </Button>
                      </div>
                      {selectedModule === student.id && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <AttendanceAnalytics studentId={student.id} />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lecturers">
          <Card>
            <CardHeader>
              <CardTitle>Lecturers</CardTitle>
              <CardDescription>Manage lecturer accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lecturers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No lecturers registered yet
                  </p>
                ) : (
                  lecturers.map((lecturer) => (
                    <div
                      key={lecturer.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      <div>
                        <p className="font-semibold">{lecturer.full_name}</p>
                        <p className="text-sm text-muted-foreground">{lecturer.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Modules</CardTitle>
              <CardDescription>All modules in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {modules.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No modules created yet
                  </p>
                ) : (
                  modules.map((module) => (
                    <div
                      key={module.id}
                      className="p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{module.code}</p>
                          <p className="text-sm text-muted-foreground">{module.name}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedModule(module.id === selectedModule ? null : module.id)}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Analytics
                        </Button>
                      </div>
                      {selectedModule === module.id && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <AttendanceAnalytics moduleId={module.id} />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Overall Attendance Analytics</CardTitle>
                <CardDescription>System-wide attendance statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceAnalytics />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}