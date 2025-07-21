import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Vote, Plus, Upload, Play, Square, Trophy, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface Event {
  id: string;
  name: string;
}

interface VotingSession {
  id: string;
  event_id: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  events: {
    name: string;
  };
}

interface VotingPhoto {
  id: string;
  voting_session_id: string;
  title: string;
  photo_url: string;
  vote_count: number;
  created_at: string;
}

const Voting = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [votingSessions, setVotingSessions] = useState<VotingSession[]>([]);
  const [votingPhotos, setVotingPhotos] = useState<VotingPhoto[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<VotingSession | null>(null);
  const [sessionFormData, setSessionFormData] = useState({
    title: '',
    description: ''
  });
  const [photoFormData, setPhotoFormData] = useState({
    title: '',
    photo: null as File | null
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchVotingSessions();
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedSession) {
      fetchVotingPhotos();
    }
  }, [selectedSession]);

  useEffect(() => {
    // Set up real-time subscription for votes
    const channel = supabase
      .channel('voting-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => {
          fetchVotingPhotos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSession]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name')
        .eq('is_active', true)
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
      if (data?.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0].id);
      }
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

  const fetchVotingSessions = async () => {
    if (!selectedEvent) return;

    try {
      const { data, error } = await supabase
        .from('voting_sessions')
        .select(`
          *,
          events (
            name
          )
        `)
        .eq('event_id', selectedEvent)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVotingSessions(data || []);
      if (data?.length > 0 && !selectedSession) {
        setSelectedSession(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchVotingPhotos = async () => {
    if (!selectedSession) return;

    try {
      const { data, error } = await supabase
        .from('voting_photos')
        .select('*')
        .eq('voting_session_id', selectedSession)
        .order('vote_count', { ascending: false });

      if (error) throw error;
      setVotingPhotos(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      const sessionData = {
        ...sessionFormData,
        event_id: selectedEvent
      };

      if (editingSession) {
        const { error } = await supabase
          .from('voting_sessions')
          .update(sessionData)
          .eq('id', editingSession.id);

        if (error) throw error;

        toast({
          title: "Session updated",
          description: "Voting session has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('voting_sessions')
          .insert([sessionData]);

        if (error) throw error;

        toast({
          title: "Session created",
          description: "Voting session has been created successfully.",
        });
      }

      setShowSessionDialog(false);
      setEditingSession(null);
      setSessionFormData({ title: '', description: '' });
      fetchVotingSessions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFormData.photo || !selectedSession) return;

    try {
      // In a real implementation, you would upload to Supabase Storage
      const photoUrl = URL.createObjectURL(photoFormData.photo);

      const { error } = await supabase
        .from('voting_photos')
        .insert([{
          voting_session_id: selectedSession,
          title: photoFormData.title,
          photo_url: photoUrl,
          vote_count: 0
        }]);

      if (error) throw error;

      toast({
        title: "Photo added",
        description: "Photo has been added to the voting session.",
      });

      setShowPhotoDialog(false);
      setPhotoFormData({ title: '', photo: null });
      fetchVotingPhotos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleSessionStatus = async (sessionId: string, currentStatus: boolean) => {
    try {
      // First, deactivate all other sessions
      if (!currentStatus) {
        await supabase
          .from('voting_sessions')
          .update({ is_active: false })
          .eq('event_id', selectedEvent);
      }

      // Then activate/deactivate the selected session
      const { error } = await supabase
        .from('voting_sessions')
        .update({ is_active: !currentStatus })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Session stopped" : "Session started",
        description: `Voting session is now ${currentStatus ? 'inactive' : 'active'}.`,
      });

      fetchVotingSessions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure? This will delete all photos and votes for this session.')) return;

    try {
      const { error } = await supabase
        .from('voting_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Session deleted",
        description: "Voting session has been deleted successfully.",
      });

      setSelectedSession('');
      fetchVotingSessions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo and all its votes?')) return;

    try {
      const { error } = await supabase
        .from('voting_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Photo deleted",
        description: "Photo has been removed from the voting session.",
      });

      fetchVotingPhotos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalVotes = votingPhotos.reduce((sum, photo) => sum + photo.vote_count, 0);
  const winningPhoto = votingPhotos[0]; // Since we order by vote_count desc

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
          <h1 className="text-3xl font-bold">Voting System</h1>
          <p className="text-muted-foreground">
            Create voting sessions and manage photo competitions
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingSession(null);
                setSessionFormData({ title: '', description: '' });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSession ? 'Edit Voting Session' : 'Create Voting Session'}
                </DialogTitle>
                <DialogDescription>
                  {editingSession 
                    ? 'Update the voting session details'
                    : 'Set up a new photo voting session'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSessionSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Session Title</Label>
                  <Input
                    id="title"
                    value={sessionFormData.title}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, title: e.target.value })}
                    placeholder="e.g., Best Photo Contest"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={sessionFormData.description}
                    onChange={(e) => setSessionFormData({ ...sessionFormData, description: e.target.value })}
                    placeholder="Describe the voting criteria..."
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingSession ? 'Update Session' : 'Create Session'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          
          {selectedSession && (
            <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Add Photo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Photo</DialogTitle>
                  <DialogDescription>
                    Add a photo to the current voting session
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePhotoSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="photoTitle">Photo Title</Label>
                    <Input
                      id="photoTitle"
                      value={photoFormData.title}
                      onChange={(e) => setPhotoFormData({ ...photoFormData, title: e.target.value })}
                      placeholder="Enter photo title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photo">Photo File</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhotoFormData({ ...photoFormData, photo: e.target.files?.[0] || null })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={!photoFormData.photo}>
                    Add Photo
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Event Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <Label htmlFor="event">Select Event:</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose an event" />
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
        </CardContent>
      </Card>

      {/* Voting Sessions */}
      {selectedEvent && (
        <>
          {votingSessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No voting sessions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first voting session to get started
                </p>
                <Button onClick={() => setShowSessionDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Session Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Voting Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {votingSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedSession(session.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="font-medium">{session.title}</div>
                            <Badge variant={session.is_active ? "default" : "secondary"}>
                              {session.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          {session.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {session.description}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={session.is_active ? "destructive" : "default"}
                            onClick={() => toggleSessionStatus(session.id, session.is_active)}
                          >
                            {session.is_active ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingSession(session);
                              setSessionFormData({
                                title: session.title,
                                description: session.description || ''
                              });
                              setShowSessionDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteSession(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Voting Results */}
              {selectedSession && votingPhotos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        Live Results
                      </span>
                      <Badge variant="outline">
                        {totalVotes} total votes
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {votingPhotos.map((photo, index) => (
                        <div key={photo.id} className="relative">
                          <Card className={index === 0 ? "ring-2 ring-yellow-500" : ""}>
                            <CardContent className="p-4">
                              <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-3">
                                <img
                                  src={photo.photo_url}
                                  alt={photo.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium">{photo.title}</h3>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deletePhoto(photo.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>{photo.vote_count} votes</span>
                                    <span>
                                      {totalVotes > 0 ? Math.round((photo.vote_count / totalVotes) * 100) : 0}%
                                    </span>
                                  </div>
                                  <Progress 
                                    value={totalVotes > 0 ? (photo.vote_count / totalVotes) * 100 : 0} 
                                    className="h-2"
                                  />
                                </div>
                                {index === 0 && photo.vote_count > 0 && (
                                  <Badge className="w-full justify-center bg-yellow-600">
                                    <Trophy className="mr-1 h-3 w-3" />
                                    Leading
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State for Photos */}
              {selectedSession && votingPhotos.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No photos in this session</h3>
                    <p className="text-muted-foreground mb-4">
                      Add photos for people to vote on
                    </p>
                    <Button onClick={() => setShowPhotoDialog(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Add Photo
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Voting;