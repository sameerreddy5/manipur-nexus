import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  onLogin: (email: string, role: string) => void;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Mock user data - In real app, this would come from backend
  const mockUsers = {
    "admin@iiitm.ac.in": { password: "admin123", role: "Admin" },
    "faculty@iiitm.ac.in": { password: "faculty123", role: "Faculty" },
    "student@iiitm.ac.in": { password: "student123", role: "Student" },
    "academic@iiitm.ac.in": { password: "academic123", role: "Academic Section" },
    "director@iiitm.ac.in": { password: "director123", role: "Director" },
    "warden@iiitm.ac.in": { password: "warden123", role: "Hostel Warden" },
    "mess@iiitm.ac.in": { password: "mess123", role: "Mess Supervisor" },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate API call
    setTimeout(() => {
      const user = mockUsers[email as keyof typeof mockUsers];
      
      if (user && user.password === password) {
        toast({
          title: "Login Successful",
          description: `Welcome back! Logging in as ${user.role}`,
        });
        onLogin(email, user.role);
      } else {
        setError("Invalid email or password");
        toast({
          title: "Login Failed",
          description: "Please check your credentials and try again",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        {/* IIIT Manipur Branding */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <GraduationCap className="h-12 w-12 text-white" />
            <div>
              <h1 className="text-3xl font-heading font-bold text-white">IIIT Manipur</h1>
              <p className="text-white/80 text-sm">Academic Portal</p>
            </div>
          </div>
        </div>

        <Card className="academic-card border-0 shadow-xl backdrop-blur-sm bg-white/95">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-heading">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your IIIT Manipur account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="animate-fade-in">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@iiitm.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="academic"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Demo Credentials:</p>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p>Admin: admin@iiitm.ac.in / admin123</p>
                <p>Faculty: faculty@iiitm.ac.in / faculty123</p>
                <p>Student: student@iiitm.ac.in / student123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};