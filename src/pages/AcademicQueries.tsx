import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, Reply, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Query {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  student: { full_name: string };
  faculty: { full_name: string };
  course?: { name: string; code: string };
  replies?: Query[];
}

interface Course {
  id: string;
  code: string;
  name: string;
}

interface Faculty {
  user_id: string;
  full_name: string;
}

export const AcademicQueriesPage = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  
  const [formData, setFormData] = useState({
    faculty_id: "",
    course_id: "",
    subject: "",
    message: ""
  });

  const isStudent = user?.role === "Student";
  const isFaculty = user?.role === "Faculty";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch queries
      const { data: queryData, error: queryError } = await supabase
        .from("academic_queries")
        .select(`
          *,
          student:profiles!academic_queries_student_id_fkey(full_name),
          faculty:profiles!academic_queries_faculty_id_fkey(full_name),
          course:courses(name, code)
        `)
        .is("parent_id", null)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      // Fetch replies for each query
      const queriesWithReplies = await Promise.all(
        (queryData || []).map(async (query) => {
          const { data: replies, error: replyError } = await supabase
            .from("academic_queries")
            .select(`
              *,
              student:profiles!academic_queries_student_id_fkey(full_name),
              faculty:profiles!academic_queries_faculty_id_fkey(full_name)
            `)
            .eq("parent_id", query.id)
            .order("created_at", { ascending: true });

          if (replyError) throw replyError;
          return { ...query, replies: replies || [] };
        })
      );

      setQueries(queriesWithReplies);

      if (isStudent) {
        // Fetch courses and faculty for students
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("id, code, name")
          .order("code");

        if (courseError) throw courseError;
        setCourses(courseData || []);

        const { data: facultyData, error: facultyError } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .eq("role", "Faculty");

        if (facultyError) throw facultyError;
        setFaculty(facultyData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.isAuthenticated) return;

    try {
      const { error } = await supabase
        .from("academic_queries")
        .insert({
          student_id: user.email,
          faculty_id: formData.faculty_id,
          course_id: formData.course_id || null,
          subject: formData.subject,
          message: formData.message
        });

      if (error) throw error;

      toast.success("Query submitted successfully");
      setFormData({ faculty_id: "", course_id: "", subject: "", message: "" });
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error("Error submitting query:", error);
      toast.error("Failed to submit query");
    }
  };

  const handleReply = async (queryId: string) => {
    if (!user?.isAuthenticated || !replyMessage.trim()) return;

    try {
      const { error } = await supabase
        .from("academic_queries")
        .insert({
          student_id: user.email,
          faculty_id: user.email,
          subject: "Reply",
          message: replyMessage,
          parent_id: queryId
        });

      if (error) throw error;

      // Update query status
      await supabase
        .from("academic_queries")
        .update({ status: "Replied" })
        .eq("id", queryId);

      toast.success("Reply sent successfully");
      setReplyMessage("");
      setSelectedQuery(null);
      fetchData();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "bg-yellow-500";
      case "Replied": return "bg-blue-500";
      case "Closed": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getFilteredQueries = () => {
    if (isStudent) {
      return queries.filter(query => query.student_id === user?.email);
    } else if (isFaculty) {
      return queries.filter(query => query.faculty_id === user?.email);
    }
    return queries;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const filteredQueries = getFilteredQueries();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Academic Queries</h1>
          <p className="text-muted-foreground">
            {isStudent ? "Ask questions to faculty" : "Respond to student queries"}
          </p>
        </div>
        {isStudent && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Query
          </Button>
        )}
      </div>

      {showForm && isStudent && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Academic Query</CardTitle>
            <CardDescription>
              Ask a question to faculty about academic matters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="text-sm font-medium">Course (Optional)</label>
                  <Select
                    value={formData.course_id}
                    onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your query"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your question in detail..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Submit Query</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {filteredQueries.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No academic queries found
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredQueries.map((query) => (
            <Card key={query.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{query.subject}</CardTitle>
                    <CardDescription>
                      {isStudent ? `To: ${query.faculty.full_name}` : `From: ${query.student.full_name}`}
                      {query.course && ` • Course: ${query.course.code} - ${query.course.name}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(query.status)}>
                      {query.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(query.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{query.message}</p>
                
                {query.replies && query.replies.length > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-semibold text-sm flex items-center">
                      <Reply className="mr-2 h-4 w-4" />
                      Replies ({query.replies.length})
                    </h4>
                    {query.replies.map((reply) => (
                      <div key={reply.id} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            {reply.faculty?.full_name || reply.student?.full_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {isFaculty && query.status !== "Closed" && (
                  <div className="border-t pt-4 mt-4">
                    {selectedQuery === query.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type your reply..."
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleReply(query.id)}
                            disabled={!replyMessage.trim()}
                          >
                            Send Reply
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setSelectedQuery(null);
                              setReplyMessage("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedQuery(query.id)}
                      >
                        <Reply className="mr-2 h-4 w-4" />
                        Reply
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};