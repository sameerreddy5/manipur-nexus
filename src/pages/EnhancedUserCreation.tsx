import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Users, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  name: string;
  year: number;
}

interface Section {
  id: string;
  name: string;
}

export const EnhancedUserCreationPage = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    role: "",
    roll_number: "",
    department: "",
    batch: "",
    section: ""
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
    fetchBatches();
  }, []);

  useEffect(() => {
    if (formData.batch) {
      fetchSections(formData.batch);
    }
  }, [formData.batch]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('id, name, year')
        .order('year', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchSections = async (batchId: string) => {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('id, name')
        .eq('batch_id', batchId)
        .order('name');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create user in auth system first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.full_name,
            role: formData.role
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        const profileData: any = {
          user_id: authData.user.id,
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone
        };

        // Add role-specific fields
        if (formData.role === 'Student') {
          profileData.roll_number = formData.roll_number;
          profileData.department = formData.department;
          profileData.batch = formData.batch;
        } else if (formData.role === 'Faculty') {
          profileData.department = formData.department;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (profileError) throw profileError;

        // Log activity
        await supabase.from('activity_logs').insert({
          user_id: user?.email,
          action: 'User Created',
          details: `Created ${formData.role} account for ${formData.full_name}`
        });

        toast.success('User created successfully!');
        resetForm();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      role: "",
      roll_number: "",
      department: "",
      batch: "",
      section: ""
    });
  };

  const isStudentRole = formData.role === 'Student';
  const isFacultyRole = formData.role === 'Faculty';

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">Create New User</h1>
        <p className="text-muted-foreground">
          Add a new user to the system with role-specific information
        </p>
      </div>

      <Card className="animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            User Information
          </CardTitle>
          <CardDescription>
            Fill in the user details. Fields will appear based on the selected role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Faculty">Faculty</SelectItem>
                  <SelectItem value="Academic Section">Academic Section</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Hostel Warden">Hostel Warden</SelectItem>
                  <SelectItem value="Mess Supervisor">Mess Supervisor</SelectItem>
                  <SelectItem value="Director">Director</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Student-specific fields */}
            {isStudentRole && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30 animate-slide-in-right">
                <h3 className="font-medium text-sm text-muted-foreground">Student Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="roll_number">Roll Number *</Label>
                    <Input
                      id="roll_number"
                      value={formData.roll_number}
                      onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                      placeholder="Enter roll number"
                      required={isStudentRole}
                    />
                  </div>
                  <div>
                    <Label htmlFor="student_department">Department *</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({ ...formData, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="batch">Batch *</Label>
                    <Select
                      value={formData.batch}
                      onValueChange={(value) => setFormData({ ...formData, batch: value, section: "" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name} ({batch.year})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="section">Section *</Label>
                    <Select
                      value={formData.section}
                      onValueChange={(value) => setFormData({ ...formData, section: value })}
                      disabled={!formData.batch}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            Section {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Faculty-specific fields */}
            {isFacultyRole && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30 animate-slide-in-right">
                <h3 className="font-medium text-sm text-muted-foreground">Faculty Information</h3>
                
                <div>
                  <Label htmlFor="faculty_department">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Submit Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating User...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Create User
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
                disabled={loading}
                className="flex-1"
              >
                Reset Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};