
import React from "react";
import { Link } from "react-router-dom";
import { Note } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Eye, Lock } from "lucide-react";

interface NoteCardProps {
  note: Note;
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  return (
    <Link to={`/note/${note.id}`}>
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
          <CardDescription className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">{note.branch}</Badge>
            <Badge variant="outline">{note.year}</Badge>
            {note.subject && <Badge>{note.subject}</Badge>}
          </CardDescription>
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
            <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default NoteCard;
