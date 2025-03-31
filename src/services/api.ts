import { Note, User, Branch, Year, Filter, NoteFile } from "../types";

// Mock data for branches
const BRANCHES: Branch[] = [
  { id: "cs", name: "Computer Science" },
  { id: "ee", name: "Electrical Engineering" },
  { id: "me", name: "Mechanical Engineering" },
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
  
  if (!localStorage.getItem("noteverse_currentUser")) {
    localStorage.setItem("noteverse_currentUser", JSON.stringify(USERS[0]));
  }
};

initializeStorage();

// Auth APIs
export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem("noteverse_currentUser");
  return userJson ? JSON.parse(userJson) : null;
};

export const login = (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    // In a real app, you would make an API call to verify credentials
    // For this demo, we'll just find a user with the matching email
    const user = USERS.find((u) => u.email === email);
    
    setTimeout(() => {
      if (user && password === "password") { // Simple password check for demo
        localStorage.setItem("noteverse_currentUser", JSON.stringify(user));
        resolve(user);
      } else {
        reject(new Error("Invalid email or password"));
      }
    }, 500);
  });
};

export const register = (username: string, email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    // In a real app, you would make an API call to create a new user
    // For this demo, we'll just create a new user object
    
    // Check if email is already in use
    const existingUser = USERS.find((u) => u.email === email);
    if (existingUser) {
      return reject(new Error("Email already in use"));
    }
    
    const newUser: User = {
      id: `user${USERS.length + 1}`,
      username,
      email,
    };
    
    USERS.push(newUser);
    localStorage.setItem("noteverse_currentUser", JSON.stringify(newUser));
    
    setTimeout(() => {
      resolve(newUser);
    }, 500);
  });
};

export const logout = (): Promise<void> => {
  return new Promise((resolve) => {
    localStorage.removeItem("noteverse_currentUser");
    setTimeout(resolve, 300);
  });
};

// Notes APIs
export const getNotes = (filter: Filter = {}): Promise<Note[]> => {
  return new Promise((resolve) => {
    let filteredNotes = [...NOTES];
    
    // Apply filters
    if (filter.branch && filter.branch !== 'all') {
      filteredNotes = filteredNotes.filter((note) => note.branch === filter.branch);
    }
    
    if (filter.year && filter.year !== 'all') {
      filteredNotes = filteredNotes.filter((note) => note.year === filter.year);
    }
    
    if (filter.subject) {
      filteredNotes = filteredNotes.filter((note) => 
        note.subject.toLowerCase().includes(filter.subject!.toLowerCase())
      );
    }
    
    if (filter.search) {
      filteredNotes = filteredNotes.filter((note) => 
        note.title.toLowerCase().includes(filter.search!.toLowerCase()) ||
        note.content.toLowerCase().includes(filter.search!.toLowerCase())
      );
    }
    
    if (filter.author) {
      filteredNotes = filteredNotes.filter((note) => note.authorId === filter.author);
    }
    
    // Add author info
    filteredNotes = filteredNotes.map((note) => ({
      ...note,
      author: USERS.find((user) => user.id === note.authorId),
    }));
    
    // Filter out private notes that don't belong to the current user
    const currentUser = getCurrentUser();
    if (currentUser) {
      filteredNotes = filteredNotes.filter((note) => 
        note.isPublic || note.authorId === currentUser.id
      );
    } else {
      filteredNotes = filteredNotes.filter((note) => note.isPublic);
    }
    
    setTimeout(() => {
      resolve(filteredNotes);
    }, 500);
  });
};

export const getUserNotes = (userId: string): Promise<Note[]> => {
  return new Promise((resolve) => {
    const userNotes = NOTES.filter((note) => note.authorId === userId);
    
    setTimeout(() => {
      resolve(userNotes);
    }, 500);
  });
};

export const getNoteById = (noteId: string): Promise<Note | null> => {
  return new Promise((resolve) => {
    const note = NOTES.find((n) => n.id === noteId);
    
    if (note) {
      const noteWithAuthor = {
        ...note,
        author: USERS.find((user) => user.id === note.authorId),
      };
      
      setTimeout(() => {
        resolve(noteWithAuthor);
      }, 300);
    } else {
      setTimeout(() => {
        resolve(null);
      }, 300);
    }
  });
};

