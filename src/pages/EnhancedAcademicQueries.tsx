import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Send, Eye, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Query {
  id: string;
  query_id: string;
  subject: string;
  message: string;
  status: string;
  student_id: string;
  faculty_id: string;
  created_at: string;
  updated_at: string;
  student_name?: string;
  faculty_name?: string;
}

interface QueryThread {
  query: Query;
  replies: Query[];
}

export const EnhancedAcademicQueriesPage = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState<Query[]>([]);
  const [selectedThread, setSelectedThread] = useState<QueryThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [threadDialogOpen, setThreadDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    faculty_id: ""
  });
  const [replyMessage, setReplyMessage] = useState("");
  const [faculty, setFaculty] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  const isStudent = user?.role === "Student";
  const isFaculty = user?.role === "Faculty";

  useEffect(() => {
    fetchQueries();
    if (isStudent) {
      fetchFaculty();
    }
  }, [filter]);

  const fetchQueries = async () => {
    try {
      let query = supabase
        .from('academic_queries')
        .select(`
          *,
          student_profile:profiles!academic_queries_student_id_fkey(full_name),
          faculty_profile:profiles!academic_queries_faculty_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (isStudent) {
        query = query.eq('student_id', user?.email);
      } else if (isFaculty) {
        query = query.eq('faculty_id', user?.email);
      }

      if (filter !== "all") {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const queriesWithNames = data?.map(q => ({
        ...q,
        student_name: Array.isArray(q.student_profile) ? q.student_profile[0]?.full_name : q.student_profile?.full_name,
        faculty_name: Array.isArray(q.faculty_profile) ? q.faculty_profile[0]?.full_name : q.faculty_profile?.full_name
      })) || [];

      setQueries(queriesWithNames);
    } catch (error) {
      console.error('Error fetching queries:', error);
      toast.error('Failed to fetch queries');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('role', 'Faculty');

      if (error) throw error;
      setFaculty(data || []);
    } catch (error) {
      console.error('Error fetching faculty:', error);
    }
  };

  const generateQueryId = () => {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `AQ${year}-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const queryData = {
        query_id: generateQueryId(),
        subject: formData.subject,
        message: formData.message,
        student_id: user?.email,
        faculty_id: formData.faculty_id,
        status: 'Open'
      };

      const { error } = await supabase
        .from('academic_queries')
        .insert(queryData);

      if (error) throw error;

      toast.success('Query submitted successfully');
      setFormData({ subject: "", message: "", faculty_id: "" });
      setDialogOpen(false);
      fetchQueries();
    } catch (error) {
      console.error('Error submitting query:', error);
      toast.error('Failed to submit query');
    }
  };

  const handleReply = async () => {
    if (!selectedThread || !replyMessage.trim()) return;

    try {
      const replyData = {
        subject: `Re: ${selectedThread.query.subject}`,
        message: replyMessage,
        student_id: selectedThread.query.student_id,
        faculty_id: selectedThread.query.faculty_id,
        parent_id: selectedThread.query.id,
        status: isFaculty ? 'Responded' : 'Replied'
      };

      const { error } = await supabase
        .from('academic_queries')
        .insert(replyData);

      if (error) throw error;

      // Update main query status
      await supabase
        .from('academic_queries')
        .update({ 
          status: isFaculty ? 'Responded' : 'Replied',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedThread.query.id);

      toast.success('Reply sent successfully');
      setReplyMessage("");
      fetchThreadDetails(selectedThread.query.id);
      fetchQueries();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  };

  const fetchThreadDetails = async (queryId: string) => {
    try {
      // Get main query
      const { data: mainQuery, error: mainError } = await supabase
        .from('academic_queries')
        .select(`
          *,
          student_profile:profiles!academic_queries_student_id_fkey(full_name),
          faculty_profile:profiles!academic_queries_faculty_id_fkey(full_name)
        `)
        .eq('id', queryId)
        .single();

      if (mainError) throw mainError;

      // Get replies
      const { data: replies, error: repliesError } = await supabase
        .from('academic_queries')
        .select(`
          *,
          student_profile:profiles!academic_queries_student_id_fkey(full_name),
          faculty_profile:profiles!academic_queries_faculty_id_fkey(full_name)
        `)
        .eq('parent_id', queryId)
        .order('created_at');

      if (repliesError) throw repliesError;

      const queryWithNames = {
        ...mainQuery,
        student_name: mainQuery.student_profile?.full_name,
        faculty_name: mainQuery.faculty_profile?.full_name
      };

      const repliesWithNames = replies?.map(r => ({
        ...r,
        student_name: r.student_profile?.full_name,
        faculty_name: r.faculty_profile?.full_name
      })) || [];

      setSelectedThread({
        query: queryWithNames,
        replies: repliesWithNames
      });
    } catch (error) {
      console.error('Error fetching thread details:', error);
      toast.error('Failed to load conversation');
    }
  };

  const handleViewThread = (query: Query) => {
    fetchThreadDetails(query.id);
    setThreadDialogOpen(true);
  };

  const markAsResolved = async (queryId: string) => {
    try {
      const { error } = await supabase
        .from('academic_queries')
        .update({ status: 'Resolved' })
        .eq('id', queryId);

      if (error) throw error;

      toast.success('Query marked as resolved');
      fetchQueries();
      if (selectedThread && selectedThread.query.id === queryId) {
        setSelectedThread({
          ...selectedThread,
          query: { ...selectedThread.query, status: 'Resolved' }
        });
      }
    } catch (error) {
      console.error('Error updating query status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-500';
      case 'Responded': return 'bg-green-500';
      case 'Replied': return 'bg-yellow-500';
      case 'Resolved': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open': return <AlertCircle className="h-4 w-4" />;
      case 'Responded': return <CheckCircle className="h-4 w-4" />;
      case 'Replied': return <MessageSquare className="h-4 w-4" />;
      case 'Resolved': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="p-6">Loading queries...</div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Academic Queries</h1>
          <p className="text-muted-foreground">
            {isStudent ? "Submit and track your academic queries" : "Respond to student queries"}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Responded">Responded</SelectItem>
              <SelectItem value="Replied">Replied</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          
          {isStudent && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  New Query
                </Button>
              </DialogTrigger>
              <DialogContent className="animate-scale-in max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Submit New Query</DialogTitle>
                  <DialogDescription>
                    Submit your academic question to faculty
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="faculty">Faculty Member</Label>
                    <Select
                      value={formData.faculty_id}
                      onValueChange={(value) => setFormData({ ...formData, faculty_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select faculty member" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculty.map((fac) => (
                          <SelectItem key={fac.user_id} value={fac.user_id}>
                            {fac.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Enter query subject"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe your query in detail..."
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    <Button type="submit" className="flex-1">Submit Query</Button>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Thread Dialog */}
      <Dialog open={threadDialogOpen} onOpenChange={setThreadDialogOpen}>
        <DialogContent className="animate-scale-in max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Query Thread: {selectedThread?.query.query_id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedThread && (
            <div className="space-y-4">
              {/* Original Query */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedThread.query.subject}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(selectedThread.query.status)}>
                        {getStatusIcon(selectedThread.query.status)}
                        <span className="ml-1">{selectedThread.query.status}</span>
                      </Badge>
                      {isStudent && selectedThread.query.status !== 'Resolved' && (
                        <Button
                          size="sm"
                          onClick={() => markAsResolved(selectedThread.query.id)}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    From: {selectedThread.query.student_name} | To: {selectedThread.query.faculty_name}
                    <br />
                    {new Date(selectedThread.query.created_at).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{selectedThread.query.message}</p>
                </CardContent>
              </Card>

              {/* Replies */}
              <ScrollArea className="max-h-96">
                <div className="space-y-3">
                  {selectedThread.replies.map((reply) => (
                    <Card key={reply.id} className="ml-4">
                      <CardHeader className="pb-2">
                        <CardDescription>
                          Reply from: {reply.student_id === selectedThread.query.student_id ? reply.student_name : reply.faculty_name}
                          <br />
                          {new Date(reply.created_at).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="whitespace-pre-wrap">{reply.message}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply Form */}
              {selectedThread.query.status !== 'Resolved' && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label htmlFor="reply">Your Reply</Label>
                    <Textarea
                      id="reply"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                    />
                    <Button onClick={handleReply} disabled={!replyMessage.trim()}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Reply
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Queries List */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            {isStudent ? "My Queries" : "Student Queries"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No queries found.
            </p>
          ) : (
            <div className="space-y-3">
              {queries.map((query) => (
                <Card key={query.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{query.query_id}</Badge>
                          <Badge className={getStatusColor(query.status)}>
                            {getStatusIcon(query.status)}
                            <span className="ml-1">{query.status}</span>
                          </Badge>
                        </div>
                        <h3 className="font-medium">{query.subject}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {query.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>From: {query.student_name}</span>
                          <span>To: {query.faculty_name}</span>
                          <span>{new Date(query.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewThread(query)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Thread
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};