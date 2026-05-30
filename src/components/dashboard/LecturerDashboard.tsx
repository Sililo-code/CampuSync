import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, BookOpen, Users, Calendar, BarChart3 } from 'lucide-react';
import { z } from 'zod';
import AttendanceTracker from '@/components/attendance/AttendanceTracker';
import AttendanceAnalytics from '@/components/attendance/AttendanceAnalytics';

const moduleSchema = z.object({
  code: z.string().trim().min(1, { message: 'Module code is required' }).max(20),
  name: z.string().trim().min(1, { message: 'Module name is required' }).max(100),
  description: z.string().max(500).optional(),
});

interface Module {
  id: string;
  code: string;
  name: string;
  description: string | null;
  student_count?: number;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
}

export default function LecturerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [newModule, setNewModule] = useState({ code: '', name: '', description: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
    fetchStudents();
  }, [user]);

  useEffect(() => {
    if (selectedModule) {
      fetchEnrolledStudents(selectedModule);
    }
  }, [selectedModule]);

  const fetchModules = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('lecturer_id', user.id);

    if (error) {
      toast({
        title: 'Error fetching modules',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setModules(data || []);
    setLoading(false);
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'student');

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

  const fetchEnrolledStudents = async (moduleId: string) => {
    const { data, error } = await supabase
      .from('student_modules')
      .select(`
        id,
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('module_id', moduleId);

    if (error) {
      toast({
        title: 'Error fetching enrolled students',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setEnrolledStudents(data || []);
  };

  const createModule = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = moduleSchema.parse(newModule);

      const { error } = await supabase.from('modules').insert([{
        code: validated.code,
        name: validated.name,
        description: validated.description,
        lecturer_id: user?.id,
      }]);

      if (error) throw error;

      toast({
        title: 'Module created',
        description: 'The module has been created successfully',
      });

      setNewModule({ code: '', name: '', description: '' });
      setDialogOpen(false);
      fetchModules();
    } catch (error: any) {
      toast({
        title: 'Error creating module',
        description: error.message || 'Failed to create module',
        variant: 'destructive',
      });
    }
  };

  const enrollStudent = async () => {
    if (!selectedStudent || !selectedModule) return;

    const { error } = await supabase.from('student_modules').insert({
      student_id: selectedStudent,
      module_id: selectedModule,
    });

    if (error) {
      toast({
        title: 'Error enrolling student',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Student enrolled',
      description: 'The student has been enrolled successfully',
    });

    setSelectedStudent('');
    setEnrollDialogOpen(false);
    fetchEnrolledStudents(selectedModule);
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
        <h2 className="text-3xl font-bold">Lecturer Dashboard</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Module</DialogTitle>
              <DialogDescription>Add a new module to your teaching list</DialogDescription>
            </DialogHeader>
            <form onSubmit={createModule} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Module Code</Label>
                <Input
                  id="code"
                  value={newModule.code}
                  onChange={(e) => setNewModule({ ...newModule, code: e.target.value })}
                  placeholder="COM413"
                  required
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Module Name</Label>
                <Input
                  id="name"
                  value={newModule.name}
                  onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                  placeholder="Software Engineering"
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newModule.description}
                  onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                  placeholder="Module description..."
                  maxLength={500}
                />
              </div>
              <Button type="submit" className="w-full">Create Module</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Semester</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Semester 1</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="modules">My Modules</TabsTrigger>
          <TabsTrigger value="attendance">
            <BarChart3 className="w-4 h-4 mr-2" />
            Attendance Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>My Modules</CardTitle>
              <CardDescription>View and manage your modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modules.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No modules created yet. Click "Add Module" to get started.
                  </p>
                ) : (
                  modules.map((module) => (
                    <div
                      key={module.id}
                      className="border border-border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{module.code}</h3>
                          <p className="text-sm text-muted-foreground">{module.name}</p>
                          {module.description && (
                            <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedModule(module.id === selectedModule ? null : module.id)}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            View Students
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedModule(module.id);
                              setEnrollDialogOpen(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Enroll
                          </Button>
                        </div>
                      </div>
                      {selectedModule === module.id && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <h4 className="text-sm font-semibold mb-2">Enrolled Students</h4>
                          <div className="space-y-2">
                            {enrolledStudents.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No students enrolled</p>
                            ) : (
                              enrolledStudents.map((enrollment: any) => (
                                <div key={enrollment.id} className="text-sm p-2 bg-accent/5 rounded">
                                  <span className="font-medium">{enrollment.profiles.full_name}</span>
                                  <span className="text-muted-foreground ml-2">({enrollment.profiles.email})</span>
                                </div>
                              ))
                            )}
                          </div>
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
          {selectedModule ? (
            <div className="space-y-6">
              <AttendanceAnalytics moduleId={selectedModule} />
              <AttendanceTracker moduleId={selectedModule} />
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  Select a module from the "My Modules" tab to track attendance
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll Student</DialogTitle>
            <DialogDescription>Select a student to enroll in this module</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student">Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger id="student">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={enrollStudent} className="w-full" disabled={!selectedStudent}>
              Enroll Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}