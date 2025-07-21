import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TableProperties, Plus, Users, Shuffle, Save, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';

interface Event {
  id: string;
  name: string;
}

interface EventTable {
  id: string;
  table_number: number;
  table_type: 'VVIP' | 'VIP' | 'Regular' | 'Staff';
  capacity: number;
  position_x: number;
  position_y: number;
  event_id: string;
}

interface Attendee {
  id: string;
  name: string;
  table_assignment: string | null;
}

const tableTypeColors = {
  VVIP: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white',
  VIP: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
  Regular: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
  Staff: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
};

const DraggableTable = ({ table, attendees }: { table: EventTable; attendees: Attendee[] }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: table.id,
  });

  const assignedAttendees = attendees.filter(a => a.table_assignment === table.id);
  
  const combinedStyle = {
    left: table.position_x,
    top: table.position_y,
    ...(transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      opacity: isDragging ? 0.5 : 1,
    } : {})
  };

  return (
    <div
      ref={setNodeRef}
      style={combinedStyle}
      {...listeners}
      {...attributes}
      className={`absolute cursor-move rounded-lg p-4 min-w-32 text-center shadow-lg border-2 border-white/20 ${tableTypeColors[table.table_type]}`}
    >
      <div className="font-bold text-sm">Table {table.table_number}</div>
      <div className="text-xs opacity-90">{table.table_type}</div>
      <div className="text-xs mt-1">
        {assignedAttendees.length}/{table.capacity}
      </div>
    </div>
  );
};

const DroppableArea = ({ children }: { children: React.ReactNode }) => {
  const { setNodeRef } = useDroppable({
    id: 'seating-area',
  });

  return (
    <div
      ref={setNodeRef}
      className="relative w-full h-96 border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/10 overflow-hidden"
      style={{ minHeight: '600px' }}
    >
      {children}
    </div>
  );
};

