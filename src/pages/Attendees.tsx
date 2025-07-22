import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Users, Search, Download, Upload, Edit, Trash2, QrCode as QrCodeIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import QRCode from 'qrcode';

interface Event {
  id: string;
  name: string;
}

interface Attendee {
  id: string;
  name: string;
  email: string;
  phone: string;
  identification_number: string;
  staff_id: string;
  qr_code: string;
  checked_in: boolean;
  check_in_time: string;
  event_id: string;
  events: {
    name: string;
  };
}

const Attendees = () => {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAttendee, setEditingAttendee] = useState<Attendee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    identification_number: '',
    staff_id: '',
    event_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    fetchAttendees();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name')
        .eq('is_active', true)
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchAttendees = async () => {
    try {
      const { data, error } = await supabase
        .from('attendees')
        .select(`
          *,
          events (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttendees(data || []);
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

  const generateAttendeeQR = async (attendeeId: string) => {
    const checkinUrl = `${window.location.origin}/checkin/${attendeeId}`;
    return await QRCode.toDataURL(checkinUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const attendeeData = { ...formData };

      if (editingAttendee) {
        // Update attendee
        const { error } = await supabase
          .from('attendees')
          .update(attendeeData)
          .eq('id', editingAttendee.id);

        if (error) throw error;

        toast({
          title: "Attendee updated",
          description: "Attendee has been updated successfully.",
        });
      } else {
        // Create attendee
        const { data: newAttendee, error } = await supabase
          .from('attendees')
          .insert([attendeeData])
          .select()
          .single();

        if (error) throw error;

        // Generate QR code
        const qrCodeData = await generateAttendeeQR(newAttendee.id);
        await supabase
          .from('attendees')
          .update({ qr_code: qrCodeData })
          .eq('id', newAttendee.id);

        toast({
          title: "Attendee created",
          description: "Attendee has been created successfully with QR code.",
        });
      }

      setShowCreateDialog(false);
      setEditingAttendee(null);
      resetForm();
      fetchAttendees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      identification_number: '',
      staff_id: '',
      event_id: ''
    });
  };

  const handleEdit = (attendee: Attendee) => {
    setEditingAttendee(attendee);
    setFormData({
      name: attendee.name,
      email: attendee.email || '',
      phone: attendee.phone || '',
      identification_number: attendee.identification_number || '',
      staff_id: attendee.staff_id || '',
      event_id: attendee.event_id
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (attendeeId: string) => {
    if (!confirm('Are you sure you want to delete this attendee?')) return;

    try {
      const { error } = await supabase
        .from('attendees')
        .delete()
        .eq('id', attendeeId);

      if (error) throw error;

      toast({
        title: "Attendee deleted",
        description: "Attendee has been deleted successfully.",
      });
      fetchAttendees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const filteredAttendees = attendees.filter(attendee =>
      (selectedEvent === 'all' || attendee.event_id === selectedEvent) &&
      (searchTerm === '' || 
        attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendee.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    const headers = ['Name', 'Email', 'Phone', 'ID Number', 'Staff ID', 'Event', 'Checked In'];
    const csvContent = [
      headers.join(','),
      ...filteredAttendees.map(attendee => 
        [
          attendee.name,
          attendee.email || '',
          attendee.phone || '',
          attendee.identification_number || '',
          attendee.staff_id || '',
          attendee.events?.name || '',
          attendee.checked_in ? 'Yes' : 'No'
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendees.csv';
    a.click();
  };

  const filteredAttendees = attendees.filter(attendee =>
    (selectedEvent === 'all' || attendee.event_id === selectedEvent) &&
    (searchTerm === '' || 
      attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
          <h1 className="text-3xl font-bold">Attendees</h1>
          <p className="text-muted-foreground">
            Manage event attendees and track registrations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingAttendee(null);
                resetForm();
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Attendee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAttendee ? 'Edit Attendee' : 'Add New Attendee'}
                </DialogTitle>
                <DialogDescription>
                  {editingAttendee 
                    ? 'Update the attendee details below'
                    : 'Fill in the details to add a new attendee'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="event">Event</Label>
                  <Select value={formData.event_id} onValueChange={(value) => setFormData({ ...formData, event_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
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
                      placeholder="email@example.com"
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
                <Button type="submit" className="w-full">
                  {editingAttendee ? 'Update Attendee' : 'Add Attendee'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search attendees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendees Table */}
      {filteredAttendees.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No attendees yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first attendee to get started
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Attendee
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Attendees ({filteredAttendees.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>QR Code</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendees.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{attendee.name}</div>
                        {attendee.identification_number && (
                          <div className="text-sm text-muted-foreground">
                            ID: {attendee.identification_number}
                          </div>
                        )}
                        {attendee.staff_id && (
                          <div className="text-sm text-muted-foreground">
                            Staff: {attendee.staff_id}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {attendee.events?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {attendee.email && <div>{attendee.email}</div>}
                        {attendee.phone && <div className="text-muted-foreground">{attendee.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={attendee.checked_in ? "default" : "secondary"}>
                        {attendee.checked_in ? "Checked In" : "Not Checked In"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {attendee.qr_code && (
                        <div className="flex items-center gap-2">
                          <QrCodeIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-muted-foreground">Generated</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(attendee)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDelete(attendee.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Attendees;