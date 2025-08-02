import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Clock, RefreshCw, Activity, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface HealthStatus {
  id: string;
  service_name: string;
  status: string;
  last_check: string;
  response_time: number;
  error_message?: string;
}

export const BackendHealthMonitorPage = () => {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<HealthStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [uptime, setUptime] = useState(98.5);

  // Access control
  if (user?.role !== 'Admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
              <h3 className="mt-2 text-lg font-semibold">Access Denied</h3>
              <p className="text-muted-foreground">You don't have permission to access this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchHealthData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      const { data, error } = await supabase
        .from('backend_health')
        .select('*')
        .order('last_check', { ascending: false });

      if (error) throw error;
      setHealthData(data || []);
    } catch (error) {
      console.error('Error fetching health data:', error);
      toast.error('Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  const checkService = async (serviceName: string) => {
    const startTime = Date.now();
    let status = 'active';
    let errorMessage = null;
    
    try {
      // Test database connection
      if (serviceName === 'database') {
        await supabase.from('profiles').select('id').limit(1);
      }
      // Test auth service
      else if (serviceName === 'auth') {
        await supabase.auth.getSession();
      }
      // Test storage service
      else if (serviceName === 'storage') {
        await supabase.storage.listBuckets();
      }
    } catch (error: any) {
      status = 'error';
      errorMessage = error.message;
    }

    const responseTime = Date.now() - startTime;

    // Update health record
    await supabase.from('backend_health').upsert({
      service_name: serviceName,
      status,
      response_time: responseTime,
      error_message: errorMessage,
      last_check: new Date().toISOString()
    });

    return { serviceName, status, responseTime, errorMessage };
  };

  const checkAllServices = async () => {
    setChecking(true);
    try {
      const services = ['database', 'auth', 'storage'];
      const results = await Promise.all(
        services.map(service => checkService(service))
      );

      // Calculate uptime based on successful checks
      const successfulChecks = results.filter(r => r.status === 'active').length;
      const newUptime = (successfulChecks / results.length) * 100;
      setUptime(newUptime);

      fetchHealthData();
      
      const failedServices = results.filter(r => r.status === 'error');
      if (failedServices.length > 0) {
        toast.error(`${failedServices.length} service(s) are down!`);
      } else {
        toast.success('All services are healthy');
      }
    } catch (error) {
      console.error('Error checking services:', error);
      toast.error('Failed to check service health');
    } finally {
      setChecking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatResponseTime = (time: number) => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return <div className="p-6">Loading health data...</div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Backend Health Monitor</h1>
          <p className="text-muted-foreground">
            Monitor the health and performance of backend services
          </p>
        </div>
        
        <Button 
          onClick={checkAllServices} 
          disabled={checking}
          className="w-full sm:w-auto"
        >
          {checking ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Check All Services
            </>
          )}
        </Button>
      </div>

      {/* Overall Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uptime.toFixed(1)}%</div>
            <Progress value={uptime} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData.filter(h => h.status === 'active').length}/{healthData.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Services operational
            </p>
          </CardContent>
        </Card>

        <Card className="animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData.length > 0 
                ? formatResponseTime(healthData.reduce((acc, h) => acc + h.response_time, 0) / healthData.length)
                : '0ms'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Across all services
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Status Details */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Service Status
          </CardTitle>
          <CardDescription>
            Detailed health status of individual services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthData.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No Health Data</h3>
              <p className="text-muted-foreground">Run a health check to see service status</p>
              <Button 
                onClick={checkAllServices} 
                className="mt-4"
                disabled={checking}
              >
                Run Health Check
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {healthData.map((service) => (
                <Card key={service.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={getStatusColor(service.status)}>
                        {getStatusIcon(service.status)}
                      </div>
                      <div>
                        <h3 className="font-medium capitalize">{service.service_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Last checked: {new Date(service.last_check).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Badge 
                          variant={service.status === 'active' ? 'default' : 'destructive'}
                          className="mb-1"
                        >
                          {service.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {formatResponseTime(service.response_time)}
                        </p>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => checkService(service.service_name)}
                        disabled={checking}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {service.error_message && (
                    <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                      <p className="text-sm text-destructive font-medium">Error:</p>
                      <p className="text-sm text-destructive/80">{service.error_message}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Response Time Trends</CardTitle>
            <CardDescription>
              Average response times over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              Chart visualization would go here
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Uptime History</CardTitle>
            <CardDescription>
              Service availability over the past 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              Uptime chart would go here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};