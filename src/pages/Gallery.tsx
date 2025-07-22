import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, Play, Pause, SkipForward, SkipBack, Trash2, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Event {
  id: string;
  name: string;
}

interface GalleryPhoto {
  id: string;
  event_id: string;
  attendee_name: string;
  photo_url: string;
  is_approved: boolean;
  created_at: string;
  events: {
    name: string;
  };
}

const Gallery = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [slideshow, setSlideshow] = useState({
    active: false,
    currentIndex: 0,
    interval: null as NodeJS.Timeout | null
  });
  const [uploadData, setUploadData] = useState({
    attendee_name: '',
    photo: null as File | null
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchPhotos();
    }
  }, [selectedEvent]);

  useEffect(() => {
    // Set up real-time subscription for new photos
    const channel = supabase
      .channel('gallery-photos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gallery_photos' },
        () => {
          fetchPhotos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (slideshow.interval) {
        clearInterval(slideshow.interval);
      }
    };
  }, [selectedEvent]);

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

  const fetchPhotos = async () => {
    if (!selectedEvent) return;

    try {
      const { data, error } = await supabase
        .from('gallery_photos')
        .select(`
          *,
          events (
            name
          )
        `)
        .eq('event_id', selectedEvent)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.photo || !selectedEvent) return;

    try {
      // In a real implementation, you would upload to Supabase Storage
      // For now, we'll create a mock URL
      const photoUrl = URL.createObjectURL(uploadData.photo);

      const { error } = await supabase
        .from('gallery_photos')
        .insert([{
          event_id: selectedEvent,
          attendee_name: uploadData.attendee_name,
          photo_url: photoUrl,
          is_approved: true // Auto-approve for demo
        }]);

      if (error) throw error;

      toast({
        title: "Photo uploaded",
        description: "Photo has been added to the gallery.",
      });

      setShowUploadDialog(false);
      setUploadData({ attendee_name: '', photo: null });
      fetchPhotos();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const togglePhotoApproval = async (photoId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('gallery_photos')
        .update({ is_approved: !currentStatus })
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Photo hidden" : "Photo approved",
        description: `Photo has been ${currentStatus ? 'hidden from' : 'added to'} the public gallery.`,
      });

      fetchPhotos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const { error } = await supabase
        .from('gallery_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Photo deleted",
        description: "Photo has been removed from the gallery.",
      });

      fetchPhotos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startSlideshow = () => {
    const approvedPhotos = photos.filter(p => p.is_approved);
    if (approvedPhotos.length === 0) return;

    const interval = setInterval(() => {
      setSlideshow(prev => ({
        ...prev,
        currentIndex: (prev.currentIndex + 1) % approvedPhotos.length
      }));
    }, 3000); // Change slide every 3 seconds

    setSlideshow(prev => ({
      ...prev,
      active: true,
      interval
    }));
  };

  const stopSlideshow = () => {
    if (slideshow.interval) {
      clearInterval(slideshow.interval);
    }
    setSlideshow(prev => ({
      ...prev,
      active: false,
      interval: null
    }));
  };

  const navigateSlide = (direction: 'prev' | 'next') => {
    const approvedPhotos = photos.filter(p => p.is_approved);
    if (approvedPhotos.length === 0) return;

    setSlideshow(prev => ({
      ...prev,
      currentIndex: direction === 'next' 
        ? (prev.currentIndex + 1) % approvedPhotos.length
        : (prev.currentIndex - 1 + approvedPhotos.length) % approvedPhotos.length
    }));
  };

  const approvedPhotos = photos.filter(p => p.is_approved);
  const currentPhoto = approvedPhotos[slideshow.currentIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Photo Gallery
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage event photos and control slideshow display
          </p>
        </div>
        <div className="flex gap-3">
          {!slideshow.active ? (
            <Button 
              onClick={startSlideshow} 
              disabled={approvedPhotos.length === 0}
              variant="gradient"
              size="lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Start Slideshow
            </Button>
          ) : (
            <Button onClick={stopSlideshow} variant="destructive" size="lg">
              <Pause className="mr-2 h-5 w-5" />
              Stop Slideshow
            </Button>
          )}
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="lg">
                <Upload className="mr-2 h-5 w-5" />
                Upload Photo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Photo</DialogTitle>
                <DialogDescription>
                  Add a new photo to the event gallery
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePhotoUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="attendee_name">Uploaded by</Label>
                  <Input
                    id="attendee_name"
                    value={uploadData.attendee_name}
                    onChange={(e) => setUploadData({ ...uploadData, attendee_name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo">Photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadData({ ...uploadData, photo: e.target.files?.[0] || null })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!uploadData.photo}>
                  Upload Photo
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Event Selection */}
      <Card className="border-primary/20 shadow-glow">
        <CardContent className="pt-8">
          <div className="flex gap-6 items-center">
            <Label htmlFor="event" className="text-lg font-semibold">Select Event:</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-80 h-12 border-primary/30 shadow-sm">
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent className="glass backdrop-blur-xl">
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id} className="hover:bg-primary/10">
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Slideshow Display */}
      {slideshow.active && currentPhoto && (
        <Card className="border-primary/30 shadow-xl bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-3">
                <div className="p-2 bg-gradient-primary rounded-lg">
                  <Camera className="h-6 w-6 text-primary-foreground" />
                </div>
                Live Slideshow
              </span>
              <div className="flex gap-3">
                <Button size="sm" variant="glass" onClick={() => navigateSlide('prev')}>
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button size="sm" variant="glass" onClick={() => navigateSlide('next')}>
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl overflow-hidden shadow-inner border border-primary/10">
              <img
                src={currentPhoto.photo_url}
                alt="Gallery slideshow"
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-6 left-6 glass px-4 py-2 rounded-xl backdrop-blur-md">
                <div className="text-foreground font-medium">
                  {currentPhoto.attendee_name && `By ${currentPhoto.attendee_name} • `}
                  {slideshow.currentIndex + 1} of {approvedPhotos.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Grid */}
      {selectedEvent && (
        <Card>
          <CardHeader>
            <CardTitle>Gallery ({photos.length} photos)</CardTitle>
            <CardDescription>
              Manage photos uploaded by attendees
            </CardDescription>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload the first photo to start the gallery
                </p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="group relative">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img
                        src={photo.photo_url}
                        alt="Gallery photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => togglePhotoApproval(photo.id, photo.is_approved)}
                        >
                          {photo.is_approved ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={() => deletePhoto(photo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center justify-between">
                          {photo.attendee_name && (
                            <span className="text-white text-sm font-medium">
                              {photo.attendee_name}
                            </span>
                          )}
                          <Badge variant={photo.is_approved ? "default" : "secondary"}>
                            {photo.is_approved ? "Visible" : "Hidden"}
                          </Badge>
                        </div>
                        <div className="text-white text-xs opacity-75 mt-1">
                          {new Date(photo.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Gallery;