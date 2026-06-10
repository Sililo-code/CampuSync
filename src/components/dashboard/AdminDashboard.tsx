import { useState } from 'react';
import { useProfiles } from '@/hooks/queries/useProfiles';
import { useModules } from '@/hooks/queries/useModules';
import { useCreateUser } from '@/hooks/queries/useCreateUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, BookOpen, GraduationCap, BarChart3, Calendar as CalendarIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, CreateUserFormValues } from '@/schemas';
import AttendanceAnalytics from '@/components/attendance/AttendanceAnalytics';
import { USER_ROLES } from '@/lib/constants';

export default function AdminDashboard() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Separate states to prevent collision between student and module toggles
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Queries
  const { data: students = [], isLoading: loadingStudents } = useProfiles(USER_ROLES.STUDENT);
  const { data: lecturers = [], isLoading: loadingLecturers } = useProfiles(USER_ROLES.LECTURER);
  const { data: modules = [], isLoading: loadingModules } = useModules();

  // Mutation
  const createUserMutation = useCreateUser();

  // User creation form
  const userForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      role: 'student',
    },
  });

  const handleCreateUser = async (values: CreateUserFormValues) => {
    try {
      await createUserMutation.mutateAsync(values);

      toast({
        title: 'User created successfully',
        description: `${values.role === 'student' ? 'Student' : 'Lecturer'} account has been created`,
      });

      userForm.reset();
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error creating user',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  const isLoading = loadingStudents || loadingLecturers || loadingModules;

  if (isLoading) {
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
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(handleCreateUser)} className="space-y-4">
                <FormField
                  control={userForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="lecturer">Lecturer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="user@cuz.ac.zm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </form>
            </Form>
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
                          onClick={() => setSelectedStudentId(student.id === selectedStudentId ? null : student.id)}
                        >
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          View Attendance
                        </Button>
                      </div>
                      {selectedStudentId === student.id && (
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
                          onClick={() => setSelectedModuleId(module.id === selectedModuleId ? null : module.id)}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Analytics
                        </Button>
                      </div>
                      {selectedModuleId === module.id && (
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
