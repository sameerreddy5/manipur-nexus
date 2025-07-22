import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, CheckCircle, AlertCircle, User } from "lucide-react";

interface Activity {
  id: string;
  type: 'complaint' | 'announcement' | 'assignment' | 'query' | 'menu';
  title: string;
  description: string;
  timestamp: string;
  status?: 'pending' | 'resolved' | 'in-progress';
  user?: string;
}

interface RecentActivityProps {
  activities: Activity[];
  userRole: string;
}

export const RecentActivity = ({ activities, userRole }: RecentActivityProps) => {
  const getActivityIcon = (type: string) => {
    const icons = {
      complaint: AlertCircle,
      announcement: CheckCircle,
      assignment: User,
      query: User,
      menu: CheckCircle
    };
    const IconComponent = icons[type as keyof typeof icons] || User;
    return <IconComponent className="h-4 w-4" />;
  };

  const getStatusColor = (status?: string) => {
    const colors = {
      pending: 'bg-warning text-warning-foreground',
      resolved: 'bg-success text-success-foreground',
      'in-progress': 'bg-primary text-primary-foreground'
    };
    return colors[status as keyof typeof colors] || 'bg-muted';
  };

  const getTypeColor = (type: string) => {
    const colors = {
      complaint: 'text-destructive',
      announcement: 'text-primary',
      assignment: 'text-accent',
      query: 'text-secondary',
      menu: 'text-success'
    };
    return colors[type as keyof typeof colors] || 'text-muted-foreground';
  };

  return (
    <Card className="academic-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-primary" />
          <span>Recent Activity</span>
        </CardTitle>
        <CardDescription>
          Latest updates and activities in your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No recent activities to show
            </p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={getTypeColor(activity.type)}>
                    {getActivityIcon(activity.type)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.title}</p>
                    {activity.status && (
                      <Badge className={`${getStatusColor(activity.status)} text-xs`}>
                        {activity.status.replace('-', ' ')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp}
                    </p>
                    {activity.user && (
                      <p className="text-xs text-muted-foreground">
                        by {activity.user}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};