import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
  code: string;
  type: string;
  hod_id?: string;
  hod_name?: string;
  created_at: string;
}

interface Faculty {
  user_id: string;
  full_name: string;
}

export const DepartmentManagementPage = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [activeTab, setActiveTab] = useState("student");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "academic",
    hod_id: ""
  });

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
    fetchDepartments();
    fetchFaculty();
  }, [activeTab]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          code,
          type,
          hod_id,
          created_at,
          profiles:hod_id(full_name)
        `)
        .order('name');

      if (error) throw error;

      const departmentsWithHod = data?.map(dept => ({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        type: dept.type,
        hod_id: dept.hod_id,
        hod_name: dept.profiles?.full_name || 'Not Assigned',
        created_at: dept.created_at
      })) || [];

      setDepartments(departmentsWithHod);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const departmentData = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        hod_id: formData.hod_id || null
      };

      let error;
      if (editingDept) {
        ({ error } = await supabase
          .from('departments')
          .update(departmentData)
          .eq('id', editingDept.id));
      } else {
        ({ error } = await supabase
          .from('departments')
          .insert(departmentData));
      }

      if (error) throw error;

      toast.success(editingDept ? 'Department updated successfully' : 'Department created successfully');
      resetForm();
      fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      toast.error('Failed to save department');
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      type: dept.type,
      hod_id: dept.hod_id || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete department');
    }
  };

  const resetForm = () => {
    setFormData({ name: "", code: "", type: "academic", hod_id: "" });
    setEditingDept(null);
    setDialogOpen(false);
  };

  const filteredDepartments = departments.filter(dept => 
    activeTab === "student" ? dept.type === "academic" : dept.type === "faculty"
  );

  if (loading) {
    return <div className="p-6">Loading departments...</div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Department Management</h1>
          <p className="text-muted-foreground">
            Manage academic and faculty departments
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle>
                {editingDept ? 'Edit Department' : 'Create New Department'}
              </DialogTitle>
              <DialogDescription>
                Fill in the department details below
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Department Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Department Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., CSE"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="type">Department Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="hod">Head of Department (Optional)</Label>
                <Select
                  value={formData.hod_id}
                  onValueChange={(value) => setFormData({ ...formData, hod_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select HOD" />
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
              
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingDept ? 'Update' : 'Create'} Department
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="student">Academic Departments</TabsTrigger>
          <TabsTrigger value="faculty">Faculty Departments</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5" />
                {activeTab === "student" ? "Academic" : "Faculty"} Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredDepartments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No departments found. Create one to get started.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>HOD</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDepartments.map((dept) => (
                        <TableRow key={dept.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell>{dept.code}</TableCell>
                          <TableCell>
                            <Badge variant={dept.hod_name === 'Not Assigned' ? 'secondary' : 'default'}>
                              {dept.hod_name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {dept.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(dept)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(dept.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};