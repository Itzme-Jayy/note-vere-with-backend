import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Note } from "@/types";
import { getNotes } from "@/services/api";
import NoteCard from "@/components/NoteCard";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/Layout";

const LikedNotes: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikedNotes = async () => {
      try {
        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please log in to view your liked notes",
            variant: "destructive"
          });
          return;
        }

        const allNotes = await getNotes();
        // Filter notes that the current user has liked
        const likedNotes = allNotes.filter(note => 
          note.likes.some(like => 
            (typeof like === 'string' ? like : like.id) === user.id
          )
        );

        setNotes(likedNotes);
      } catch (error) {
        console.error('Error fetching liked notes:', error);
        toast({
          title: "Error",
          description: "Failed to fetch liked notes",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLikedNotes();
  }, [user, toast]);

  const handleNoteUpdated = (updatedNote: Note) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      )
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Liked Notes</h1>
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">You haven't liked any notes yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
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

export default LikedNotes; 