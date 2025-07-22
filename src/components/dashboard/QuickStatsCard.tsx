import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface QuickStatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const QuickStatsCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  className = "" 
}: QuickStatsCardProps) => {
  return (
    <Card className={`academic-card hover:shadow-lg transition-all duration-300 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <span className={`text-xs font-medium ${
              trend.isPositive ? 'text-success' : 'text-destructive'
            }`}>
              {trend.isPositive ? '↗' : '↘'} {trend.value}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};