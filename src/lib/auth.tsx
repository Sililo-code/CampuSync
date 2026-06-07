import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  isInitialised: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialised, setIsInitialised] = useState(false);
  const navigate = useNavigate();
  
  // Track the last processed user ID to deduplicate SIGNED_IN events
  const lastProcessedUserId = useRef<string | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      return data?.role ?? null;
    } catch (error) {
      console.error('Unexpected error fetching user role:', error);
      return null;
    }
  };

  useEffect(() => {
    // onAuthStateChange is the single source of truth for all auth state.
    // INITIAL_SESSION event fires automatically on mount with current session state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // 1. Synchronous Deduplication
        if (event === 'SIGNED_IN') {
          if (session?.user?.id === lastProcessedUserId.current) {
            return;
          }
          lastProcessedUserId.current = session?.user?.id ?? null;
        }

        if (event === 'SIGNED_OUT') {
          lastProcessedUserId.current = null;
        }

        // 2. Synchronous State Updates
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setLoading(true);
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // 3. Deferred Async Work (fetchUserRole and navigate)
        // We use setTimeout(0) to ensure Supabase has committed the session JWT to storage.
        setTimeout(() => {
          const processAuthChange = async () => {
            if (session?.user) {
              const role = await fetchUserRole(session.user.id);
              setUserRole(role);
              
              // Navigate only after role is confirmed
              if (event === 'SIGNED_IN') {
                if (role === 'student') navigate('/dashboard/student');
                else if (role === 'lecturer') navigate('/dashboard/lecturer');
                else if (role === 'admin') navigate('/dashboard/admin');
                else navigate('/dashboard');
              }
            } else {
              setUserRole(null);
            }
            
            setLoading(false);
            setIsInitialised(true);
          };

          processAuthChange();
        }, 0);
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    lastProcessedUserId.current = null;
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, loading, isInitialised, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
