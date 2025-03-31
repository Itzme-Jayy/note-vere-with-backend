
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import NoteCard from "@/components/NoteCard";
import NoteFilters from "@/components/NoteFilters";
import { Note, Filter } from "@/types";
import { getNotes } from "@/services/api";
import { Loader } from "lucide-react";

const Explore = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>({});

  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true);
      try {
        const notesData = await getNotes(filter);
        setNotes(notesData);
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [filter]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold">Explore Notes</h1>
            <p className="text-muted-foreground mt-1">
              Discover and browse notes shared by other students
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <NoteFilters filter={filter} setFilter={setFilter} />
          </div>
          
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <h3 className="text-xl font-medium">No notes found</h3>
                <p className="text-muted-foreground mt-2">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Showing {notes.length} result{notes.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Explore;
