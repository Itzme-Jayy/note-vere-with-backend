
export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  branch: string;
  year: string;
  subject: string;
  files: NoteFile[];
  authorId: string;
  author?: User;
  likes: string[]; // Array of user IDs who liked the note
}

export interface NoteFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Branch {
  id: string;
  name: string;
}

export interface Year {
  id: string;
  name: string;
}

export interface Filter {
  branch?: string;
  year?: string;
  subject?: string;
  search?: string;
  author?: string;
}
