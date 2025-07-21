import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays, MapPin, Users, CheckCircle } from 'lucide-react';
import QRCode from 'qrcode';

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  max_attendees: number;
}

const PublicRegister = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    identification_number: '',
    staff_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error: any) {
      toast({
        title: "Event not found",
        description: "This event is not available for registration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAttendeeQR = async (attendeeId: string) => {
    const checkinUrl = `${window.location.origin}/checkin/${attendeeId}`;
    return await QRCode.toDataURL(checkinUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setSubmitting(true);

    try {
      // Create attendee
      const { data: newAttendee, error } = await supabase
        .from('attendees')
        .insert([{
          ...formData,
          event_id: event.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Generate QR code
      const qrCodeData = await generateAttendeeQR(newAttendee.id);
      
      // Update attendee with QR code
      await supabase
        .from('attendees')
        .update({ qr_code: qrCodeData })
        .eq('id', newAttendee.id);

      setQrCode(qrCodeData);
      setRegistered(true);

      toast({
        title: "Registration successful!",
        description: "You have been registered for the event. Save your QR code for check-in.",
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `${event?.name}-qr-code.png`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Event not found</h3>
            <p className="text-muted-foreground">
              This event is not available for registration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-600">Registration Successful!</CardTitle>
            <CardDescription>
              You're all set for {event.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Save this QR code to check in at the event:
              </p>
              {qrCode && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img src={qrCode} alt="Check-in QR Code" className="max-w-48" />
                  </div>
                  <Button onClick={downloadQRCode} className="w-full">
                    Download QR Code
                  </Button>
                </div>
              )}
            </div>
            
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {new Date(event.event_date).toLocaleString()}
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {event.location}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        {/* Event Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{event.name}</CardTitle>
            {event.description && (
              <CardDescription className="text-base">
                {event.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {new Date(event.event_date).toLocaleString()}
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {event.location}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Max {event.max_attendees} attendees
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Event Registration</CardTitle>
            <CardDescription>
              Please fill in your details to register for this event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="identification_number">ID Number</Label>
                  <Input
                    id="identification_number"
                    value={formData.identification_number}
                    onChange={(e) => setFormData({ ...formData, identification_number: e.target.value })}
                    placeholder="ID number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff_id">Staff ID</Label>
                  <Input
                    id="staff_id"
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    placeholder="Staff ID (if applicable)"
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Registering...' : 'Register for Event'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicRegister;