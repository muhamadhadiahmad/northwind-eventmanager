import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QrCode, Search, CheckSquare, Clock, Users } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface CheckInStats {
  totalAttendees: number;
  checkedIn: number;
  recentCheckIns: Array<{
    id: string;
    name: string;
    check_in_time: string;
    event_name: string;
  }>;
}

const CheckIn = () => {
  const [stats, setStats] = useState<CheckInStats>({ totalAttendees: 0, checkedIn: 0, recentCheckIns: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    
    // Set up real-time subscription for check-ins
    const channel = supabase
      .channel('check-ins')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'attendees' },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Get total attendees and checked in count
      const { data: attendeesData, error: attendeesError } = await supabase
        .from('attendees')
        .select(`
          id,
          name,
          checked_in,
          check_in_time,
          events (
            name
          )
        `);

      if (attendeesError) throw attendeesError;

      const totalAttendees = attendeesData?.length || 0;
      const checkedIn = attendeesData?.filter(a => a.checked_in)?.length || 0;
      
      // Get recent check-ins (last 10)
      const recentCheckIns = attendeesData
        ?.filter(a => a.checked_in && a.check_in_time)
        ?.sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime())
        ?.slice(0, 10)
        ?.map(a => ({
          id: a.id,
          name: a.name,
          check_in_time: a.check_in_time,
          event_name: a.events?.name || 'Unknown Event'
        })) || [];

      setStats({ totalAttendees, checkedIn, recentCheckIns });
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

  const handleCheckIn = async (attendeeId: string) => {
    try {
      const { data: attendee, error: fetchError } = await supabase
        .from('attendees')
        .select('name, checked_in')
        .eq('id', attendeeId)
        .single();

      if (fetchError) throw fetchError;

      if (attendee.checked_in) {
        toast({
          title: "Already checked in",
          description: `${attendee.name} is already checked in.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('attendees')
        .update({ 
          checked_in: true, 
          check_in_time: new Date().toISOString() 
        })
        .eq('id', attendeeId);

      if (error) throw error;

      toast({
        title: "Check-in successful",
        description: `${attendee.name} has been checked in.`,
      });

      fetchStats();
    } catch (error: any) {
      toast({
        title: "Check-in failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleManualCheckIn = async () => {
    if (!searchTerm) return;

    try {
      const { data: attendees, error } = await supabase
        .from('attendees')
        .select('id, name, identification_number, staff_id, checked_in')
        .or(`name.ilike.%${searchTerm}%,identification_number.ilike.%${searchTerm}%,staff_id.ilike.%${searchTerm}%`);

      if (error) throw error;

      if (!attendees || attendees.length === 0) {
        toast({
          title: "Not found",
          description: "No attendee found matching your search.",
          variant: "destructive",
        });
        return;
      }

      if (attendees.length > 1) {
        toast({
          title: "Multiple matches",
          description: "Please be more specific in your search.",
          variant: "destructive",
        });
        return;
      }

      const attendee = attendees[0];
      await handleCheckIn(attendee.id);
      setSearchTerm('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startQRScanner = () => {
    setScannerActive(true);
    
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        // Extract attendee ID from QR code URL
        const matches = decodedText.match(/\/checkin\/(.+)$/);
        if (matches) {
          handleCheckIn(matches[1]);
          scanner.clear();
          setScannerActive(false);
        } else {
          toast({
            title: "Invalid QR code",
            description: "This QR code is not valid for check-in.",
            variant: "destructive",
          });
        }
      },
      (errorMessage) => {
        // Handle scan errors silently
      }
    );
  };

  const stopQRScanner = () => {
    setScannerActive(false);
    const scanner = document.getElementById('qr-reader');
    if (scanner) {
      scanner.innerHTML = '';
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
      <div>
        <h1 className="text-3xl font-bold">Check-In System</h1>
        <p className="text-muted-foreground">
          Scan QR codes or manually check in attendees
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttendees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAttendees > 0 ? Math.round((stats.checkedIn / stats.totalAttendees) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.totalAttendees - stats.checkedIn}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR Scanner & Manual Check-in */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code Scanner
              </CardTitle>
              <CardDescription>
                Scan attendee QR codes for quick check-in
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!scannerActive ? (
                <Button onClick={startQRScanner} className="w-full">
                  Start QR Scanner
                </Button>
              ) : (
                <div>
                  <div id="qr-reader" className="mb-4"></div>
                  <Button onClick={stopQRScanner} variant="outline" className="w-full">
                    Stop Scanner
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Manual Check-in
              </CardTitle>
              <CardDescription>
                Search by name, ID number, or staff ID
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter name, ID, or staff ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualCheckIn()}
                />
                <Button onClick={handleManualCheckIn}>
                  Check In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Check-ins</CardTitle>
            <CardDescription>
              Latest attendee arrivals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentCheckIns.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No check-ins yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentCheckIns.map((checkIn) => (
                  <div key={checkIn.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{checkIn.name}</div>
                      <div className="text-sm text-muted-foreground">
                        <Badge variant="secondary" className="mr-2">
                          {checkIn.event_name}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {new Date(checkIn.check_in_time).toLocaleTimeString()}
                      </div>
                      <Badge className="bg-green-600">
                        Checked In
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckIn;