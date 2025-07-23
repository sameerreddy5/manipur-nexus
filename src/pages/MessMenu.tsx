import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Utensils, Plus, Calendar, Coffee, Sandwich, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  date: string;
  meal_type: string;
  items: string[];
  created_at: string;
}

export const MessMenuPage = () => {
  const { user } = useAuth();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: "",
    meal_type: "",
    items: ""
  });

  const isMessSupervisor = user?.role === "Mess Supervisor";
  const currentDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const { data, error } = await supabase
        .from("mess_menus")
        .select("*")
        .order("date", { ascending: false })
        .order("meal_type", { ascending: true });

      if (error) throw error;
      setMenus(data || []);
    } catch (error) {
      console.error("Error fetching menus:", error);
      toast.error("Failed to fetch mess menus");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.isAuthenticated) return;

    try {
      const itemsArray = formData.items.split(',').map(item => item.trim()).filter(item => item);
      
      const { error } = await supabase
        .from("mess_menus")
        .insert({
          date: formData.date,
          meal_type: formData.meal_type,
          items: itemsArray,
          created_by: user.email
        });

      if (error) throw error;

      toast.success("Menu added successfully");
      setFormData({ date: "", meal_type: "", items: "" });
      setShowForm(false);
      fetchMenus();
    } catch (error) {
      console.error("Error adding menu:", error);
      toast.error("Failed to add menu");
    }
  };

  const getTodaysMenu = () => {
    return menus.filter(menu => menu.date === currentDate);
  };

  const getWeekMenu = () => {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    return menus.filter(menu => {
      const menuDate = new Date(menu.date);
      return menuDate >= weekStart && menuDate <= weekEnd;
    });
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case "Breakfast": return <Coffee className="h-4 w-4" />;
      case "Lunch": return <Sandwich className="h-4 w-4" />;
      case "Dinner": return <UtensilsCrossed className="h-4 w-4" />;
      default: return <Utensils className="h-4 w-4" />;
    }
  };

  const getMealColor = (mealType: string) => {
    switch (mealType) {
      case "Breakfast": return "bg-orange-500";
      case "Lunch": return "bg-green-500";
      case "Dinner": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const todaysMenu = getTodaysMenu();
  const weekMenu = getWeekMenu();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Mess Menu</h1>
          <p className="text-muted-foreground">
            {isMessSupervisor ? "Manage daily mess menus" : "View today's and weekly mess menu"}
          </p>
        </div>
        {isMessSupervisor && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Menu
          </Button>
        )}
      </div>

      {showForm && isMessSupervisor && (
        <Card>
          <CardHeader>
            <CardTitle>Add Menu Item</CardTitle>
            <CardDescription>
              Add menu for a specific date and meal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Meal Type</label>
                  <Select
                    value={formData.meal_type}
                    onValueChange={(value) => setFormData({ ...formData, meal_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select meal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Breakfast">Breakfast</SelectItem>
                      <SelectItem value="Lunch">Lunch</SelectItem>
                      <SelectItem value="Dinner">Dinner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Menu Items (comma-separated)</label>
                <Input
                  value={formData.items}
                  onChange={(e) => setFormData({ ...formData, items: e.target.value })}
                  placeholder="e.g., Rice, Dal, Vegetable, Roti"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Add Menu</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="today" className="w-full">
        <TabsList>
          <TabsTrigger value="today">Today's Menu</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Today's Menu - {new Date().toLocaleDateString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysMenu.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No menu available for today
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {todaysMenu.map((menu) => (
                    <Card key={menu.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                          {getMealIcon(menu.meal_type)}
                          <span className="ml-2">{menu.meal_type}</span>
                          <Badge className={`ml-auto ${getMealColor(menu.meal_type)}`}>
                            {menu.meal_type}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {menu.items.map((item, index) => (
                            <li key={index} className="text-sm">• {item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Utensils className="mr-2 h-5 w-5" />
                Weekly Menu
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weekMenu.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No menu available for this week
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Items</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekMenu.map((menu) => (
                      <TableRow key={menu.id}>
                        <TableCell>
                          {new Date(menu.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getMealColor(menu.meal_type)}>
                            {menu.meal_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {menu.items.join(", ")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};