const Seating = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [tables, setTables] = useState<EventTable[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTable, setEditingTable] = useState<EventTable | null>(null);
  const [formData, setFormData] = useState<{
    table_number: number;
    table_type: 'VVIP' | 'VIP' | 'Regular' | 'Staff';
    capacity: number;
  }>({
    table_number: 1,
    table_type: 'Regular',
    capacity: 8
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchTables();
      fetchAttendees();
    }
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

  const fetchTables = async () => {
    if (!selectedEvent) return;

    try {
      const { data, error } = await supabase
        .from('event_tables')
        .select('*')
        .eq('event_id', selectedEvent)
        .order('table_number');

      if (error) throw error;
      setTables(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchAttendees = async () => {
    if (!selectedEvent) return;

    try {
      const { data, error } = await supabase
        .from('attendees')
        .select('id, name, table_assignment')
        .eq('event_id', selectedEvent);

      if (error) throw error;
      setAttendees(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      const tableData = {
        ...formData,
        event_id: selectedEvent,
        position_x: Math.random() * 400,
        position_y: Math.random() * 300
      };

      if (editingTable) {
        const { error } = await supabase
          .from('event_tables')
          .update(tableData)
          .eq('id', editingTable.id);

        if (error) throw error;

        toast({
          title: "Table updated",
          description: "Table has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('event_tables')
          .insert([tableData]);

        if (error) throw error;

        toast({
          title: "Table created",
          description: "Table has been created successfully.",
        });
      }

      setShowCreateDialog(false);
      setEditingTable(null);
      resetForm();
      fetchTables();
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
      table_number: Math.max(...tables.map(t => t.table_number), 0) + 1,
      table_type: 'Regular',
      capacity: 8
    });
  };

  const handleEdit = (table: EventTable) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      table_type: table.table_type,
      capacity: table.capacity
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table? All seat assignments will be removed.')) return;

    try {
      // First, remove all attendee assignments to this table
      await supabase
        .from('attendees')
        .update({ table_assignment: null })
        .eq('table_assignment', tableId);

      // Then delete the table
      const { error } = await supabase
        .from('event_tables')
        .delete()
        .eq('id', tableId);

      if (error) throw error;

      toast({
        title: "Table deleted",
        description: "Table has been deleted successfully.",
      });
      fetchTables();
      fetchAttendees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    if (!delta) return;

    const table = tables.find(t => t.id === active.id);
    if (!table) return;

    const newPosition = {
      position_x: Math.max(0, table.position_x + delta.x),
      position_y: Math.max(0, table.position_y + delta.y)
    };

    try {
      const { error } = await supabase
        .from('event_tables')
        .update(newPosition)
        .eq('id', table.id);

      if (error) throw error;
      fetchTables();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const randomAssignSeats = async () => {
    if (!selectedEvent || tables.length === 0) return;

    const unassignedAttendees = attendees.filter(a => !a.table_assignment);
    if (unassignedAttendees.length === 0) {
      toast({
        title: "No unassigned attendees",
        description: "All attendees are already assigned to tables.",
      });
      return;
    }

    try {
      const assignments: { [key: string]: string[] } = {};
      
      // Initialize assignments for each table
      tables.forEach(table => {
        const currentAssignees = attendees.filter(a => a.table_assignment === table.id);
        assignments[table.id] = currentAssignees.map(a => a.id);
      });

      // Randomly assign unassigned attendees
      const shuffled = [...unassignedAttendees].sort(() => Math.random() - 0.5);
      
      for (const attendee of shuffled) {
        // Find tables with available capacity
        const availableTables = tables.filter(table => 
          assignments[table.id].length < table.capacity
        );
        
        if (availableTables.length === 0) break;
        
        // Randomly select an available table
        const randomTable = availableTables[Math.floor(Math.random() * availableTables.length)];
        assignments[randomTable.id].push(attendee.id);
        
        // Update in database
        await supabase
          .from('attendees')
          .update({ table_assignment: randomTable.id })
          .eq('id', attendee.id);
      }

      toast({
        title: "Seats assigned",
        description: `${shuffled.length} attendees have been randomly assigned to tables.`,
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
          <h1 className="text-3xl font-bold">Seating Arrangement</h1>
          <p className="text-muted-foreground">
            Manage table layouts and assign attendees
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={randomAssignSeats} variant="outline">
            <Shuffle className="mr-2 h-4 w-4" />
            Auto Assign
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingTable(null);
                resetForm();
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTable ? 'Edit Table' : 'Add New Table'}
                </DialogTitle>
                <DialogDescription>
                  {editingTable 
                    ? 'Update the table details below'
                    : 'Configure a new table for the seating layout'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="table_number">Table Number</Label>
                    <Input
                      id="table_number"
                      type="number"
                      value={formData.table_number}
                      onChange={(e) => setFormData({ ...formData, table_number: parseInt(e.target.value) })}
                      min={1}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      min={1}
                      max={20}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="table_type">Table Type</Label>
                  <Select value={formData.table_type} onValueChange={(value: any) => setFormData({ ...formData, table_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VVIP">VVIP</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  {editingTable ? 'Update Table' : 'Add Table'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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

      {selectedEvent && (
        <>
          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Table Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Object.entries(tableTypeColors).map(([type, colorClass]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${colorClass}`}></div>
                    <span className="text-sm font-medium">{type}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Seating Layout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TableProperties className="h-5 w-5" />
                Seating Layout
              </CardTitle>
              <CardDescription>
                Drag tables to arrange the seating layout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DndContext onDragEnd={handleDragEnd}>
                <DroppableArea>
                  {tables.map((table) => (
                    <DraggableTable
                      key={table.id}
                      table={table}
                      attendees={attendees}
                    />
                  ))}
                  {tables.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <TableProperties className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No tables yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Add tables to start creating your seating layout
                        </p>
                        <Button onClick={() => setShowCreateDialog(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Table
                        </Button>
                      </div>
                    </div>
                  )}
                </DroppableArea>
              </DndContext>
            </CardContent>
          </Card>

          {/* Tables List */}
          {tables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Table Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tables.map((table) => {
                    const assignedCount = attendees.filter(a => a.table_assignment === table.id).length;
                    return (
                      <div key={table.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-4 h-4 rounded ${tableTypeColors[table.table_type]}`}></div>
                          <div>
                            <div className="font-medium">Table {table.table_number}</div>
                            <div className="text-sm text-muted-foreground">
                              {table.table_type} • {assignedCount}/{table.capacity} seats
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(table)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDelete(table.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Seating;