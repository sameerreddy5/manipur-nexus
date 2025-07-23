import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Plus, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
  created_at: string;
}

export const HolidayCalendarPage = () => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    type: ""
  });

  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from("holidays")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      setHolidays(data || []);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      toast.error("Failed to fetch holidays");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from("holidays")
        .insert(formData);

      if (error) throw error;

      toast.success("Holiday added successfully");
      setFormData({ name: "", date: "", type: "" });
      setShowForm(false);
      fetchHolidays();
    } catch (error) {
      console.error("Error adding holiday:", error);
      toast.error("Failed to add holiday");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "National": return "bg-red-500";
      case "Regional": return "bg-blue-500";
      case "Institute": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getUpcomingHolidays = () => {
    const today = new Date();
    return holidays.filter(holiday => new Date(holiday.date) >= today).slice(0, 5);
  };

  const getMonthlyHolidays = () => {
    const holidaysByMonth: { [key: string]: Holiday[] } = {};
    
    holidays.forEach(holiday => {
      const date = new Date(holiday.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!holidaysByMonth[monthKey]) {
        holidaysByMonth[monthKey] = [];
      }
      holidaysByMonth[monthKey].push(holiday);
    });

    return holidaysByMonth;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const upcomingHolidays = getUpcomingHolidays();
  const monthlyHolidays = getMonthlyHolidays();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Holiday Calendar</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage institutional holidays" : "View holiday calendar"}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Holiday
          </Button>
        )}
      </div>

      {showForm && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Add Holiday</CardTitle>
            <CardDescription>
              Add a new holiday to the calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Holiday Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Independence Day"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="National">National</SelectItem>
                      <SelectItem value="Regional">Regional</SelectItem>
                      <SelectItem value="Institute">Institute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Add Holiday</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarDays className="mr-2 h-5 w-5" />
              Upcoming Holidays
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingHolidays.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No upcoming holidays
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingHolidays.map((holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{holiday.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(holiday.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getTypeColor(holiday.type)}>
                      {holiday.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              All Holidays
            </CardTitle>
          </CardHeader>
          <CardContent>
            {holidays.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No holidays found
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Holiday Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Day</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.map((holiday) => {
                    const date = new Date(holiday.date);
                    return (
                      <TableRow key={holiday.id}>
                        <TableCell className="font-medium">
                          {holiday.name}
                        </TableCell>
                        <TableCell>
                          {date.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(holiday.type)}>
                            {holiday.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {date.toLocaleDateString('en-US', { weekday: 'long' })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};