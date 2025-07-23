import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Plus, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  department?: { name: string };
}

interface Assignment {
  id: string;
  course: Course;
  faculty: { full_name: string };
  batch: { name: string };
  semester: string;
  year: number;
}

interface Batch {
  id: string;
  name: string;
}

interface Faculty {
  user_id: string;
  full_name: string;
}

interface Department {
  id: string;
  name: string;
}

export const CourseAssignmentPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [courseFormData, setCourseFormData] = useState({
    code: "",
    name: "",
    credits: "",
    department_id: ""
  });

  const [assignmentFormData, setAssignmentFormData] = useState({
    course_id: "",
    faculty_id: "",
    batch_id: "",
    semester: "",
    year: new Date().getFullYear().toString()
  });

  const isAcademicSection = user?.role === "Academic Section";
  const isFaculty = user?.role === "Faculty";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch courses
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select(`
          *,
          department:departments(name)
        `)
        .order("code");

      if (courseError) throw courseError;
      setCourses(courseData || []);

      // Fetch assignments
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("course_assignments")
        .select(`
          *,
          course:courses(*),
          faculty:profiles!course_assignments_faculty_id_fkey(full_name),
          batch:batches(name)
        `)
        .order("year", { ascending: false })
        .order("semester");

      if (assignmentError) throw assignmentError;
      setAssignments(assignmentData || []);

      // Fetch batches
      const { data: batchData, error: batchError } = await supabase
        .from("batches")
        .select("id, name")
        .order("name");

      if (batchError) throw batchError;
      setBatches(batchData || []);

      // Fetch faculty
      const { data: facultyData, error: facultyError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("role", "Faculty");

      if (facultyError) throw facultyError;
      setFaculty(facultyData || []);

      // Fetch departments
      const { data: deptData, error: deptError } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");

      if (deptError) throw deptError;
      setDepartments(deptData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from("courses")
        .insert({
          code: courseFormData.code,
          name: courseFormData.name,
          credits: parseInt(courseFormData.credits),
          department_id: courseFormData.department_id || null
        });

      if (error) throw error;

      toast.success("Course added successfully");
      setCourseFormData({ code: "", name: "", credits: "", department_id: "" });
      setShowCourseForm(false);
      fetchData();
    } catch (error) {
      console.error("Error adding course:", error);
      toast.error("Failed to add course");
    }
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from("course_assignments")
        .insert({
          course_id: assignmentFormData.course_id,
          faculty_id: assignmentFormData.faculty_id,
          batch_id: assignmentFormData.batch_id,
          semester: assignmentFormData.semester,
          year: parseInt(assignmentFormData.year)
        });

      if (error) throw error;

      toast.success("Course assigned successfully");
      setAssignmentFormData({
        course_id: "", faculty_id: "", batch_id: "", 
        semester: "", year: new Date().getFullYear().toString()
      });
      setShowAssignmentForm(false);
      fetchData();
    } catch (error) {
      console.error("Error assigning course:", error);
      toast.error("Failed to assign course");
    }
  };

  const getFacultyAssignments = () => {
    if (!isFaculty || !user?.isAuthenticated) return [];
    return assignments.filter(assignment => assignment.faculty_id === user.email);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const facultyAssignments = getFacultyAssignments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Course Management</h1>
          <p className="text-muted-foreground">
            {isAcademicSection ? "Manage courses and assignments" : "View your course assignments"}
          </p>
        </div>
      </div>

      {isFaculty ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              My Assigned Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {facultyAssignments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No courses assigned to you
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facultyAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.course.code}
                      </TableCell>
                      <TableCell>{assignment.course.name}</TableCell>
                      <TableCell>{assignment.batch.name}</TableCell>
                      <TableCell>{assignment.semester}</TableCell>
                      <TableCell>{assignment.course.credits}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : isAcademicSection ? (
        <Tabs defaultValue="assignments" className="w-full">
          <TabsList>
            <TabsTrigger value="assignments">Course Assignments</TabsTrigger>
            <TabsTrigger value="courses">Manage Courses</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Course Assignments</h2>
              <Button onClick={() => setShowAssignmentForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Assign Course
              </Button>
            </div>

            {showAssignmentForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Assign Course to Faculty</CardTitle>
                  <CardDescription>
                    Assign a course to faculty for a specific batch and semester
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Course</label>
                        <Select
                          value={assignmentFormData.course_id}
                          onValueChange={(value) => setAssignmentFormData({ ...assignmentFormData, course_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.code} - {course.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Faculty</label>
                        <Select
                          value={assignmentFormData.faculty_id}
                          onValueChange={(value) => setAssignmentFormData({ ...assignmentFormData, faculty_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select faculty" />
                          </SelectTrigger>
                          <SelectContent>
                            {faculty.map((f) => (
                              <SelectItem key={f.user_id} value={f.user_id}>
                                {f.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Batch</label>
                        <Select
                          value={assignmentFormData.batch_id}
                          onValueChange={(value) => setAssignmentFormData({ ...assignmentFormData, batch_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {batches.map((batch) => (
                              <SelectItem key={batch.id} value={batch.id}>
                                {batch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Semester</label>
                        <Select
                          value={assignmentFormData.semester}
                          onValueChange={(value) => setAssignmentFormData({ ...assignmentFormData, semester: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                              <SelectItem key={sem} value={sem.toString()}>
                                Semester {sem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Year</label>
                        <Input
                          type="number"
                          value={assignmentFormData.year}
                          onChange={(e) => setAssignmentFormData({ ...assignmentFormData, year: e.target.value })}
                          placeholder="2024"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit">Assign Course</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAssignmentForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Faculty</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Year</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{assignment.course.code}</div>
                            <div className="text-sm text-muted-foreground">{assignment.course.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{assignment.faculty.full_name}</TableCell>
                        <TableCell>{assignment.batch.name}</TableCell>
                        <TableCell>Semester {assignment.semester}</TableCell>
                        <TableCell>{assignment.year}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Manage Courses</h2>
              <Button onClick={() => setShowCourseForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Course
              </Button>
            </div>

            {showCourseForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Course</CardTitle>
                  <CardDescription>
                    Add a new course to the curriculum
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCourseSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Course Code</label>
                        <Input
                          value={courseFormData.code}
                          onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value })}
                          placeholder="e.g., CS101"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Course Name</label>
                        <Input
                          value={courseFormData.name}
                          onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })}
                          placeholder="e.g., Introduction to Computer Science"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Credits</label>
                        <Input
                          type="number"
                          value={courseFormData.credits}
                          onChange={(e) => setCourseFormData({ ...courseFormData, credits: e.target.value })}
                          placeholder="4"
                          min="1"
                          max="10"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Department</label>
                        <Select
                          value={courseFormData.department_id}
                          onValueChange={(value) => setCourseFormData({ ...courseFormData, department_id: value })}
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
                    <div className="flex space-x-2">
                      <Button type="submit">Add Course</Button>
                      <Button type="button" variant="outline" onClick={() => setShowCourseForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Department</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.code}</TableCell>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.credits}</TableCell>
                        <TableCell>{course.department?.name || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
};