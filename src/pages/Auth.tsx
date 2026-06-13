import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { signInSchema, signUpSchema } from '@/schemas';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student' as 'student' | 'lecturer' | 'admin',
  });
  
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = signUpSchema.parse(signUpData);
      
      const { error } = await supabase.auth.signUp({
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
        title: 'Account created successfully!',
        description: 'You can now sign in to your account.',
      });
      setMode('signin');
    } catch (error) {
      toast({
        title: 'Sign up failed',
        description: error instanceof Error ? error.message : 'An error occurred during sign up',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = signInSchema.parse(signInData);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) throw error;

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
    } catch (error) {
      toast({
        title: 'Sign in failed',
        description: error instanceof Error ? error.message : 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Decorative pseudo-elements via style tag */}
      <style>
        {`
          .auth-panel-left::before {
            content: '';
            position: absolute;
            top: -4rem;
            right: -4rem;
            width: 16rem;
            height: 16rem;
            border-radius: 9999px;
            border: 1px solid hsl(var(--accent) / 0.2);
            pointer-events: none;
            aria-hidden: true;
          }
          .auth-panel-left::after {
            content: '';
            position: absolute;
            bottom: -3rem;
            left: -3rem;
            width: 12rem;
            height: 12rem;
            border-radius: 9999px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            pointer-events: none;
          }
        `}
      </style>
      
      {/* Left Panel - Desktop Only */}
      <div className="hidden lg:flex lg:w-[55%] bg-primary relative overflow-hidden flex-col justify-between p-12 auth-panel-left">
        {/* Decorative circles (divs as requested) */}
        <div className="border border-[hsl(var(--accent))]/20 w-64 h-64 rounded-full absolute -top-16 -right-16 pointer-events-none" aria-hidden="true" />
        <div className="border border-white/[0.06] w-48 h-48 rounded-full absolute -bottom-12 -left-12 pointer-events-none" aria-hidden="true" />

        {/* Top: Logo Row */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-[hsl(var(--accent))] p-2 rounded-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-lg font-semibold tracking-tight">CampuSync</span>
        </div>

        {/* Center: Headline Block */}
        <div className="relative z-10">
          <h2 className="text-white text-3xl font-bold leading-tight tracking-tight mb-2">
            Track. Attend. Succeed.
          </h2>
          <p className="text-white/55 text-sm">
            Cavendish University Zambia's digital attendance platform
          </p>
        </div>

        {/* Bottom: Stat Tiles */}
        <div className="grid grid-cols-3 gap-4 relative z-10">
          <div className="bg-white/[0.07] border border-white/10 rounded-xl p-3">
            <div className="text-[hsl(var(--accent))] text-xl font-bold">1,240+</div>
            <div className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Sessions Tracked</div>
          </div>
          <div className="bg-white/[0.07] border border-white/10 rounded-xl p-3">
            <div className="text-[hsl(var(--accent))] text-xl font-bold">48</div>
            <div className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Active Modules</div>
          </div>
          <div className="bg-white/[0.07] border border-white/10 rounded-xl p-3">
            <div className="text-[hsl(var(--accent))] text-xl font-bold">94%</div>
            <div className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Avg Compliance</div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-white flex flex-col justify-center px-10 py-12">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile Logo Row */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="bg-primary p-2 rounded-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-primary text-lg font-semibold tracking-tight">CampuSync</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-primary tracking-tight mb-2">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your CampuSync account</p>
          </div>

          {/* Custom Toggle */}
          <div className="bg-muted rounded-lg p-1 flex mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                mode === 'signin' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                mode === 'signup' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="student@cuz.ac.zm"
                  value={signInData.email}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    className="pr-10"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    required
                  />
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-primary"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg py-2.5 text-sm font-semibold" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="John Doe"
                  value={signUpData.fullName}
                  onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="student@cuz.ac.zm"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    className="pr-10"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    required
                  />
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-primary"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg py-2.5 text-sm font-semibold" disabled={loading}>
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <span
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-[hsl(var(--accent))] font-medium cursor-pointer hover:underline"
              >
                {mode === 'signin' ? 'Create one' : 'Sign in'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
