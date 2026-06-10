import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useModules } from '@/hooks/queries/useModules';
import { useProfiles } from '@/hooks/queries/useProfiles';
import { useEnrolledStudents } from '@/hooks/queries/useEnrolledStudents';
import { useCreateModule } from '@/hooks/queries/useCreateModule';
import { useEnrolStudent } from '@/hooks/queries/useEnrolStudent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Plus, BookOpen, Users, Calendar, BarChart3 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createModuleSchema, CreateModuleFormValues } from '@/schemas';
import AttendanceTracker from '@/components/attendance/AttendanceTracker';
import AttendanceAnalytics from '@/components/attendance/AttendanceAnalytics';
import { USER_ROLES } from '@/lib/constants';

export default function LecturerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for toggles and selections
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('modules');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<string>('');

  // Queries
  const { data: modules = [], isLoading: loadingModules } = useModules();
  const { data: students = [], isLoading: loadingStudents } = useProfiles(USER_ROLES.STUDENT);
  const { data: enrolledStudents = [], isLoading: loadingEnrolled } = useEnrolledStudents(selectedModule || undefined);

  // Mutations
  const createModuleMutation = useCreateModule();
  const enrolStudentMutation = useEnrolStudent();

  // Form for module creation
  const moduleForm = useForm<CreateModuleFormValues>({
    resolver: zodResolver(createModuleSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      attendanceThreshold: 80,
    },
  });

  const handleCreateModule = async (values: CreateModuleFormValues) => {
    try {
      await createModuleMutation.mutateAsync({
        ...values,
        lecturerId: user?.id,
      });

      toast({
        title: 'Module created',
        description: 'The module has been created successfully',
      });

      moduleForm.reset();
      setDialogOpen(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create module';
      toast({
        title: 'Error creating module',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudentForEnroll || !selectedModule) return;

    try {
      await enrolStudentMutation.mutateAsync({
        studentId: selectedStudentForEnroll,
        moduleId: selectedModule,
      });

      toast({
        title: 'Student enrolled',
        description: 'The student has been enrolled successfully',
      });

      setSelectedStudentForEnroll('');
      setEnrollDialogOpen(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enroll student';
      toast({
        title: 'Error enrolling student',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleMarkAttendance = (moduleId: string) => {
    setSelectedModule(moduleId);
    setActiveTab('attendance');
  };

  if (loadingModules || loadingStudents) {
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
            <Form {...moduleForm}>
              <form onSubmit={moduleForm.handleSubmit(handleCreateModule)} className="space-y-4">
                <FormField
                  control={moduleForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module Code</FormLabel>
                      <FormControl>
                        <Input placeholder="COM413" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={moduleForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineering" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={moduleForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Module description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={moduleForm.control}
                  name="attendanceThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attendance Threshold (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createModuleMutation.isPending}>
                  {createModuleMutation.isPending ? 'Creating...' : 'Create Module'}
                </Button>
              </form>
            </Form>
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
            <CardTitle className="text-sm font-medium">Available Students</CardTitle>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                            onClick={() => handleMarkAttendance(module.id)}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Mark Attendance
                          </Button>
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
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-semibold">Enrolled Students</h4>
                            {loadingEnrolled && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                          </div>
                          <div className="space-y-2">
                            {enrolledStudents.length === 0 && !loadingEnrolled ? (
                              <p className="text-xs text-muted-foreground">No students enrolled</p>
                            ) : (
                              enrolledStudents.map((profile) => (
                                <div key={profile.id} className="text-sm p-2 bg-accent/5 rounded">
                                  <span className="font-medium">{profile.full_name}</span>
                                  <span className="text-muted-foreground ml-2">({profile.email})</span>
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
              <Select value={selectedStudentForEnroll} onValueChange={setSelectedStudentForEnroll}>
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
            <Button 
              onClick={handleEnrollStudent} 
              className="w-full" 
              disabled={!selectedStudentForEnroll || enrolStudentMutation.isPending}
            >
              {enrolStudentMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
