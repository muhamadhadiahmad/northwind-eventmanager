import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CalendarDays, Users, QrCode, Camera, Vote, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <CalendarDays className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Event Manager
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Complete event management solution with attendee registration, QR codes, photo galleries, voting systems, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="text-lg px-8">
              Sign In
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 rounded-lg border bg-card">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Attendee Management</h3>
            <p className="text-muted-foreground">
              Register attendees, manage check-ins, and organize seating arrangements with ease.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border bg-card">
            <QrCode className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">QR Code Integration</h3>
            <p className="text-muted-foreground">
              Auto-generate QR codes for registration, check-ins, and access to event features.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border bg-card">
            <Camera className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Photo Gallery</h3>
            <p className="text-muted-foreground">
              Enable attendees to upload photos with real-time slideshow displays.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border bg-card">
            <Vote className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Voting System</h3>
            <p className="text-muted-foreground">
              Create voting sessions with real-time results and live presentation modes.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border bg-card">
            <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Lucky Draw</h3>
            <p className="text-muted-foreground">
              Random winner selection with animated drawing experience and fullscreen mode.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border bg-card">
            <CalendarDays className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Multi-Company</h3>
            <p className="text-muted-foreground">
              Support for multiple companies with role-based access and isolated data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
