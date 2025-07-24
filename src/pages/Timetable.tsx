import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Plus, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TimetableEntry {
  id: string;
  batch_id: string;
  day_of_week: number;
  time_slot: string;
  subject: string;
  faculty_id: string | null;
  room: string | null;
  batch?: { name: string };
  faculty?: { full_name: string };
}

interface Batch {
  id: string;
  name: string;
}

interface Faculty {
  user_id: string;
  full_name: string;
}

export const TimetablePage = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [formData, setFormData] = useState({
    batch_id: "",
    day_of_week: "",
    time_slot: "",
    subject: "",
    faculty_id: "",
    room: ""
  });

  const isAcademicSection = user?.role === "Academic Section";
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const timeSlots = [
    "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00",
    "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchTimetable(selectedBatch);
    }
  }, [selectedBatch]);

  const fetchData = async () => {
    try {
      // Fetch batches
      const { data: batchData, error: batchError } = await supabase
        .from("batches")
        .select("id, name")
        .order("name");

      if (batchError) throw batchError;
      setBatches(batchData || []);

      // Fetch faculty
      const { data: facultyData, error: facultyError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("role", "Faculty");

      if (facultyError) throw facultyError;
      setFaculty(facultyData || []);

      // Set default batch
      if (batchData && batchData.length > 0) {
        setSelectedBatch(batchData[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async (batchId: string) => {
    try {
      const { data, error } = await supabase
        .from("timetables")
        .select(`
          *,
          batch:batches(name),
          faculty:profiles!timetables_faculty_id_fkey(full_name)
        `)
        .eq("batch_id", batchId)
        .order("day_of_week")
        .order("time_slot");

      if (error) throw error;
      setTimetable(data || []);
    } catch (error) {
      console.error("Error fetching timetable:", error);
      toast.error("Failed to fetch timetable");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from("timetables")
        .insert({
          batch_id: formData.batch_id,
          day_of_week: parseInt(formData.day_of_week),
          time_slot: formData.time_slot,
          subject: formData.subject,
          faculty_id: formData.faculty_id || null,
          room: formData.room || null
        });

      if (error) throw error;

      toast.success("Timetable entry added successfully");
      setFormData({
        batch_id: "", day_of_week: "", time_slot: "",
        subject: "", faculty_id: "", room: ""
      });
      setShowForm(false);
      if (selectedBatch) {
        fetchTimetable(selectedBatch);
      }
    } catch (error) {
      console.error("Error adding timetable entry:", error);
      toast.error("Failed to add timetable entry");
    }
  };

  const generateTimetableGrid = () => {
    const grid: { [key: string]: TimetableEntry } = {};
    
    timetable.forEach(entry => {
      const key = `${entry.day_of_week}-${entry.time_slot}`;
      grid[key] = entry;
    });

    return grid;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const timetableGrid = generateTimetableGrid();

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Timetable Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {isAcademicSection ? "Manage batch timetables" : "View your timetable"}
          </p>
        </div>
        {isAcademicSection && (
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <label className="text-sm font-medium">Select Batch:</label>
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Choose batch" />
          </SelectTrigger>
          <SelectContent>
            {batches.map((batch) => (
              <SelectItem key={batch.id} value={batch.id}>
                {batch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showForm && isAcademicSection && (
        <Card>
          <CardHeader>
            <CardTitle>Add Timetable Entry</CardTitle>
            <CardDescription>
              Add a new class to the timetable
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Batch</label>
                  <Select
                    value={formData.batch_id}
                    onValueChange={(value) => setFormData({ ...formData, batch_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Day</label>
                  <Select
                    value={formData.day_of_week}
                    onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {dayNames.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Time Slot</label>
                  <Select
                    value={formData.time_slot}
                    onValueChange={(value) => setFormData({ ...formData, time_slot: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Subject name"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Faculty</label>
                  <Select
                    value={formData.faculty_id}
                    onValueChange={(value) => setFormData({ ...formData, faculty_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      {faculty.map((f) => (
                        <SelectItem key={f.user_id} value={f.user_id}>
                          {f.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Room</label>
                  <Input
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="Room number"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="w-full sm:w-auto">Add Entry</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Weekly Timetable
            {selectedBatch && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                - {batches.find(b => b.id === selectedBatch)?.name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Time</TableHead>
                  {dayNames.slice(1, 6).map((day) => (
                    <TableHead key={day} className="text-center min-w-32">
                      {day}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeSlots.map((timeSlot) => (
                  <TableRow key={timeSlot}>
                    <TableCell className="font-medium text-xs">
                      {timeSlot}
                    </TableCell>
                    {[1, 2, 3, 4, 5].map((dayIndex) => {
                      const entry = timetableGrid[`${dayIndex}-${timeSlot}`];
                      return (
                        <TableCell key={dayIndex} className="text-center p-2">
                          {entry ? (
                            <div className="bg-primary/10 rounded p-2 text-xs">
                              <div className="font-semibold">{entry.subject}</div>
                              {entry.faculty && (
                                <div className="text-muted-foreground">{entry.faculty.full_name}</div>
                              )}
                              {entry.room && (
                                <div className="text-muted-foreground">Room: {entry.room}</div>
                              )}
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-xs">-</div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};