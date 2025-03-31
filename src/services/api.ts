import { Note, User, Branch, Year, Filter, NoteFile } from "../types";
import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock data for branches
const BRANCHES: Branch[] = [
  { id: "cs", name: "Computer Science" },
  { id: "it", name: "Information Technology" },
  { id: "ee", name: "Electrical Engineering" },
  { id: "ece", name: "Electronics & Communication" },
  { id: "ete", name: "Electronics & Telecommunication" },
  { id: "me", name: "Mechanical Engineering" },
  { id: "prod", name: "Production Engineering" },
  { id: "textile", name: "Textile Engineering" },
  { id: "ce", name: "Civil Engineering" },
  { id: "chem", name: "Chemical Engineering" },
];

// Mock data for years
const YEARS: Year[] = [
  { id: "1", name: "First Year" },
  { id: "2", name: "Second Year" },
  { id: "3", name: "Third Year" },
  { id: "4", name: "Fourth Year" },
];

// Mock users
const USERS: User[] = [
  { id: "user1", username: "john_doe", email: "john@example.com" },
  { id: "user2", username: "jane_smith", email: "jane@example.com" },
];

// Mock notes data
let NOTES: Note[] = [
  {
    id: "note1",
    title: "Data Structures and Algorithms",
    content: "This note covers fundamental data structures like arrays, linked lists, trees, and basic algorithms.",
    isPublic: true,
    createdAt: new Date(2023, 5, 15).toISOString(),
    updatedAt: new Date(2023, 5, 15).toISOString(),
    branch: "cs",
    year: "2",
    subject: "Data Structures",
    files: [
      {
        id: "file1",
        name: "data_structures.pdf",
        url: "/sample_files/data_structures.pdf",
        type: "application/pdf",
        size: 2500000,
      },
    ],
    authorId: "user1",
    likes: [],
  },
  {
    id: "note2",
    title: "Electric Circuits",
    content: "Comprehensive notes on electric circuit analysis, Kirchhoff's laws, and circuit theorems.",
    isPublic: true,
    createdAt: new Date(2023, 4, 10).toISOString(),
    updatedAt: new Date(2023, 4, 12).toISOString(),
    branch: "ee",
    year: "2",
    subject: "Electric Circuits",
    files: [],
    authorId: "user2",
    likes: [],
  },
  {
    id: "note3",
    title: "Thermodynamics Basics",
    content: "Introduction to thermodynamics, covering laws of thermodynamics and basic concepts.",
    isPublic: true,
    createdAt: new Date(2023, 3, 5).toISOString(),
    updatedAt: new Date(2023, 3, 5).toISOString(),
    branch: "me",
    year: "2",
    subject: "Thermodynamics",
    files: [
      {
        id: "file2",
        name: "thermo_notes.pdf",
        url: "/sample_files/thermo_notes.pdf",
        type: "application/pdf",
        size: 1800000,
      },
    ],
    authorId: "user1",
    likes: [],
  },
  {
    id: "note4",
    title: "Database Management Systems",
    content: "Notes on database design, normalization, SQL, and transaction management.",
    isPublic: false,
    createdAt: new Date(2023, 6, 20).toISOString(),
    updatedAt: new Date(2023, 6, 25).toISOString(),
    branch: "cs",
    year: "3",
    subject: "DBMS",
    files: [],
    authorId: "user1",
    likes: [],
  },
];

// Simulate local storage persistence
const initializeStorage = () => {
  if (!localStorage.getItem("noteverse_notes")) {
    localStorage.setItem("noteverse_notes", JSON.stringify(NOTES));
  } else {
    NOTES = JSON.parse(localStorage.getItem("noteverse_notes") || "[]");
  }
};

initializeStorage();

// Auth APIs
export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem("user");
  return userJson ? JSON.parse(userJson) : null;
};

