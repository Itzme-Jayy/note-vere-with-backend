
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import FileUpload from "@/components/FileUpload";
import { Note, NoteFile, Branch, Year } from "@/types";
import { getNoteById, updateNote, getBranches, getYears } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, Loader } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const EditNote = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [files, setFiles] = useState<NoteFile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!noteId) return;
      
      setIsLoading(true);
      try {
        const [noteData, branchesData, yearsData] = await Promise.all([
          getNoteById(noteId),
          getBranches(),
          getYears(),
        ]);
        
        if (!noteData) {
          toast({
            title: "Error",
            description: "Note not found",
            variant: "destructive",
          });
          navigate("/my-notes");
          return;
        }
        
        // Check if user has permission to edit this note
        if (user?.id !== noteData.authorId) {
          toast({
            title: "Access denied",
            description: "You don't have permission to edit this note",
            variant: "destructive",
          });
          navigate(`/note/${noteId}`);
          return;
        }
        
        setNote(noteData);
        setTitle(noteData.title);
        setContent(noteData.content);
        setBranch(noteData.branch);
        setYear(noteData.year);
        setSubject(noteData.subject);
        setIsPublic(noteData.isPublic);
        setFiles(noteData.files);
        
        setBranches(branchesData);
        setYears(yearsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load note data",
          variant: "destructive",
        });
        navigate("/my-notes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [noteId, toast, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!noteId || !note) return;
    
    if (!title || !content || !branch || !year) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateNote(noteId, {
        title,
        content,
        branch,
        year,
        subject,
        isPublic,
        files,
      });
      
      toast({
        title: "Success",
        description: "Your note has been updated successfully",
      });
      
      navigate(`/note/${noteId}`);
    } catch (error) {
      console.error("Error updating note:", error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Edit Note</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note content here..."
                className="min-h-[200px]"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="branch">Branch</Label>
                <Select
                  value={branch}
                  onValueChange={setBranch}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="year">Year</Label>
                <Select
                  value={year}
                  onValueChange={setYear}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Calculus, Physics"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="public" className="cursor-pointer">
                Make this note public
              </Label>
              <span className="text-xs text-muted-foreground">
                {isPublic ? "Anyone can view this note" : "Only you can see this note"}
              </span>
            </div>
            
            <div>
              <Label>Attachments</Label>
              <FileUpload files={files} setFiles={setFiles} />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditNote;
