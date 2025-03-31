import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import NoteCard from "@/components/NoteCard";
import { Note } from "@/types";
import { getUserNotes } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader, FileText } from "lucide-react";

const MyNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        console.log('Fetching notes for user:', user.id);
        const userNotes = await getUserNotes(user.id);
        console.log('Fetched notes:', userNotes);
        setNotes(userNotes);
        setFilteredNotes(userNotes);
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [user]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredNotes(notes);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const filtered = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(lowerCaseSearchTerm) ||
          note.subject.toLowerCase().includes(lowerCaseSearchTerm) ||
          note.content.toLowerCase().includes(lowerCaseSearchTerm)
      );
      setFilteredNotes(filtered);
    }
  }, [searchTerm, notes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the useEffect
  };
  
  const handleNoteUpdated = (updatedNote: Note) => {
    // Format the updated note to ensure consistent data structure
    const formattedNote = {
      ...updatedNote,
      id: updatedNote._id || updatedNote.id,
      authorId: updatedNote.author?._id || updatedNote.authorId,
      likes: Array.isArray(updatedNote.likes) ? updatedNote.likes.map(like => 
        typeof like === 'string' ? like : like._id || like.id
      ) : [],
      files: updatedNote.files || [],
      isPublic: updatedNote.isPublic,
      author: updatedNote.author ? {
        id: updatedNote.author._id || updatedNote.author.id,
        username: updatedNote.author.username,
        email: updatedNote.author.email
      } : undefined,
      createdAt: updatedNote.createdAt,
      updatedAt: updatedNote.updatedAt
    };

    // Update the notes state
    setNotes(prevNotes => {
      const noteIndex = prevNotes.findIndex(n => 
        (n._id || n.id) === (formattedNote._id || formattedNote.id)
      );
      
      if (noteIndex === -1) {
        // If note doesn't exist, add it
        return [...prevNotes, formattedNote];
      }
      
      // If note exists, update it
      const newNotes = [...prevNotes];
      newNotes[noteIndex] = formattedNote;
      return newNotes;
    });

    // Update filtered notes if there's a search term
    if (searchTerm) {
      setFilteredNotes(prevNotes => {
        const noteIndex = prevNotes.findIndex(n => 
          (n._id || n.id) === (formattedNote._id || formattedNote.id)
        );
        
        if (noteIndex === -1) {
          // If note doesn't exist in filtered results, add it if it matches the search
          if (formattedNote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              formattedNote.content.toLowerCase().includes(searchTerm.toLowerCase())) {
            return [...prevNotes, formattedNote];
          }
          return prevNotes;
        }
        
        // If note exists in filtered results, update it
        const newNotes = [...prevNotes];
        newNotes[noteIndex] = formattedNote;
        return newNotes;
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Notes</h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal collection of notes
            </p>
          </div>
          <Link to="/create-note">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Note
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSearch} className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search your notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </form>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-lg">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium">No notes found</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              {notes.length === 0
                ? "You haven't created any notes yet"
                : "No notes match your search criteria"}
            </p>
            {notes.length === 0 && (
              <Link to="/create-note">
                <Button>Create Your First Note</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <NoteCard 
                key={note.id} 
                note={note} 
                onNoteUpdated={handleNoteUpdated}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyNotes;