export const createNote = (noteData: Omit<Note, "id" | "createdAt" | "updatedAt" | "authorId" | "likes">): Promise<Note> => {
  return new Promise((resolve, reject) => {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      return reject(new Error("You must be logged in to create a note"));
    }
    
    const newNote: Note = {
      ...noteData,
      id: `note${NOTES.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorId: currentUser.id,
      likes: [],
    };
    
    NOTES.push(newNote);
    localStorage.setItem("noteverse_notes", JSON.stringify(NOTES));
    
    setTimeout(() => {
      resolve(newNote);
    }, 500);
  });
};

export const updateNote = (noteId: string, noteData: Partial<Omit<Note, "id" | "createdAt" | "authorId" | "likes">>): Promise<Note> => {
  return new Promise((resolve, reject) => {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      return reject(new Error("You must be logged in to update a note"));
    }
    
    const noteIndex = NOTES.findIndex((n) => n.id === noteId);
    
    if (noteIndex === -1) {
      return reject(new Error("Note not found"));
    }
    
    const note = NOTES[noteIndex];
    
    if (note.authorId !== currentUser.id) {
      return reject(new Error("You don't have permission to update this note"));
    }
    
    const updatedNote: Note = {
      ...note,
      ...noteData,
      updatedAt: new Date().toISOString(),
    };
    
    NOTES[noteIndex] = updatedNote;
    localStorage.setItem("noteverse_notes", JSON.stringify(NOTES));
    
    setTimeout(() => {
      resolve(updatedNote);
    }, 500);
  });
};

export const deleteNote = (noteId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      return reject(new Error("You must be logged in to delete a note"));
    }
    
    const noteIndex = NOTES.findIndex((n) => n.id === noteId);
    
    if (noteIndex === -1) {
      return reject(new Error("Note not found"));
    }
    
    const note = NOTES[noteIndex];
    
    if (note.authorId !== currentUser.id) {
      return reject(new Error("You don't have permission to delete this note"));
    }
    
    NOTES.splice(noteIndex, 1);
    localStorage.setItem("noteverse_notes", JSON.stringify(NOTES));
    
    setTimeout(resolve, 500);
  });
};

// New API to toggle like on a note
export const toggleLikeNote = (noteId: string): Promise<Note> => {
  return new Promise((resolve, reject) => {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      return reject(new Error("You must be logged in to like a note"));
    }
    
    const noteIndex = NOTES.findIndex((n) => n.id === noteId);
    
    if (noteIndex === -1) {
      return reject(new Error("Note not found"));
    }
    
    const note = NOTES[noteIndex];
    
    // Ensure note.likes is always an array
    if (!note.likes) {
      note.likes = [];
    }
    
    const userLiked = note.likes.includes(currentUser.id);
    
    let updatedLikes;
    if (userLiked) {
      // Unlike the note
      updatedLikes = note.likes.filter(id => id !== currentUser.id);
    } else {
      // Like the note
      updatedLikes = [...note.likes, currentUser.id];
    }
    
    const updatedNote: Note = {
      ...note,
      likes: updatedLikes,
    };
    
    NOTES[noteIndex] = updatedNote;
    localStorage.setItem("noteverse_notes", JSON.stringify(NOTES));
    
    setTimeout(() => {
      resolve(updatedNote);
    }, 500);
  });
};

// New API to toggle note privacy
export const toggleNotePrivacy = (noteId: string): Promise<Note> => {
  return new Promise((resolve, reject) => {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      return reject(new Error("You must be logged in to change privacy settings"));
    }
    
    const noteIndex = NOTES.findIndex((n) => n.id === noteId);
    
    if (noteIndex === -1) {
      return reject(new Error("Note not found"));
    }
    
    const note = NOTES[noteIndex];
    
    if (note.authorId !== currentUser.id) {
      return reject(new Error("You don't have permission to update this note's privacy"));
    }
    
    const updatedNote: Note = {
      ...note,
      isPublic: !note.isPublic,
      updatedAt: new Date().toISOString(),
    };
    
    NOTES[noteIndex] = updatedNote;
    localStorage.setItem("noteverse_notes", JSON.stringify(NOTES));
    
    setTimeout(() => {
      resolve(updatedNote);
    }, 500);
  });
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
export const uploadFile = (file: File): Promise<NoteFile> => {
  return new Promise((resolve) => {
    // Simulate file upload
    const reader = new FileReader();
    
    reader.onload = () => {
      const newFile: NoteFile = {
        id: `file${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        url: URL.createObjectURL(file), // In a real app, this would be a server URL
        type: file.type,
        size: file.size,
      };
      
      setTimeout(() => {
        resolve(newFile);
      }, 1000);
    };
    
    reader.readAsDataURL(file);
  });
};
