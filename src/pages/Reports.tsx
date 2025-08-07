import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { 
  FileBarChart, 
  Users, 
  GraduationCap, 
  MessageSquare, 
  Home,
  Download,
  RefreshCw
} from "lucide-react";

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  report_type: string;
  config: any;
  is_active: boolean;
}

interface ReportData {
  id: string;
  report_config_id: string;
  data: any;
  generated_at: string;
  expires_at?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function Reports() {
  const { user, session } = useAuth();
  const [reportConfigs, setReportConfigs] = useState<ReportConfig[]>([]);
  const [reportData, setReportData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchReportConfigs();
  }, []);

  const fetchReportConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('reports_config')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setReportConfigs(data || []);
      
      // Generate data for each report
      for (const config of data || []) {
        await generateReportData(config);
      }
    } catch (error) {
      console.error('Error fetching report configs:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = async (config: ReportConfig) => {
    try {
      let data = [];
      
      switch (config.report_type) {
        case 'enrollment_stats':
          data = await getEnrollmentStats();
          break;
        case 'faculty_workload':
          data = await getFacultyWorkload();
          break;
        case 'query_analytics':
          data = await getQueryAnalytics();
          break;
        case 'hostel_analytics':
          data = await getHostelAnalytics();
          break;
        case 'course_assignments':
          data = await getCourseAssignments();
          break;
        default:
          data = [];
      }

      setReportData(prev => ({
        ...prev,
        [config.id]: data
      }));

      // Log report view
      if (session?.user?.id) {
        await supabase
          .from('report_views')
          .insert({
            report_config_id: config.id,
            viewed_by: session.user.id
          });
      }

    } catch (error) {
      console.error(`Error generating data for ${config.name}:`, error);
    }
  };

  const getEnrollmentStats = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('department')
      .eq('role', 'Student');

    if (error) throw error;

    const stats = data?.reduce((acc: any, profile) => {
      const dept = profile.department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(stats || {}).map(([department, count]) => ({
      department,
      students: count
    }));
  };

  const getFacultyWorkload = async () => {
    const { data, error } = await supabase
      .from('course_assignments')
      .select('faculty_id, course_id');

    if (error) throw error;

    // Get faculty profiles separately
    const facultyIds = [...new Set(data?.map(a => a.faculty_id))];
    const { data: facultyData } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', facultyIds);

    const facultyMap = new Map(facultyData?.map(f => [f.user_id, f.full_name]));

    const workload = data?.reduce((acc: any, assignment) => {
      const facultyName = facultyMap.get(assignment.faculty_id) || 'Unknown';
      acc[facultyName] = (acc[facultyName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(workload || {}).map(([faculty, courses]) => ({
      faculty,
      courses
    }));
  };

  const getQueryAnalytics = async () => {
    const { data, error } = await supabase
      .from('academic_queries')
      .select('status, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const analytics = data?.reduce((acc: any, query) => {
      const month = new Date(query.created_at).toLocaleDateString('en-US', { month: 'short' });
      if (!acc[month]) acc[month] = { month, open: 0, resolved: 0, closed: 0 };
      acc[month][query.status.toLowerCase()] += 1;
      return acc;
    }, {});

    return Object.values(analytics || {});
  };

  const getHostelAnalytics = async () => {
    const { data, error } = await supabase
      .from('hostel_complaints')
      .select('issue_type, status')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const analytics = data?.reduce((acc: any, complaint) => {
      const type = complaint.issue_type;
      if (!acc[type]) acc[type] = { type, total: 0, pending: 0, resolved: 0 };
      acc[type].total += 1;
      if (complaint.status === 'Pending') acc[type].pending += 1;
      if (complaint.status === 'Resolved') acc[type].resolved += 1;
      return acc;
    }, {});

    return Object.values(analytics || {});
  };

  const getCourseAssignments = async () => {
    const { data, error } = await supabase
      .from('course_assignments')
      .select('semester, year')
      .order('year', { ascending: false });

    if (error) throw error;

    const assignments = data?.reduce((acc: any, assignment) => {
      const key = `${assignment.semester} ${assignment.year}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(assignments || {}).map(([semester, count]) => ({
      semester,
      assignments: count
    }));
  };

  const renderChart = (config: ReportConfig, data: any[]) => {
    if (!data?.length) {
      return (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No data available
        </div>
      );
    }

    const chartType = config.config?.chart_type || 'bar';

    switch (chartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey={Object.keys(data[0])[1]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={Object.keys(data[0])[0]} className="fill-muted-foreground" />
              <YAxis className="fill-muted-foreground" />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey={Object.keys(data[0])[1]} 
                stroke="hsl(var(--primary))" 
                strokeWidth={2} 
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={Object.keys(data[0])[0]} className="fill-muted-foreground" />
              <YAxis className="fill-muted-foreground" />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey={Object.keys(data[0])[1]} 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default: // bar
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={Object.keys(data[0])[0]} className="fill-muted-foreground" />
              <YAxis className="fill-muted-foreground" />
              <Tooltip />
              <Bar dataKey={Object.keys(data[0])[1]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileBarChart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights and analytics for institutional management
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchReportConfigs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <FileBarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportConfigs.length}</div>
                <p className="text-xs text-muted-foreground">Active reports</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Points</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(reportData).reduce((acc, data) => acc + (data?.length || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">Across all reports</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reportConfigs.map((config) => (
              <Card key={config.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <Badge variant="secondary">{config.config?.chart_type || 'bar'}</Badge>
                  </div>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderChart(config, reportData[config.id] || [])}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="academic">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reportConfigs
              .filter(config => ['query_analytics', 'course_assignments'].includes(config.report_type))
              .map((config) => (
                <Card key={config.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      {config.name}
                    </CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderChart(config, reportData[config.id] || [])}
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="faculty">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reportConfigs
              .filter(config => config.report_type === 'faculty_workload')
              .map((config) => (
                <Card key={config.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {config.name}
                    </CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderChart(config, reportData[config.id] || [])}
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="students">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reportConfigs
              .filter(config => config.report_type === 'enrollment_stats')
              .map((config) => (
                <Card key={config.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      {config.name}
                    </CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderChart(config, reportData[config.id] || [])}
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="facilities">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reportConfigs
              .filter(config => config.report_type === 'hostel_analytics')
              .map((config) => (
                <Card key={config.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      {config.name}
                    </CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderChart(config, reportData[config.id] || [])}
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}