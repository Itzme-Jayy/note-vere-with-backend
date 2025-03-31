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
    if (filter.subject && filter.subject !== 'all') params.append('subject', filter.subject);
    if (filter.search) params.append('search', filter.search);
    if (filter.author) params.append('author', filter.author);

    const { data } = await api.get<Note[]>(`/notes?${params.toString()}`);
    // Format each note in the response to ensure consistent data structure
    return data.map(note => ({
      ...note,
      id: note._id || note.id,
      authorId: note.author?._id || note.authorId,
      likes: Array.isArray(note.likes) ? note.likes.map(like =>
        typeof like === 'string' ? like : like._id || like.id
      ) : [],
      files: note.files || [],
      isPublic: note.isPublic,
      author: note.author ? {
        id: note.author._id || note.author.id,
        username: note.author.username,
        email: note.author.email
      } : undefined,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    }));
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch notes");
  }
};

export const getUserNotes = async (userId: string): Promise<Note[]> => {
  try {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Please log in to view your notes");
    }

    // Get the current user's ID
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Only allow users to view their own notes
    if (currentUser.id !== userId) {
      throw new Error("Not authorized to view these notes");
    }

    console.log('Fetching notes for user:', userId);
    console.log('Current user:', currentUser);
    console.log('Auth token present:', !!token);

    const { data } = await api.get<Note[]>(`/notes?author=${userId}`);
    console.log('Received notes data:', data);

    if (!Array.isArray(data)) {
      console.error('Received invalid data format:', data);
      throw new Error('Invalid response format from server');
    }

    // Format each note in the response to ensure consistent data structure
    return data.map(note => {
      try {
        return {
          ...note,
          id: note._id || note.id,
          authorId: note.author?._id || note.authorId,
          likes: Array.isArray(note.likes) ? note.likes.map(like =>
            typeof like === 'string' ? like : like._id || like.id
          ) : [],
          files: note.files || [],
          isPublic: note.isPublic,
          author: note.author ? {
            id: note.author._id || note.author.id,
            username: note.author.username,
            email: note.author.email
          } : undefined,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt
        };
      } catch (error) {
        console.error('Error formatting note:', error);
        console.error('Problematic note:', note);
        throw error;
      }
    });
  } catch (error: any) {
    console.error('Error fetching user notes:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });

    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || "Failed to fetch user notes");
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

    // Get current user
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Format files to match backend schema
    const formattedFiles = noteData.files?.map(file => ({
      name: file.name,
      url: file.url,
      type: file.type,
      size: file.size
    })) || [];

    const notePayload = {
      title: noteData.title,
      content: noteData.content,
      isPublic: noteData.isPublic !== undefined ? noteData.isPublic : true,
      branch: noteData.branch,
      year: noteData.year,
      subject: noteData.subject,
      files: formattedFiles,
      author: currentUser.id
    };

    console.log('Creating note with data:', notePayload);

    const { data } = await api.post<Note>("/notes", notePayload, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Note created successfully:', data);

    // Return the note with properly formatted data
    const formattedNote = {
      ...data,
      id: data._id || data.id,
      authorId: data.author?._id || data.author?.id || currentUser.id,
      files: data.files?.map(file => ({
        ...file,
        url: file.url
      })) || [],
    };

    console.log('Formatted note for response:', formattedNote);
    return formattedNote;
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
export const toggleLike = async (noteId: string): Promise<Note> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.post<{ note: Note }>(
      `${API_URL}/notes/${noteId}/like`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.note;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
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
export const getUserProfile = async (userId: string): Promise<{ user: User, notes: Note[] }> => {
  try {
    const [userData, notesData] = await Promise.all([
      api.get<User>(`/users/${userId}`),
      api.get<Note[]>(`/notes?author=${userId}`)
    ]);

    return {
      user: userData.data,
      notes: notesData.data.map(note => ({
        ...note,
        id: note._id || note.id,
        authorId: note.author?._id || note.authorId,
        likes: Array.isArray(note.likes) ? note.likes.map(like =>
          typeof like === 'string' ? like : like._id || like.id
        ) : [],
        files: note.files || [],
        isPublic: note.isPublic,
        author: note.author ? {
          id: note.author._id || note.author.id,
          username: note.author.username,
          email: note.author.email
        } : undefined,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      }))
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch user profile");
  }
};

// Metadata APIs
export const getBranches = async (): Promise<Branch[]> => {
  try {
    const { data } = await api.get<Branch[]>('/branches');
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch branches");
  }
};

export const getYears = async (): Promise<Year[]> => {
  try {
    const { data } = await api.get<Year[]>('/years');
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch years");
  }
};

export const getUserById = async (userId: string): Promise<User> => {
  try {
    const { data } = await api.get<User>(`/users/${userId}`);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch user");
  }
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
