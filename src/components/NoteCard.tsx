import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Note } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Lock, Heart } from "lucide-react";
import { toggleLike } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";

interface NoteCardProps {
  note: Note;
  onNoteUpdated?: (updatedNote: Note) => void;
  onDelete?: (id: string) => void;
  onEdit?: (note: Note) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onNoteUpdated, onDelete, onEdit }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(false);
  const currentUser = user;

  useEffect(() => {
    if (note.likes) {
      const hasLiked = note.likes.some(like => {
        if (typeof like === 'string') {
          return like === currentUser?.id || like === currentUser?._id;
        }
        return like && (like.id || like._id) === (currentUser?.id || currentUser?._id);
      });
      setIsLiked(hasLiked);
    }
  }, [note.likes, currentUser]);

  const toggleLikeMutation = useMutation({
    mutationFn: toggleLike,
    onMutate: async (noteId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notes'] });

      // Snapshot the previous value
      const previousNotes = queryClient.getQueryData(['notes']);

      // Optimistically update to the new value
      queryClient.setQueryData(['notes'], (old: Note[] | undefined) => {
        if (!old) return old;
        return old.map(n => {
          if (n.id === noteId) {
            const newLikes = isLiked 
              ? n.likes.filter(like => {
                  if (typeof like === 'string') {
                    return like !== currentUser?.id && like !== currentUser?._id;
                  }
                  return like && (like.id || like._id) !== (currentUser?.id || currentUser?._id);
                })
              : [...n.likes, currentUser?.id || currentUser?._id];
            return { ...n, likes: newLikes };
          }
          return n;
        });
      });

      // Return a context object with the snapshotted value
      return { previousNotes };
    },
    onError: (err, newNote, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousNotes) {
        queryClient.setQueryData(['notes'], context.previousNotes);
      }
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache is in sync
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (!currentUser) {
        toast({
          title: "Authentication required",
          description: "Please log in to like notes",
          variant: "destructive"
        });
        return;
      }

      const noteId = note._id || note.id;
      await toggleLikeMutation.mutateAsync(noteId);
      setIsLiked(!isLiked);
      toast({
        title: "Success",
        description: isLiked ? "Note unliked" : "Note liked"
      });

      if (onNoteUpdated) {
        onNoteUpdated(note);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
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