export const login = async (email: string, password: string): Promise<User> => {
  try {
    const { data } = await api.post<{ _id: string; username: string; email: string; token: string }>("/users/login", { email, password });
    localStorage.setItem("token", data.token);
    const user: User = {
      id: data._id,
      username: data.username,
      email: data.email,
    };
    localStorage.setItem("user", JSON.stringify(user));
    return user;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Login failed");
  }
};

export const register = async (username: string, email: string, password: string): Promise<User> => {
  try {
    const { data } = await api.post<{ _id: string; username: string; email: string; token: string }>("/users/register", { username, email, password });
    localStorage.setItem("token", data.token);
    const user: User = {
      id: data._id,
      username: data.username,
      email: data.email,
    };
    localStorage.setItem("user", JSON.stringify(user));
    return user;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Registration failed");
  }
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// Notes APIs
export const getNotes = async (filter: Filter = {}): Promise<Note[]> => {
  try {
    const params = new URLSearchParams();
    if (filter.branch && filter.branch !== 'all') params.append('branch', filter.branch);
    if (filter.year && filter.year !== 'all') params.append('year', filter.year);
    if (filter.subject) params.append('subject', filter.subject);
    if (filter.search) params.append('search', filter.search);
    if (filter.author) params.append('author', filter.author);

    const { data } = await api.get<Note[]>(`/notes?${params.toString()}`);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch notes");
  }
};

export const getUserNotes = async (userId: string): Promise<Note[]> => {
  try {
    const { data } = await api.get<Note[]>(`/notes?author=${userId}`);
    // Format each note in the response to ensure consistent data structure
    return data.map(note => ({
      ...note,
      id: note._id || note.id,
      authorId: note.author?._id || note.author?.id || '',
      likes: (note.likes || []).map(like => 
        typeof like === 'string' ? like : like.id
      ),
      files: note.files?.map(file => ({
        ...file,
        url: file.url // Keep the relative URL as is
      })) || [],
      isPublic: note.isPublic ?? true, // Ensure isPublic is always defined
      author: note.author || null, // Ensure author is included
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: note.updatedAt || new Date().toISOString(),
    }));
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch user notes");
  }
};

export const getNoteById = async (noteId: string): Promise<Note> => {
  try {
    const { data } = await api.get<Note>(`/notes/${noteId}`);
    // Format the response to ensure consistent data structure
    return {
      id: data._id || data.id,
      title: data.title,
      content: data.content,
      isPublic: data.isPublic,
      branch: data.branch,
      year: data.year,
      subject: data.subject,
      files: data.files || [],
      authorId: data.author?._id || data.authorId,
      likes: Array.isArray(data.likes) ? data.likes.map(like => 
        typeof like === 'string' ? like : like._id || like.id
      ) : [],
      author: data.author ? {
        id: data.author._id || data.author.id,
        username: data.author.username,
        email: data.author.email
      } : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch note");
  }
};

export const createNote = async (noteData: Partial<Note>): Promise<Note> => {
  try {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Please log in to create a note");
    }

    // Format files to match backend schema
    const formattedFiles = noteData.files?.map(file => ({
      name: file.name,
      url: file.url, // Keep the relative URL as is
      type: file.type,
      size: file.size
    })) || [];

    console.log('Creating note with data:', {
      title: noteData.title,
      content: noteData.content,
      isPublic: noteData.isPublic ?? true,
      branch: noteData.branch,
      year: noteData.year,
      subject: noteData.subject,
      files: formattedFiles,
    });

    const { data } = await api.post<Note>("/notes", {
      title: noteData.title,
      content: noteData.content,
      isPublic: noteData.isPublic ?? true,
      branch: noteData.branch,
      year: noteData.year,
      subject: noteData.subject,
      files: formattedFiles,
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Note created successfully:', data);

    // Return the note with properly formatted data
    return {
      ...data,
      id: data._id || data.id,
      authorId: data.author?._id || data.author?.id || '',
      files: data.files?.map(file => ({
        ...file,
        url: file.url // Keep the relative URL as is
      })) || [],
    };
  } catch (error: any) {
    console.error('Error creating note:', error);
    if (error.response?.data?.errors) {
      // Handle validation errors
      const errorMessages = error.response.data.errors.map((err: any) => err.message).join(', ');
      throw new Error(errorMessages);
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(error.message || "Failed to create note");
  }
};

export const updateNote = async (noteId: string, noteData: Partial<Note>): Promise<Note> => {
  try {
    const { data } = await api.put<Note>(`/notes/${noteId}`, noteData);
    // Ensure likes is always an array and handle both string IDs and User objects
    data.likes = (data.likes || []).map(like => 
      typeof like === 'string' ? like : like.id
    );
    return {
      ...data,
      id: data._id || data.id,
      authorId: data.author?._id || data.author?.id || '',
      files: data.files?.map(file => ({
        ...file,
        url: file.url // Keep the relative URL as is
      })) || [],
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update note");
  }
};

export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    await api.delete(`/notes/${noteId}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to delete note");
  }
};

// New API to toggle like on a note
export const toggleLikeNote = async (noteId: string): Promise<Note> => {
  try {
    const { data } = await api.post<Note>(`/notes/${noteId}/like`);
    // Ensure likes is always an array and handle both string IDs and User objects
    const likes = (data.likes || []).map(like => 
      typeof like === 'string' ? like : like.id
    );
    return {
      ...data,
      id: data._id || data.id,
      authorId: data.author?._id || data.author?.id || '',
      likes,
      files: data.files?.map(file => ({
        ...file,
        url: file.url // Keep the relative URL as is
      })) || [],
      isPublic: data.isPublic ?? true,
      author: data.author || null,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to like note");
  }
};

// New API to toggle note privacy
export const toggleNotePrivacy = async (noteId: string): Promise<Note> => {
  try {
    const { data } = await api.post<Note>(`/notes/${noteId}/privacy`);
    // Format the response to ensure consistent data structure
    return {
      id: data._id || data.id,
      title: data.title,
      content: data.content,
      isPublic: data.isPublic,
      branch: data.branch,
      year: data.year,
      subject: data.subject,
      files: data.files || [],
      authorId: data.author?._id || data.authorId,
      likes: Array.isArray(data.likes) ? data.likes.map(like => 
        typeof like === 'string' ? like : like._id || like.id
      ) : [],
      author: data.author ? {
        id: data.author._id || data.author.id,
        username: data.author.username,
        email: data.author.email
      } : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to toggle note privacy");
  }
};

// New API to get user profile info with their notes
export const getUserProfile = (userId: string): Promise<{user: User, notes: Note[]}> => {
  return new Promise((resolve, reject) => {
    const user = USERS.find(u => u.id === userId);
    
    if (!user) {
      return reject(new Error("User not found"));
    }
    
    getNotes({ author: userId }).then(notes => {
      resolve({ user, notes });
    });
  });
};

// Metadata APIs
export const getBranches = (): Promise<Branch[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(BRANCHES);
    }, 300);
  });
};

export const getYears = (): Promise<Year[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(YEARS);
    }, 300);
  });
};

// File APIs - In a real app, this would handle file uploads to a server
export const uploadFile = async (file: File, onProgress?: (progress: number) => void): Promise<NoteFile> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    console.log('Uploading file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    const { data } = await api.post<{
      id: string;
      name: string;
      url: string;
      type: string;
      size: number;
    }>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(progress);
        }
      },
    } as any);

    console.log('File upload response:', data);

    // Return the file data with the correct URL format
    return {
      id: data.id,
      name: data.name,
      url: data.url, // Keep the relative URL as is
      type: data.type,
      size: data.size,
    };
  } catch (error: any) {
    console.error('File upload error:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Failed to upload file');
  }
};

export const deleteFile = async (filename: string): Promise<void> => {
  const response = await fetch(`${API_URL}/files/${filename}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete file');
  }
};
