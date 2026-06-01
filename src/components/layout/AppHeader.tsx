import { GraduationCap, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

/**
 * Persistent application header shown on all authenticated pages.
 * Displays the CampuSync brand, the institution name, and the sign-out action.
 *
 * NOTE: This component is scaffolded. It will be integrated into the
 * authenticated layout during Phase 2 of the CampuSync development roadmap.
 */
export default function AppHeader() {
  const { signOut } = useAuth();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">CampuSync</h1>
            <p className="text-xs text-muted-foreground">Cavendish University Zambia</p>
          </div>
        </div>
        <Button onClick={signOut} variant="outline" size="sm">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </header>
  );
}
