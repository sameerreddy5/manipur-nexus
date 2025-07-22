import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_urgent: boolean;
  target_roles: string[];
  created_at: string;
  author_id: string;
}

interface AnnouncementsListProps {
  onCreateNew?: () => void;
}

export const AnnouncementsList = ({ onCreateNew }: AnnouncementsListProps) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch announcements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canCreateAnnouncement = user.role === 'Admin' || user.role === 'Faculty';

  if (loading) {
    return <div className="text-center py-8">Loading announcements...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-heading font-bold">Announcements</h2>
        {canCreateAnnouncement && onCreateNew && (
          <Button onClick={onCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No announcements available
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className={announcement.is_urgent ? "border-destructive" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    {announcement.is_urgent && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    {announcement.title}
                  </CardTitle>
                  <div className="flex gap-2">
                    {announcement.is_urgent && (
                      <Badge variant="destructive">Urgent</Badge>
                    )}
                    {announcement.target_roles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">{announcement.content}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(announcement.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};