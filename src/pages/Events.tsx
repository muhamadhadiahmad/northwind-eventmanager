import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, CalendarDays, MapPin, Users, Edit, Trash2, QrCode as QrCodeIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import QRCode from 'qrcode';

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  max_attendees: number;
  registration_qr: string;
  is_active: boolean;
  created_at: string;
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_date: '',
    location: '',
    max_attendees: 100
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRegistrationQR = async (eventId: string) => {
    const registrationUrl = `${window.location.origin}/register/${eventId}`;
    return await QRCode.toDataURL(registrationUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.company_id) {
        toast({
          title: "No Company",
          description: "Please set up your company first.",
          variant: "destructive",
        });
        return;
      }

      const eventData = {
        ...formData,
        company_id: profile.company_id,
        created_by: user?.id,
        registration_qr: ''
      };

      if (editingEvent) {
        // Update event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;

        toast({
          title: "Event updated",
          description: "Event has been updated successfully.",
        });
      } else {
        // Create event
        const { data: newEvent, error } = await supabase
          .from('events')
          .insert([eventData])
          .select()
          .single();

        if (error) throw error;

        // Generate QR code
        const qrCodeData = await generateRegistrationQR(newEvent.id);
        await supabase
          .from('events')
          .update({ registration_qr: qrCodeData })
          .eq('id', newEvent.id);

        toast({
          title: "Event created",
          description: "Event has been created successfully with QR code.",
        });
      }

      setShowCreateDialog(false);
      setEditingEvent(null);
      setFormData({
        name: '',
        description: '',
        event_date: '',
        location: '',
        max_attendees: 100
      });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description || '',
      event_date: event.event_date,
      location: event.location || '',
      max_attendees: event.max_attendees || 100
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Event deleted",
        description: "Event has been deleted successfully.",
      });
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">
            Manage your events and track attendees
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingEvent(null);
              setFormData({
                name: '',
                description: '',
                event_date: '',
                location: '',
                max_attendees: 100
              });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </DialogTitle>
              <DialogDescription>
                {editingEvent 
                  ? 'Update the event details below'
                  : 'Fill in the details to create a new event'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter event name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Event description"
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Date & Time</Label>
                  <Input
                    id="event_date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_attendees">Max Attendees</Label>
                  <Input
                    id="max_attendees"
                    type="number"
                    value={formData.max_attendees}
                    onChange={(e) => setFormData({ ...formData, max_attendees: parseInt(e.target.value) })}
                    min={1}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Event location"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first event to get started
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="group">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={event.is_active ? "default" : "secondary"}>
                        {event.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(event)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {event.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {event.description}
                  </p>
                )}
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
                  {event.registration_qr && (
                    <div className="flex items-center gap-2">
                      <QrCodeIcon className="h-4 w-4 text-muted-foreground" />
                      <span>QR Code generated</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;