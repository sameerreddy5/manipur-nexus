import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail, Phone, User, Key, Building, GraduationCap } from "lucide-react";

interface FormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  department?: string;
  batch?: string;
}

const roles = [
  "Admin",
  "Faculty", 
  "Student",
  "Academic Section",
  "Director",
  "Hostel Warden",
  "Mess Supervisor"
];

const departments = [
  "Computer Science & Engineering",
  "Electronics & Communication",
  "Mathematics",
  "Physics",
  "Humanities"
];

const batches = [
  "2024", "2023", "2022", "2021", "2020"
];

export const AddUserForm = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "",
    department: "",
    batch: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "User Added Successfully",
        description: `${formData.name} has been added as ${formData.role}`,
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "",
        department: "",
        batch: ""
      });
      
      setIsLoading(false);
    }, 1000);
  };

  const shouldShowDepartment = formData.role === "Faculty" || formData.role === "Student";
  const shouldShowBatch = formData.role === "Student";

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <UserPlus className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-heading font-bold">Add New User</h1>
          <p className="text-muted-foreground">Create a new account for IIIT Manipur portal</p>
        </div>
      </div>

      <Card className="academic-card">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Fill in the details to create a new user account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@iiitm.ac.in"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Department (conditional) */}
              {shouldShowDepartment && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Batch (conditional) */}
              {shouldShowBatch && (
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Select value={formData.batch} onValueChange={(value) => handleInputChange("batch", value)}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map((batch) => (
                          <SelectItem key={batch} value={batch}>
                            {batch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <Button 
                type="submit" 
                variant="academic" 
                size="lg" 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Creating User..." : "Create User"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="lg"
                onClick={() => setFormData({
                  name: "",
                  email: "",
                  password: "",
                  phone: "",
                  role: "",
                  department: "",
                  batch: ""
                })}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};