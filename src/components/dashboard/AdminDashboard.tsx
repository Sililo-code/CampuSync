import { useState, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useProfiles } from '@/hooks/queries/useProfiles';
import { useModules } from '@/hooks/queries/useModules';
import { useCreateUser } from '@/hooks/queries/useCreateUser';
import { useCreateModule } from '@/hooks/queries/useCreateModule';
import { useAttendanceStats } from '@/hooks/queries/useAttendanceStats';
import { useAtRiskStudents } from '@/hooks/queries/useAtRiskStudents';
import { useEnrolledStudents } from '@/hooks/queries/useEnrolledStudents';
import { useEnrolStudent } from '@/hooks/queries/useEnrolStudent';
import { useStudentsByEmail } from '@/hooks/queries/useStudentsByEmail';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  UserPlus,
  Library,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, createModuleSchema, updateModuleThresholdSchema, CreateUserFormValues, CreateModuleFormValues, UpdateModuleThresholdFormValues } from '@/schemas';
import { USER_ROLES, ATTENDANCE_THRESHOLD_DEFAULT } from '@/lib/constants';
import { useUpdateModule } from '@/hooks/queries/useUpdateModule';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Module, Profile } from '@/types';

type AdminView = 'overview' | 'users' | 'modules';

// Simple email regex for CSV header detection
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCsv(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .reduce<string[]>((acc, line, index) => {
      const cols = line.split(',').map((c) => c.trim());
      const candidate = cols[0];
      // Skip header row: first row whose first cell is not an email
      if (index === 0 && !EMAIL_RE.test(candidate)) return acc;
      if (EMAIL_RE.test(candidate)) acc.push(candidate.toLowerCase());
      return acc;
    }, []);
}

type PreviewRow = {
  email: string;
  fullName: string | null;
  status: 'matched' | 'already_enrolled' | 'unmatched';
  profileId: string | null;
};

interface RosterImportDialogProps {
  moduleId: string;
  moduleName: string;
  open: boolean;
  onClose: () => void;
}

