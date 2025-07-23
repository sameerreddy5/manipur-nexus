import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Plus, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Complaint {
  id: string;
  hostel_block: string;
  room_number: string;
  issue_type: string;
  description: string;
  status: string;
  warden_remarks: string | null;
  created_at: string;
}

export const HostelComplaintsPage = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    hostel_block: "",
    room_number: "",
    issue_type: "",
    description: ""
  });

  const isStudent = user?.role === "Student";
  const isWarden = user?.role === "Hostel Warden";

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from("hostel_complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast.error("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.isAuthenticated) return;

    try {
      const { error } = await supabase
        .from("hostel_complaints")
        .insert({
          student_id: user.email,
          ...formData
        });

      if (error) throw error;

      toast.success("Complaint submitted successfully");
      setFormData({ hostel_block: "", room_number: "", issue_type: "", description: "" });
      setShowForm(false);
      fetchComplaints();
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("Failed to submit complaint");
    }
  };

  const updateComplaintStatus = async (id: string, status: string, remarks?: string) => {
    try {
      const updateData: any = { status };
      if (remarks !== undefined) {
        updateData.warden_remarks = remarks;
      }

      const { error } = await supabase
        .from("hostel_complaints")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast.success("Complaint updated successfully");
      fetchComplaints();
    } catch (error) {
      console.error("Error updating complaint:", error);
      toast.error("Failed to update complaint");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-500";
      case "In Progress": return "bg-blue-500";
      case "Resolved": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Hostel Complaints</h1>
          <p className="text-muted-foreground">
            {isStudent ? "Submit and track your hostel complaints" : "Manage hostel complaints"}
          </p>
        </div>
        {isStudent && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Complaint
          </Button>
        )}
      </div>

      {showForm && isStudent && (
        <Card>
          <CardHeader>
            <CardTitle>Submit New Complaint</CardTitle>
            <CardDescription>
              Please provide details about your hostel issue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Hostel Block</label>
                  <Input
                    value={formData.hostel_block}
                    onChange={(e) => setFormData({ ...formData, hostel_block: e.target.value })}
                    placeholder="e.g., Block A"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Room Number</label>
                  <Input
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    placeholder="e.g., 101"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Issue Type</label>
                <Select
                  value={formData.issue_type}
                  onValueChange={(value) => setFormData({ ...formData, issue_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Cleanliness">Cleanliness</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Submit Complaint</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
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
            <AlertCircle className="mr-2 h-5 w-5" />
            {isStudent ? "My Complaints" : "All Complaints"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No complaints found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Block/Room</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  {isWarden && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>
                      {complaint.hostel_block} - {complaint.room_number}
                    </TableCell>
                    <TableCell>{complaint.issue_type}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {complaint.description}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(complaint.status)}>
                        {complaint.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </TableCell>
                    {isWarden && (
                      <TableCell>
                        <Select
                          value={complaint.status}
                          onValueChange={(value) => updateComplaintStatus(complaint.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};