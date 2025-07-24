import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Mail, Lock, GraduationCap, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

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
    "Computer Science and Engineering",
    "Electronics and Communication Engineering", 
    "Mathematics and Computing"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        
        if (error) {
          setError(error.message);
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login Successful",
            description: "Welcome back to IIIT Manipur Portal",
          });
          navigate("/");
        }
      } else {
        if (!fullName || !role) {
          setError("Please fill in all required fields");
          return;
        }

        const { error } = await signUp(
          email, 
          password, 
          fullName, 
          role, 
          phone || undefined,
          department || undefined,
          batch || undefined
        );
        
        if (error) {
          setError(error.message);
          toast({
            title: "Signup Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account Created",
            description: "Please check your email to verify your account",
          });
          setMode("login");
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg space-y-4 sm:space-y-6 animate-slide-up">
        {/* IIIT Manipur Branding */}
        <div className="text-center space-y-2 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3">
            <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white">IIIT Manipur</h1>
              <p className="text-white/80 text-xs sm:text-sm">Academic Portal</p>
            </div>
          </div>
        </div>

        <Card className="academic-card border-0 shadow-xl backdrop-blur-sm bg-white/95">
          <CardHeader className="space-y-1 text-center px-4 sm:px-6 py-4 sm:py-6">
            <CardTitle className="text-xl sm:text-2xl font-heading">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {mode === "login" 
                ? "Sign in to your IIIT Manipur account" 
                : "Join the IIIT Manipur community"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {error && (
                <Alert variant="destructive" className="animate-fade-in">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select value={role} onValueChange={setRole} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((roleOption) => (
                          <SelectItem key={roleOption} value={roleOption}>
                            {roleOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {(role === "Faculty" || role === "Student") && (
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select value={department} onValueChange={setDepartment}>
                        <SelectTrigger>
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
                  )}

                  {role === "Student" && (
                    <div className="space-y-2">
                      <Label htmlFor="batch">Batch</Label>
                      <Input
                        id="batch"
                        type="text"
                        placeholder="e.g., BTech 2024"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                      />
                    </div>
                  )}
                </>
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
                {isLoading 
                  ? (mode === "login" ? "Signing In..." : "Creating Account...") 
                  : (mode === "login" ? "Sign In" : "Create Account")
                }
              </Button>
            </form>

            {mode === "login" && (
              <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Demo Credentials:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <p className="font-medium text-blue-800">Admin:</p>
                    <p className="text-blue-700">admin@iiitmanipur.ac.in / admin123</p>
                    <p className="font-medium text-blue-800">Student:</p>
                    <p className="text-blue-700">student@iiitmanipur.ac.in / student123</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-blue-800">Faculty:</p>
                    <p className="text-blue-700">faculty@iiitmanipur.ac.in / faculty123</p>
                    <p className="font-medium text-blue-800">Warden:</p>
                    <p className="text-blue-700">warden@iiitmanipur.ac.in / warden123</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 sm:mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError("");
                }}
                className="text-xs sm:text-sm text-primary hover:underline transition-colors"
              >
                {mode === "login" 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};