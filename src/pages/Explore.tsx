import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getNotes } from "@/services/api";
import NoteCard from "@/components/NoteCard";
import NoteFilters from "@/components/NoteFilters";
import Layout from "@/components/Layout";
import { useToast } from "@/components/ui/use-toast";
import { Note } from "@/types";

const Explore: React.FC = () => {
  const [filters, setFilters] = useState({
    branch: "",
    year: "",
    subject: "",
    search: "",
  });

  const { toast } = useToast();

  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ['notes', filters],
    queryFn: () => getNotes(filters),
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    refetchOnWindowFocus: true,
  });

  const filteredNotes = notes.filter((note: Note) => {
    const matchesBranch = !filters.branch || note.branch === filters.branch;
    const matchesYear = !filters.year || note.year === filters.year;
    const matchesSubject = !filters.subject || note.subject === filters.subject;
    const matchesSearch = !filters.search || 
      note.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      note.content.toLowerCase().includes(filters.search.toLowerCase());

    return matchesBranch && matchesYear && matchesSubject && matchesSearch;
  });

  if (error) {
    toast({
      title: "Error",
      description: "Failed to fetch notes",
      variant: "destructive"
    });
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Explore Notes</h1>
        <NoteFilters filters={filters} onFilterChange={setFilters} />
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No notes found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Explore;
