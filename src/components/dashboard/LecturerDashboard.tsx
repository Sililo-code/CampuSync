import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useModules } from '@/hooks/queries/useModules';
import { useSessions } from '@/hooks/queries/useSessions';
import { useEnrolledStudents } from '@/hooks/queries/useEnrolledStudents';
import { useCreateSession } from '@/hooks/queries/useCreateSession';
import { useMarkBatchAttendance } from '@/hooks/queries/useMarkBatchAttendance';
import { useAtRiskStudents } from '@/hooks/queries/useAtRiskStudents';
import { useAttendance } from '@/hooks/queries/useAttendance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Save,
  Clock,
  LayoutDashboard,
  History,
  PenTool
} from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSessionSchema, CreateSessionFormValues } from '@/schemas';
import { ATTENDANCE_STATUS, ATTENDANCE_THRESHOLD_DEFAULT, AttendanceStatus } from '@/lib/constants';

type DashboardView = 'overview' | 'mark' | 'history';

export default function LecturerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Navigation & Selection State
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Roster Marking State
  const [rosterStatus, setRosterStatus] = useState<Record<string, AttendanceStatus>>({});

  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);

  // Queries
  const { data: modules = [], isLoading: loadingModules } = useModules();
  
  // Contextual Data
  const selectedModule = useMemo(() => modules.find(m => m.id === selectedModuleId), [modules, selectedModuleId]);
  
  const { data: enrolledStudents = [], isLoading: loadingStudents } = useEnrolledStudents(selectedModuleId || undefined);
  const { data: moduleSessions = [], isLoading: loadingSessions } = useSessions(selectedModuleId || undefined);
  
  // Mutations
  const createSessionMutation = useCreateSession();
  const markBatchMutation = useMarkBatchAttendance();

  // Session Form
  const sessionForm = useForm<CreateSessionFormValues>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      moduleId: '',
      sessionDate: new Date().toISOString().split('T')[0],
      sessionNumber: 1,
      startTime: format(new Date(), 'HH:mm'),
      topic: '',
    },
  });

  // Derived Info
  const lecturerName = user?.user_metadata?.full_name?.split(' ')[0] || 'Lecturer';
  const totalAssigned = modules.length;

  // Handlers
  const handleMarkModule = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setActiveView('mark');
    setActiveSessionId(null);
    sessionForm.setValue('moduleId', moduleId);
  };

  const handleCreateSession = async (values: CreateSessionFormValues) => {
    if (!user) return;
    try {
      const newSession = await createSessionMutation.mutateAsync({
        ...values,
        createdBy: user.id,
      });
      setActiveSessionId(newSession.id);
      
      // Initialize Roster to Present
      const initialRoster: Record<string, AttendanceStatus> = {};
      enrolledStudents.forEach(s => {
        initialRoster[s.id] = ATTENDANCE_STATUS.PRESENT;
      });
      setRosterStatus(initialRoster);

      toast({ title: 'Session created', description: `Ready to mark attendance for session #${values.sessionNumber}` });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleMarkAllPresent = () => {
    const newRoster: Record<string, AttendanceStatus> = {};
    enrolledStudents.forEach(s => {
      newRoster[s.id] = ATTENDANCE_STATUS.PRESENT;
    });
    setRosterStatus(newRoster);
  };

  const submitAttendance = async (confirmOverwrite = false) => {
    if (!user || !activeSessionId || !selectedModuleId) return;
    const records = Object.entries(rosterStatus).map(([studentId, status]) => ({
      studentId,
      status,
      markedBy: user.id,
    }));
    await markBatchMutation.mutateAsync({
      sessionId: activeSessionId,
      moduleId: selectedModuleId,
      records,
      confirmOverwrite,
    });
    toast({ title: 'Attendance submitted', description: `Records saved for ${enrolledStudents.length} students.` });
    setActiveView('overview');
    setSelectedModuleId(null);
    setActiveSessionId(null);
  };

  const handleSubmitAttendance = async () => {
    if (!user || !activeSessionId || !selectedModuleId) return;
    try {
      await submitAttendance(false);
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err?.message === 'ATTENDANCE_ALREADY_RECORDED') {
        setOverwriteDialogOpen(true);
        return;
      }
      const errorMessage = err?.message || 'An unknown error occurred';
      toast({ title: 'Submission failed', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleConfirmOverwrite = async () => {
    setOverwriteDialogOpen(false);
    try {
      await submitAttendance(true);
    } catch (error: unknown) {
      const err = error as { message?: string };
      const errorMessage = err?.message || 'An unknown error occurred';
      toast({ title: 'Submission failed', description: errorMessage, variant: 'destructive' });
    }
  };

  if (loadingModules) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
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
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}, {lecturerName}
          </h1>
          <p className="text-white/55 text-xs font-medium uppercase tracking-wider">
            {format(new Date(), 'EEEE, dd MMMM yyyy')}
          </p>
        </div>
        <div className="bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
          {totalAssigned} Modules Assigned
        </div>
      </div>

      {/* Custom View Toggle */}
      <div className="bg-muted rounded-lg p-1 flex w-full max-w-md">
        {(['overview', 'mark', 'history'] as DashboardView[]).map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              activeView === view ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {view === 'overview' && <LayoutDashboard className="w-4 h-4" />}
            {view === 'mark' && <PenTool className="w-4 h-4" />}
            {view === 'history' && <History className="w-4 h-4" />}
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW VIEW */}
      {activeView === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {modules.length === 0 ? (
            <Card className="border-dashed py-12">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-bold text-foreground/70">No modules assigned</h3>
                <p className="text-sm text-muted-foreground max-w-xs">You haven't been assigned any modules yet. Please contact the administrator.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((m) => (
                  <Card key={m.id} className="bg-card border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                        {m.code}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-base font-bold text-foreground line-clamp-1">{m.name}</h3>
                    
                    <ModuleStats moduleId={m.id} />
                    
                    <Button 
                      className="w-full mt-5 bg-primary text-primary-foreground text-xs font-bold rounded-lg py-5 shadow-none"
                      onClick={() => handleMarkModule(m.id)}
                    >
                      Mark Attendance
                    </Button>
                  </Card>
                ))}
              </div>

              {/* At-Risk Monitoring */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Attendance Monitoring</h3>
                </div>
                
                <Card className="border-border rounded-xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {modules.map(module => (
                        <div key={module.id} className="p-4 bg-muted/5">
                           <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-muted-foreground">{module.code} At-Risk Students</span>
                           </div>
                           <AtRiskList moduleId={module.id} threshold={module.attendance_threshold} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* MARK ATTENDANCE VIEW */}
      {activeView === 'mark' && (
        <div className="w-full animate-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Module</Label>
            <select 
              value={selectedModuleId || ''} 
              onChange={(e) => {
                setSelectedModuleId(e.target.value);
                sessionForm.setValue('moduleId', e.target.value);
                setActiveSessionId(null);
              }}
              className="flex h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="" disabled>Choose a module to mark...</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
            </select>
          </div>

          {selectedModuleId && !activeSessionId && (
            <Card className="border-primary/20 shadow-xl shadow-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">New Teaching Session</h3>
                    <p className="text-xs text-muted-foreground">Define the session details to generate the student roster.</p>
                  </div>
                </div>

                <form onSubmit={sessionForm.handleSubmit(handleCreateSession)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Topic of Discussion</Label>
                      <Input placeholder="e.g. Database Indexing" {...sessionForm.register('topic')} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Date</Label>
                        <Input type="date" {...sessionForm.register('sessionDate')} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Session #</Label>
                        <Input type="number" {...sessionForm.register('sessionNumber', { valueAsNumber: true })} />
                      </div>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full py-6 font-bold text-sm bg-primary rounded-xl"
                    disabled={createSessionMutation.isPending}
                  >
                    {createSessionMutation.isPending ? 'Creating Session...' : 'Create Session & Mark Attendance'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeSessionId && selectedModule && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-primary">Marking: {selectedModule.code}</h2>
                    <p className="text-sm text-muted-foreground font-medium italic">
                      Topic: {sessionForm.getValues('topic') || 'No topic specified'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleMarkAllPresent}
                    className="bg-secondary/5 text-secondary border-secondary/20 hover:bg-secondary/10 font-bold"
                  >
                    Mark all as present
                  </Button>
               </div>

               <Card className="border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-muted/30 px-6 py-3 border-b border-border flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Student Name</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-24">Status</span>
                  </div>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {loadingStudents ? (
                        <div className="p-6 space-y-3">
                          {Array(3).fill(0).map((_, i) => (
                            <Skeleton key={i} className="h-14 w-full rounded-xl" />
                          ))}
                        </div>
                      ) : enrolledStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-xl bg-muted/20 m-6">
                          <Users className="w-8 h-8 text-muted-foreground/40 mb-2" />
                          <p className="text-sm font-semibold text-foreground">No students enrolled</p>
                          <p className="text-xs text-muted-foreground mt-1">There are no students enrolled in this module yet.</p>
                        </div>
                      ) : (
                        enrolledStudents.map(student => (
                          <div key={student.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground">{student.full_name}</span>
                              <span className="text-[10px] text-muted-foreground">{student.email}</span>
                            </div>
                            <div className="flex p-1 bg-muted rounded-lg gap-1">
                               <StatusButton 
                                 active={rosterStatus[student.id] === ATTENDANCE_STATUS.PRESENT}
                                 type="present"
                                 onClick={() => setRosterStatus(prev => ({...prev, [student.id]: ATTENDANCE_STATUS.PRESENT}))}
                               />
                               <StatusButton 
                                 active={rosterStatus[student.id] === ATTENDANCE_STATUS.LATE}
                                 type="late"
                                 onClick={() => setRosterStatus(prev => ({...prev, [student.id]: ATTENDANCE_STATUS.LATE}))}
                               />
                               <StatusButton 
                                 active={rosterStatus[student.id] === ATTENDANCE_STATUS.ABSENT}
                                 type="absent"
                                 onClick={() => setRosterStatus(prev => ({...prev, [student.id]: ATTENDANCE_STATUS.ABSENT}))}
                               />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
               </Card>

               <Button 
                 className="w-full py-7 font-black text-lg bg-primary rounded-2xl shadow-xl shadow-primary/20"
                 onClick={handleSubmitAttendance}
                 disabled={markBatchMutation.isPending}
                 requiresConnection
               >
                 <Save className="w-5 h-5 mr-3" />
                 {markBatchMutation.isPending ? 'Saving attendance...' : 'Submit attendance'}
               </Button>
            </div>
          )}
        </div>
      )}

      {/* SESSION HISTORY VIEW */}
      {activeView === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-500">
           <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Filter by Module</Label>
            <select 
              value={selectedModuleId || ''} 
              onChange={(e) => setSelectedModuleId(e.target.value || null)}
              className="flex h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">All Assigned Modules</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
            </select>
          </div>

          <div className="grid gap-3">
             {loadingSessions ? (
               Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
             ) : moduleSessions.length === 0 ? (
               <Card className="border-dashed py-12">
                 <CardContent className="flex flex-col items-center justify-center text-center opacity-40">
                   <History className="w-10 h-10 mb-3" />
                   <p className="text-sm font-medium">No teaching history found</p>
                 </CardContent>
               </Card>
             ) : (
               [...moduleSessions]
                 .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
                 .map(session => {
                   const sessionModule = modules.find(m => m.id === session.module_id);
                   return (
                     <Card key={session.id} className="border-border hover:border-primary/20 transition-all shadow-none">
                       <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div className="flex gap-4">
                            <div className="bg-muted rounded-xl px-4 py-2 flex flex-col items-center justify-center min-w-[70px]">
                               <span className="text-[10px] font-bold text-muted-foreground uppercase">Sess</span>
                               <span className="text-xl font-black text-primary">#{session.session_number}</span>
                            </div>
                            <div className="space-y-0.5">
                               <div className="flex items-center gap-2">
                                 <h4 className="text-sm font-bold text-foreground">{session.topic || 'No topic defined'}</h4>
                                 <Badge className="bg-primary/5 text-primary border-0 text-[9px] font-black">{sessionModule?.code ?? '—'}</Badge>
                               </div>
                               <p className="text-xs text-muted-foreground font-medium">{format(new Date(session.session_date), 'PPP')}</p>
                               <SessionStats sessionId={session.id} />
                            </div>
                         </div>
                         <SessionStatusIndicator sessionId={session.id} onMark={() => handleMarkModule(session.module_id)} />
                       </CardContent>
                     </Card>
                   );
                 })
             )}
          </div>
        </div>
      )}

      <Dialog open={overwriteDialogOpen} onOpenChange={setOverwriteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attendance already recorded</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Attendance for this session has already been submitted. Proceeding will overwrite the existing records. Are you sure?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOverwriteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmOverwrite} disabled={markBatchMutation.isPending}>
              {markBatchMutation.isPending ? 'Saving...' : 'Overwrite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-components for cleaner architectural flow

function ModuleStats({ moduleId }: { moduleId: string }) {
  const { data: students = [], isLoading: loadingStudents } = useEnrolledStudents(moduleId);
  const { data: sessions = [], isLoading: loadingSessions } = useSessions(moduleId);

  if (loadingStudents || loadingSessions) {
    return <Skeleton className="h-4 w-32 mt-4" />;
  }

  return (
    <div className="mt-4 space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="w-3.5 h-3.5" />
        <span>{students.length} students enrolled</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="w-3.5 h-3.5" />
        <span>{sessions.length} sessions</span>
      </div>
    </div>
  );
}

function AtRiskList({ moduleId, threshold }: { moduleId: string, threshold: number }) {
  const { data: atRisk = [], isLoading } = useAtRiskStudents(moduleId, threshold);
  
  if (isLoading) return <div className="space-y-2 mt-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
  if (atRisk.length === 0) return (
    <div className="flex items-center gap-2 text-secondary py-2">
      <CheckCircle2 className="w-4 h-4" />
      <span className="text-xs font-semibold">All students are compliant</span>
    </div>
  );

  return (
    <div className="space-y-2 mt-2">
      {atRisk.map(s => (
        <div key={s.id} className="flex items-center justify-between bg-white border border-border p-3 rounded-lg shadow-sm">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--warning))]" />
              <span className="text-xs font-bold">{s.full_name}</span>
           </div>
           <div className="flex items-center gap-3">
              <span className="text-xs font-black text-[hsl(var(--warning))]">{s.stats.percentage.toFixed(1)}%</span>
              <Badge className="bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/20 border-0 text-[9px] font-bold px-2 py-0.5">AT RISK</Badge>
           </div>
        </div>
      ))}
    </div>
  );
}

function StatusButton({ type, active, onClick }: { type: 'present' | 'late' | 'absent', active: boolean, onClick: () => void }) {
  const configs = {
    present: { label: 'P', activeClass: 'bg-secondary text-white' },
    late: { label: 'L', activeClass: 'bg-[hsl(var(--warning))] text-white' },
    absent: { label: 'A', activeClass: 'bg-destructive text-white' }
  };
  const config = configs[type];
  
  return (
    <button 
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
        active ? config.activeClass : 'bg-transparent text-muted-foreground hover:bg-muted'
      }`}
    >
      {config.label}
    </button>
  );
}

function SessionStats({ sessionId }: { sessionId: string }) {
  const { data: records = [] } = useAttendance(sessionId);
  if (records.length === 0) return null;
  
  const present = records.filter(r => r.status === ATTENDANCE_STATUS.PRESENT).length;
  const late = records.filter(r => r.status === ATTENDANCE_STATUS.LATE).length;
  const absent = records.filter(r => r.status === ATTENDANCE_STATUS.ABSENT).length;

  return (
    <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">
       <span className="text-secondary">{present} Present</span>
       <span className="text-[hsl(var(--warning))]">{late} Late</span>
       <span className="text-destructive">{absent} Absent</span>
    </div>
  );
}

function SessionStatusIndicator({ sessionId, onMark }: { sessionId: string, onMark: () => void }) {
  const { data: records = [], isLoading } = useAttendance(sessionId);
  
  if (isLoading) return <Skeleton className="h-6 w-20" />;
  
  if (records.length > 0) {
    return (
      <div className="flex items-center gap-1.5 text-secondary">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-xs font-bold">Marked</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
       <div className="flex items-center gap-1.5 text-[hsl(var(--warning))]">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-bold">Unmarked</span>
       </div>
       <Button size="sm" variant="ghost" className="text-primary font-bold hover:bg-primary/5 h-8" onClick={onMark}>
          Mark Now
       </Button>
    </div>
  );
}