function RosterImportDialog({ moduleId, moduleName, open, onClose }: RosterImportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const { data: enrolledStudents = [] } = useEnrolledStudents(moduleId);
  const { data: matchedProfiles = [], isFetching: fetchingProfiles } = useStudentsByEmail(parsedEmails);
  const enrolStudent = useEnrolStudent();

  const enrolledIds = useMemo(
    () => new Set(enrolledStudents.map((s: Profile) => s.id)),
    [enrolledStudents]
  );

  const preview = useMemo<PreviewRow[]>(() => {
    if (parsedEmails.length === 0) return [];
    return parsedEmails.map((email) => {
      const profile = matchedProfiles.find(
        (p: Profile) => p.email.toLowerCase() === email
      );
      if (!profile) {
        return { email, fullName: null, status: 'unmatched', profileId: null };
      }
      if (enrolledIds.has(profile.id)) {
        return { email, fullName: profile.full_name, status: 'already_enrolled', profileId: profile.id };
      }
      return { email, fullName: profile.full_name, status: 'matched', profileId: profile.id };
    });
  }, [parsedEmails, matchedProfiles, enrolledIds]);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setParsedEmails(parseCsv(text));
    };
    reader.readAsText(file);
  }, []);

  const handleClose = useCallback(() => {
    setParsedEmails([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  }, [onClose]);

  const handleImport = async () => {
    const toEnrol = preview.filter((r) => r.status === 'matched' && r.profileId);
    const alreadyEnrolled = preview.filter((r) => r.status === 'already_enrolled').length;
    const unmatched = preview.filter((r) => r.status === 'unmatched').length;

    setIsImporting(true);
    let enrolled = 0;
    let failed = 0;
    for (const row of toEnrol) {
      try {
        await enrolStudent.mutateAsync({ studentId: row.profileId!, moduleId });
        enrolled++;
      } catch {
        failed++;
      }
    }
    setIsImporting(false);

    const parts: string[] = [];
    if (enrolled > 0) parts.push(`${enrolled} student${enrolled !== 1 ? 's' : ''} enrolled`);
    if (alreadyEnrolled > 0) parts.push(`${alreadyEnrolled} skipped (already enrolled)`);
    if (unmatched > 0) parts.push(`${unmatched} unmatched`);
    if (failed > 0) parts.push(`${failed} failed`);

    toast({
      title: 'Import complete',
      description: parts.join(', ') + '.',
      variant: failed > 0 ? 'destructive' : 'default',
    });
    handleClose();
  };

  const matchedCount = preview.filter((r) => r.status === 'matched').length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Roster — {moduleName}</DialogTitle>
          <p className="text-xs text-muted-foreground pt-1">
            Upload a CSV file to bulk-enrol existing students into this module.
          </p>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">CSV File</Label>
            <p className="text-[11px] text-muted-foreground">
              One email per row, or <code className="bg-muted px-1 rounded">email,full_name</code> columns — header row optional.
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="text-xs cursor-pointer"
            />
          </div>

          {parsedEmails.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-widest">
                  Preview — {parsedEmails.length} row{parsedEmails.length !== 1 ? 's' : ''}
                </span>
                {fetchingProfiles && (
                  <span className="text-[10px] text-muted-foreground animate-pulse">Matching accounts…</span>
                )}
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto] text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/30 px-4 py-2 border-b border-border">
                  <span>Email</span>
                  <span className="text-right mr-4">Name</span>
                  <span className="text-right">Status</span>
                </div>
                <div className="divide-y divide-border max-h-56 overflow-y-auto">
                  {preview.map((row) => (
                    <div
                      key={row.email}
                      className="grid grid-cols-[1fr_auto_auto] items-center px-4 py-2.5 text-xs"
                    >
                      <span className="text-foreground font-medium truncate pr-3">{row.email}</span>
                      <span className="text-muted-foreground mr-4 text-right">
                        {row.fullName ?? '—'}
                      </span>
                      {row.status === 'matched' && (
                        <Badge className="bg-secondary/10 text-secondary border-0 text-[9px] font-bold px-2 py-0.5">
                          Will enrol
                        </Badge>
                      )}
                      {row.status === 'already_enrolled' && (
                        <Badge className="bg-muted text-muted-foreground border-0 text-[9px] font-bold px-2 py-0.5">
                          Enrolled
                        </Badge>
                      )}
                      {row.status === 'unmatched' && (
                        <Badge className="bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-0 text-[9px] font-bold px-2 py-0.5">
                          No account
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} className="text-xs font-bold">
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={matchedCount === 0 || isImporting || fetchingProfiles}
            className="bg-primary text-xs font-bold"
            requiresConnection
          >
            {isImporting ? 'Importing…' : `Import ${matchedCount > 0 ? matchedCount : ''} Student${matchedCount !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Navigation State
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [importingModuleId, setImportingModuleId] = useState<string | null>(null);

  // Queries
  const { data: students = [], isLoading: loadingStudents } = useProfiles(USER_ROLES.STUDENT);
  const { data: lecturers = [], isLoading: loadingLecturers } = useProfiles(USER_ROLES.LECTURER);
  const { data: modules = [], isLoading: loadingModules } = useModules();
  const { data: globalStats, isLoading: loadingStats } = useAttendanceStats();

  // Mutations
  const createUserMutation = useCreateUser();
  const createModuleMutation = useCreateModule();
  const updateModuleMutation = useUpdateModule(editingModuleId || '');

  // Forms
  const userForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      role: 'student',
    },
  });

  const moduleForm = useForm<CreateModuleFormValues & { lecturerId?: string }>({
    resolver: zodResolver(createModuleSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      attendanceThreshold: 80,
      lecturerId: '',
    },
  });

  const thresholdForm = useForm<UpdateModuleThresholdFormValues>({
    resolver: zodResolver(updateModuleThresholdSchema),
  });

  // Handlers
  const handleCreateUser = async (values: CreateUserFormValues) => {
    try {
      await createUserMutation.mutateAsync(values);
      toast({ title: 'User created', description: `${values.fullName} has been registered.` });
      userForm.reset();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Registration failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handleCreateModule = async (values: CreateModuleFormValues & { lecturerId?: string }) => {
    try {
      await createModuleMutation.mutateAsync(values);
      toast({ title: 'Module created', description: `${values.code} added to system.` });
      moduleForm.reset();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Module creation failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const handleEditThreshold = (module: Module) => {
    setEditingModuleId(module.id);
    thresholdForm.setValue('attendanceThreshold', module.attendance_threshold ?? ATTENDANCE_THRESHOLD_DEFAULT);
  };

  const handleUpdateThreshold = async (values: UpdateModuleThresholdFormValues) => {
    try {
      await updateModuleMutation.mutateAsync(values);
      toast({ title: 'Threshold updated', description: 'Module attendance policy has been updated.' });
      setEditingModuleId(null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Update failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const importingModule = useMemo(
    () => modules.find((m) => m.id === importingModuleId) ?? null,
    [modules, importingModuleId]
  );

  const adminName = user?.user_metadata?.full_name?.split(' ')[0] || 'Administrator';

  if (loadingStudents || loadingLecturers || loadingModules) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-12 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Greeting Hero */}
      <div className="bg-primary rounded-xl px-6 py-5 flex items-center justify-between shadow-lg shadow-primary/10">
        <div className="space-y-1">
          <h1 className="text-white text-xl font-bold">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {adminName}
          </h1>
          <p className="text-white/55 text-xs font-medium uppercase tracking-wider">
            {format(new Date(), 'EEEE, dd MMMM yyyy')}
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
          System Administrator
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-muted rounded-lg p-1 flex w-full max-w-md">
        {(['overview', 'users', 'modules'] as AdminView[]).map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              activeView === view ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {view === 'overview' && <LayoutDashboard className="w-4 h-4" />}
            {view === 'users' && <UserPlus className="w-4 h-4" />}
            {view === 'modules' && <Library className="w-4 h-4" />}
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW VIEW */}
      {activeView === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <StatsCard
               label="Total Students"
               value={students.length}
               sub="Active enrolments"
               icon={<GraduationCap className="w-5 h-5 text-primary" />}
             />
             <StatsCard
               label="Total Lecturers"
               value={lecturers.length}
               sub="Faculty staff"
               icon={<Users className="w-5 h-5 text-primary" />}
             />
             <StatsCard
               label="System Rate"
               value={`${globalStats?.percentage.toFixed(1) || 0}%`}
               sub={`Target: ${ATTENDANCE_THRESHOLD_DEFAULT}%`}
               icon={<TrendingUp className="w-5 h-5 text-secondary" />}
               color="text-secondary"
             />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Global At-Risk Monitoring</h3>
            </div>

            <Card className="border-border rounded-xl overflow-hidden">
               <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {modules.length === 0 ? (
                       <div className="p-12 text-center text-muted-foreground text-sm">No modules found in system</div>
                    ) : (
                      modules.map(m => (
                        <div key={m.id} className="p-4 bg-muted/5">
                           <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-muted-foreground">{m.code} Compliance</span>
                              <Badge variant="outline" className="text-[10px] uppercase">{m.name}</Badge>
                           </div>
                           <AtRiskList moduleId={m.id} threshold={m.attendance_threshold} />
                        </div>
                      ))
                    )}
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* USERS VIEW */}
      {activeView === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
           {/* Creation Form */}
           <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest px-1">Register User</h3>
              <Card className="border-border rounded-xl shadow-sm">
                <CardContent className="p-5">
                   <form onSubmit={userForm.handleSubmit(handleCreateUser)} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Full Name</Label>
                        <Input placeholder="Brendah Liywalii" {...userForm.register('fullName')} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Email Address</Label>
                        <Input type="email" placeholder="student@cuz.ac.zm" {...userForm.register('email')} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Initial Password</Label>
                        <Input type="password" {...userForm.register('password')} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">System Role</Label>
                        <select
                          {...userForm.register('role')}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="student">Student</option>
                          <option value="lecturer">Lecturer</option>
                        </select>
                      </div>
                      <Button type="submit" className="w-full font-bold bg-primary rounded-lg" disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? 'Registering...' : 'Register User'}
                      </Button>
                   </form>
                </CardContent>
              </Card>
           </div>

           {/* User Table */}
           <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest px-1">Active Profiles</h3>
              <Card className="border-border rounded-xl shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                       {[...lecturers, ...students].length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-xl bg-muted/20 m-6">
                            <Users className="w-8 h-8 text-muted-foreground/40 mb-2" />
                            <p className="text-sm font-semibold text-foreground">No active profiles</p>
                            <p className="text-xs text-muted-foreground mt-1">There are no users registered in the system yet.</p>
                         </div>
                       ) : (
                         [...lecturers, ...students].map(p => (
                           <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
                              <div className="flex items-center gap-4">
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs ${p.role === 'lecturer' ? 'bg-primary' : 'bg-secondary'}`}>
                                    {p.full_name.charAt(0)}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold">{p.full_name}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">{p.role} · {p.email}</span>
                                 </div>
                              </div>
                              <Badge variant="outline" className="text-[10px] font-bold h-6">Active</Badge>
                           </div>
                         ))
                       )}
                    </div>
                </CardContent>
              </Card>
           </div>
        </div>
      )}

      {/* MODULES VIEW */}
      {activeView === 'modules' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
           {/* Creation Form */}
           <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest px-1">New Module</h3>
              <Card className="border-border rounded-xl shadow-sm">
                <CardContent className="p-5">
                   <form onSubmit={moduleForm.handleSubmit(handleCreateModule)} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Module Code</Label>
                        <Input placeholder="COM413" {...moduleForm.register('code')} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Module Name</Label>
                        <Input placeholder="Software Engineering" {...moduleForm.register('name')} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Lecturer Assignment</Label>
                        <select
                          {...moduleForm.register('lecturerId')}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <option value="">No lecturer assigned</option>
                          {lecturers.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Attendance Threshold (%)</Label>
                        <Input type="number" {...moduleForm.register('attendanceThreshold', { valueAsNumber: true })} />
                      </div>
                      <Button type="submit" className="w-full font-bold bg-primary rounded-lg" disabled={createModuleMutation.isPending}>
                        {createModuleMutation.isPending ? 'Creating...' : 'Create Module'}
                      </Button>
                   </form>
                </CardContent>
              </Card>
           </div>

           {/* Module Table */}
           <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest px-1">Institutional Curriculum</h3>
              <Card className="border-border rounded-xl shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                       {modules.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-xl bg-muted/20 m-6">
                            <BookOpen className="w-8 h-8 text-muted-foreground/40 mb-2" />
                            <p className="text-sm font-semibold text-foreground">No modules found</p>
                            <p className="text-xs text-muted-foreground mt-1">Add a new module to start tracking attendance.</p>
                         </div>
                       ) : (
                         modules.map(m => (
                           <div key={m.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/5 transition-colors group">
                              <div className="flex items-center gap-4">
                                 <div className="bg-primary/5 p-3 rounded-lg group-hover:bg-primary/10 transition-colors">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold">{m.code}: {m.name}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                      Lecturer: {lecturers.find(l => l.id === m.lecturer_id)?.full_name || 'Unassigned'} · Threshold: {m.attendance_threshold ?? ATTENDANCE_THRESHOLD_DEFAULT}%
                                    </span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-muted-foreground font-bold text-xs h-8 gap-1.5"
                                  onClick={() => setImportingModuleId(m.id)}
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  Import Roster
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary font-bold text-xs h-8"
                                  onClick={() => handleEditThreshold(m)}
                                >
                                  Edit
                                </Button>
                              </div>
                           </div>
                         ))
                       )}
                    </div>
                </CardContent>
              </Card>
           </div>
        </div>
      )}

      {/* Edit Threshold Dialog */}
      <Dialog open={!!editingModuleId} onOpenChange={(open) => !open && setEditingModuleId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Attendance Threshold</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Adjust the compliance requirement for this module. Changes reflect immediately in at-risk student lists.
            </p>
          </DialogHeader>
          <form onSubmit={thresholdForm.handleSubmit(handleUpdateThreshold)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Attendance Threshold (%)</Label>
              <Input
                type="number"
                placeholder="80"
                {...thresholdForm.register('attendanceThreshold', { valueAsNumber: true })}
              />
              {thresholdForm.formState.errors.attendanceThreshold && (
                <p className="text-[10px] text-destructive font-medium">
                  {thresholdForm.formState.errors.attendanceThreshold.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingModuleId(null)}
                className="text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-xs font-bold"
                disabled={updateModuleMutation.isPending}
              >
                {updateModuleMutation.isPending ? 'Updating...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Roster Dialog */}
      {importingModule && (
        <RosterImportDialog
          moduleId={importingModule.id}
          moduleName={`${importingModule.code}: ${importingModule.name}`}
          open={!!importingModuleId}
          onClose={() => setImportingModuleId(null)}
        />
      )}
    </div>
  );
}

// Sub-components

function StatsCard({ label, value, sub, icon, color = "text-foreground" }: { label: string, value: string | number, sub: string, icon: React.ReactNode, color?: string }) {
  return (
    <Card className="bg-card border-border rounded-xl shadow-sm">
      <CardContent className="p-5 flex flex-col justify-between h-full">
         <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
            <div className="bg-muted/50 p-1.5 rounded-lg">{icon}</div>
         </div>
         <div>
            <span className={`text-3xl font-black leading-none ${color}`}>{value}</span>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">{sub}</p>
         </div>
      </CardContent>
    </Card>
  );
}

function AtRiskList({ moduleId, threshold }: { moduleId: string, threshold: number }) {
  const { data: atRisk = [], isLoading } = useAtRiskStudents(moduleId, threshold);

  if (isLoading) return <Skeleton className="h-8 w-full mt-2" />;
  if (atRisk.length === 0) return (
    <div className="flex items-center gap-2 text-secondary py-1">
      <CheckCircle2 className="w-3 h-3" />
      <span className="text-[10px] font-bold">Compliant</span>
    </div>
  );

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {atRisk.map(s => (
        <Badge key={s.id} className="bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-0 text-[9px] font-bold px-2 py-0.5">
           {s.full_name}: {s.stats.percentage.toFixed(0)}%
        </Badge>
      ))}
    </div>
  );
}
