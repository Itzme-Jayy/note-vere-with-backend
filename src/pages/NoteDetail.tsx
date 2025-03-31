import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Note } from "@/types";
import { getNoteById, deleteNote, toggleLike, toggleNotePrivacy } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, FileText, Pencil, Trash2, User, Calendar, Eye, Lock, Loader, Download, Heart } from "lucide-react";
import { format } from "date-fns";
import { API_URL } from "@/services/api";

const NoteDetail = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const isOwner = user && note && (
    user.id === note.authorId || 
    user.id === note.author?._id || 
    user._id === note.authorId || 
    user._id === note.author?._id
  );
  
  const likes = note?.likes || [];
  const isLiked = user && note ? likes.some(like => {
    if (typeof like === 'string') {
      return like === user.id || like === user._id;
    }
    return like && (like.id || like._id) === (user.id || user._id);
  }) : false;

  useEffect(() => {
    const fetchNote = async () => {
      if (!noteId) {
        toast({
          title: "Error",
          description: "Invalid note ID",
          variant: "destructive",
        });
        navigate("/explore");
        return;
      }
      
      setIsLoading(true);
      try {
        const noteData = await getNoteById(noteId);
        setNote(noteData);
      } catch (error: any) {
        console.error("Error fetching note:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load note",
          variant: "destructive",
        });
        navigate("/explore");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [noteId, toast, navigate]);

  const handleDelete = async () => {
    if (!noteId) return;
    
    setIsDeleting(true);
    try {
      await deleteNote(noteId);
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
      navigate("/my-notes");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleToggleLike = async () => {
    if (!noteId || !user) return;
    
    try {
      const noteToLike = note?._id || note?.id || noteId;
      console.log('Attempting to like note with ID:', noteToLike);
      const updatedNote = await toggleLike(noteToLike);
      setNote(updatedNote);
      toast({
        title: isLiked ? "Note unliked" : "Note liked",
        description: isLiked ? "You've removed your like" : "You've liked this note",
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to like/unlike note",
        variant: "destructive",
      });
    }
  };
  
  const handleTogglePrivacy = async () => {
    if (!noteId || !isOwner) return;
    
    try {
      const updatedNote = await toggleNotePrivacy(noteId);
      setNote(updatedNote);
      toast({
        title: "Privacy updated",
        description: updatedNote.isPublic ? "Note is now public" : "Note is now private",
      });
    } catch (error) {
      console.error("Error toggling privacy:", error);
      toast({
        title: "Error",
        description: "Failed to update note privacy",
        variant: "destructive",
      });
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

  if (!note) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Note Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The note you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button 
            variant="outline" 
            className="mt-6"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
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
        </div>

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{note.title}</h1>
              {note.isPublic ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Private
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary">{note.branch}</Badge>
              <Badge variant="secondary">{note.year}</Badge>
              {note.subject && <Badge>{note.subject}</Badge>}
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="gap-1"
              onClick={handleToggleLike}
              disabled={!user}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span>{likes.length} {likes.length === 1 ? 'Like' : 'Likes'}</span>
            </Button>
            
            {isOwner && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{note.isPublic ? 'Public' : 'Private'}</span>
                  <Switch 
                    checked={note.isPublic} 
                    onCheckedChange={handleTogglePrivacy}
                  />
                </div>
                
                <Link to={`/edit-note/${note.id}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-1">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your note and remove it from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row text-sm text-muted-foreground gap-4 sm:gap-8">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <Link to={`/user/${note.authorId}`} className="hover:underline">
              By {note.author?.username || "Unknown"}
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Created {format(new Date(note.createdAt), "MMM d, yyyy")}</span>
          </div>
          {note.updatedAt !== note.createdAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Updated {format(new Date(note.updatedAt), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>

        <Card className="p-6">
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap">{note.content}</p>
          </div>
        </Card>

        {note.files.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Attachments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {note.files.map((file) => (
                <Card key={file.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <a 
                    href={`${API_URL}/files/download/${file.url.split('/').pop()}`} 
                    download={file.name} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" className="gap-1">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </a>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NoteDetail;
