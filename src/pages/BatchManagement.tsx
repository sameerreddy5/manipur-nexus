import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Plus, Edit, Trash2, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Batch {
  id: string;
  name: string;
  year: number;
  created_at: string;
}

interface Section {
  id: string;
  name: string;
  batch_id: string;
}

export const BatchManagementPage = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sections, setSections] = useState<{ [key: string]: Section[] }>({});
  const [loading, setLoading] = useState(true);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [batchFormData, setBatchFormData] = useState({
    name: "",
    year: new Date().getFullYear()
  });
  const [sectionFormData, setSectionFormData] = useState({
    name: ""
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
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data: batchData, error: batchError } = await supabase
        .from('batches')
        .select('*')
        .order('year', { ascending: false });

      if (batchError) throw batchError;

      setBatches(batchData || []);

      // Fetch sections for each batch
      const { data: sectionData, error: sectionError } = await supabase
        .from('sections')
        .select('*')
        .order('name');

      if (sectionError) throw sectionError;

      // Group sections by batch_id
      const groupedSections: { [key: string]: Section[] } = {};
      sectionData?.forEach(section => {
        if (!groupedSections[section.batch_id]) {
          groupedSections[section.batch_id] = [];
        }
        groupedSections[section.batch_id].push(section);
      });

      setSections(groupedSections);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('batches')
        .insert({
          name: batchFormData.name,
          year: batchFormData.year
        });

      if (error) throw error;

      toast.success('Batch created successfully');
      setBatchFormData({ name: "", year: new Date().getFullYear() });
      setBatchDialogOpen(false);
      fetchBatches();
    } catch (error: any) {
      console.error('Error creating batch:', error);
      toast.error(error.message || 'Failed to create batch');
    }
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('sections')
        .insert({
          name: sectionFormData.name,
          batch_id: selectedBatchId
        });

      if (error) throw error;

      toast.success('Section created successfully');
      setSectionFormData({ name: "" });
      setSectionDialogOpen(false);
      fetchBatches();
    } catch (error: any) {
      console.error('Error creating section:', error);
      toast.error(error.message || 'Failed to create section');
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch? This will also delete all sections in this batch.')) return;

    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Batch deleted successfully');
      fetchBatches();
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast.error('Failed to delete batch');
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Section deleted successfully');
      fetchBatches();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };

  const openSectionDialog = (batchId: string) => {
    setSelectedBatchId(batchId);
    setSectionDialogOpen(true);
  };

  if (loading) {
    return <div className="p-6">Loading batches...</div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Batch & Section Management</h1>
          <p className="text-muted-foreground">
            Manage academic batches and their sections
          </p>
        </div>
        
        <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
              <DialogDescription>
                Add a new academic batch year
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleBatchSubmit} className="space-y-4">
              <div>
                <Label htmlFor="batch_name">Batch Name</Label>
                <Input
                  id="batch_name"
                  value={batchFormData.name}
                  onChange={(e) => setBatchFormData({ ...batchFormData, name: e.target.value })}
                  placeholder="e.g., Batch 2024"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="batch_year">Year</Label>
                <Input
                  id="batch_year"
                  type="number"
                  value={batchFormData.year}
                  onChange={(e) => setBatchFormData({ ...batchFormData, year: parseInt(e.target.value) })}
                  min="2020"
                  max="2030"
                  required
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button type="submit" className="flex-1">Create Batch</Button>
                <Button type="button" variant="outline" onClick={() => setBatchDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Section Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="animate-scale-in">
          <DialogHeader>
            <DialogTitle>Add New Section</DialogTitle>
            <DialogDescription>
              Add a section to the selected batch
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSectionSubmit} className="space-y-4">
            <div>
              <Label htmlFor="section_name">Section Name</Label>
              <Input
                id="section_name"
                value={sectionFormData.name}
                onChange={(e) => setSectionFormData({ name: e.target.value })}
                placeholder="e.g., A, B, C"
                required
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button type="submit" className="flex-1">Add Section</Button>
              <Button type="button" variant="outline" onClick={() => setSectionDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Batches List */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Academic Batches
          </CardTitle>
          <CardDescription>
            Expandable list of batches with their sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No batches found. Create one to get started.
            </p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {batches.map((batch) => (
                <AccordionItem key={batch.id} value={batch.id} className="animate-accordion-down">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{batch.year}</Badge>
                        <span className="font-medium">{batch.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {sections[batch.id]?.length || 0} sections
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBatch(batch.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="animate-accordion-up">
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium flex items-center">
                          <Users className="mr-2 h-4 w-4" />
                          Sections in {batch.name}
                        </h4>
                        <Button
                          size="sm"
                          onClick={() => openSectionDialog(batch.id)}
                        >
                          <Plus className="mr-2 h-3 w-3" />
                          Add Section
                        </Button>
                      </div>
                      
                      {sections[batch.id]?.length === 0 || !sections[batch.id] ? (
                        <p className="text-muted-foreground text-sm">
                          No sections yet. Add one to get started.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {sections[batch.id]?.map((section) => (
                            <div
                              key={section.id}
                              className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover-scale"
                            >
                              <div>
                                <span className="font-medium">Section {section.name}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteSection(section.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};