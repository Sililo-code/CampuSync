import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { GraduationCap, Calendar, Users, BarChart, CheckCircle2, TrendingUp, Shield } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Class Tracker</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Cavendish University Zambia</p>
            </div>
          </div>
          <Button onClick={() => navigate('/auth')} size="lg" className="font-semibold">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
        <div className="container mx-auto px-4 py-20 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left space-y-8">
              <div className="inline-block">
                <span className="text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full">
                  Modern Attendance Management
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Streamline Academic
                <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Attendance Tracking
                </span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                Empower students, lecturers, and administrators with a comprehensive digital solution for managing attendance efficiently and transparently.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={() => navigate('/auth')} size="lg" className="text-base px-8 py-6 font-semibold">
                  Get Started Now
                </Button>
                <Button onClick={() => navigate('/auth')} variant="outline" size="lg" className="text-base px-8 py-6 font-semibold">
                  Learn More
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  <span className="text-sm text-muted-foreground">Real-time Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-secondary" />
                  <span className="text-sm text-muted-foreground">Secure & Reliable</span>
                </div>
              </div>
            </div>
            <div className="relative lg:h-[500px] hidden lg:block">
              <img 
                src={heroImage} 
                alt="Students in modern lecture hall with laptops" 
                className="rounded-2xl shadow-2xl object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need in One Platform
            </h3>
            <p className="text-lg text-muted-foreground">
              Designed specifically for academic institutions to enhance attendance management and reporting
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Student Portal</h4>
              <p className="text-muted-foreground leading-relaxed">
                Quick and easy attendance marking with instant confirmation. View your attendance history and track your progress throughout the semester.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-secondary" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Lecturer Dashboard</h4>
              <p className="text-muted-foreground leading-relaxed">
                Create and manage modules effortlessly. Enroll students, track attendance patterns, and generate comprehensive analytics reports.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                <BarChart className="w-7 h-7 text-accent" />
              </div>
              <h4 className="text-xl font-semibold mb-3">Admin Control Panel</h4>
              <p className="text-muted-foreground leading-relaxed">
                Complete oversight of the entire system. Manage users, monitor attendance trends, and access detailed institutional analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-3xl p-12 md:p-16">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div>
                <TrendingUp className="w-10 h-10 text-primary mx-auto mb-4" />
                <div className="text-4xl font-bold mb-2">99.9%</div>
                <div className="text-muted-foreground">System Uptime</div>
              </div>
              <div>
                <CheckCircle2 className="w-10 h-10 text-secondary mx-auto mb-4" />
                <div className="text-4xl font-bold mb-2">Real-time</div>
                <div className="text-muted-foreground">Attendance Updates</div>
              </div>
              <div>
                <Shield className="w-10 h-10 text-accent mx-auto mb-4" />
                <div className="text-4xl font-bold mb-2">Secure</div>
                <div className="text-muted-foreground">Data Protection</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold">
              Ready to Transform Your Attendance Management?
            </h3>
            <p className="text-lg text-muted-foreground">
              Join Cavendish University Zambia in embracing modern, efficient academic administration
            </p>
            <Button onClick={() => navigate('/auth')} size="lg" className="text-lg px-10 py-7 font-semibold">
              Get Started Today
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">Class Tracker</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Cavendish University Zambia. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
