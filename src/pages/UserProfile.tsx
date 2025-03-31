
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import NoteCard from "@/components/NoteCard";
import { User, Note } from "@/types";
import { getUserProfile } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Loader, Search, User as UserIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const { user, notes } = await getUserProfile(userId);
        setUser(user);
        setNotes(notes);
        setFilteredNotes(notes);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [userId, toast]);
  
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
  
  const handleNoteUpdated = (updatedNote: Note) => {
    // Make sure note.likes is initialized as an empty array if undefined
    const safeUpdatedNote = {
      ...updatedNote,
      likes: updatedNote.likes || []
    };
    
    setNotes(prevNotes => 
      prevNotes.map(note => note.id === updatedNote.id ? safeUpdatedNote : note)
    );
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
  
  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">User Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The user you're looking for doesn't exist.
          </p>
          <Link to="/">
            <button className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded">
              Go Home
            </button>
          </Link>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <UserIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user.username}</h1>
              <p className="text-muted-foreground">@{user.username.toLowerCase().replace(/\s+/g, '')}</p>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notes" className="space-y-6">
            <form className="relative max-w-md" onSubmit={(e) => e.preventDefault()}>
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </form>
            
            {filteredNotes.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-lg">
                <h3 className="text-xl font-medium">No notes found</h3>
                <p className="text-muted-foreground mt-2">
                  {notes.length === 0
                    ? "This user hasn't created any public notes yet"
                    : "No notes match your search criteria"}
                </p>
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserProfile;
