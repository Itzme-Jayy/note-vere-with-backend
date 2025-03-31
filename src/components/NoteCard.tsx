import React from "react";
import { Link } from "react-router-dom";
import { Note } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Lock, Heart } from "lucide-react";
import { toggleLikeNote } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

interface NoteCardProps {
  note: Note;
  onNoteUpdated?: (updatedNote: Note) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onNoteUpdated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Safety check - ensure note.likes is always an array
  const likes = note.likes || [];
  
  // Check if liked by converting user IDs to strings for comparison
  const isLiked = user ? likes.some(like => 
    (typeof like === 'string' ? like : like.id) === user.id
  ) : false;
  
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Stop event propagation
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like notes",
      });
      return;
    }
    
    try {
      const noteId = note._id || note.id;
      const updatedNote = await toggleLikeNote(noteId);
      if (onNoteUpdated) {
        onNoteUpdated(updatedNote);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to like note",
        variant: "destructive",
      });
    }
  };

  const noteId = note._id || note.id;
  return (
    <Link to={`/note/${noteId}`}>
      <Card className="note-card h-full flex flex-col transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold line-clamp-1">{note.title}</CardTitle>
            {note.isPublic ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { key: 'branch', label: note.branch, variant: 'outline' as const },
              { key: 'year', label: note.year, variant: 'outline' as const },
              note.subject ? { key: 'subject', label: note.subject, variant: 'default' as const } : null
            ].filter(Boolean).map(({ key, label, variant }) => (
              <Badge key={`${noteId}-${key}`} variant={variant}>
                {label}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="py-2 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {note.content}
          </p>
          {note.files.length > 0 && (
            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>{note.files.length} attachment{note.files.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-2 text-xs text-muted-foreground border-t">
          <div className="w-full flex justify-between items-center">
            <span>By {note.author?.username || 'Unknown'}</span>
            <div className="flex items-center gap-4">
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                className="h-auto p-0 hover:bg-transparent"
                onClick={handleLike}
              >
                <Heart 
                  className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                />
                <span className="ml-1">{likes.length}</span>
              </Button>
              <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default NoteCard;
