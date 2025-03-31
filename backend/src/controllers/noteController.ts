import { Request, Response } from 'express';
import { Note } from '../models/Note';
import { z } from 'zod';
import { Types, Document } from 'mongoose';
import { INote } from '../models/Note';

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  isPublic: z.boolean().optional(),
  branch: z.enum(['cs', 'it', 'ee', 'ece', 'ete', 'me', 'prod', 'textile', 'ce', 'chem'], {
    errorMap: () => ({ message: 'Invalid branch' }),
  }),
  year: z.enum(['1', '2', '3', '4'], {
    errorMap: () => ({ message: 'Invalid year' }),
  }),
  subject: z.string().min(1, 'Subject is required'),
  files: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
    size: z.number(),
  })).optional().default([]),
});

interface PopulatedNote extends Omit<INote, 'author' | 'likes'> {
  author: {
    _id: Types.ObjectId;
    username: string;
    email: string;
  };
  likes: Array<{
    _id: Types.ObjectId;
    username: string;
    email: string;
  }>;
}

export const createNote = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    console.log('Received note data:', req.body);

    // Validate the request data
    const noteData = noteSchema.parse(req.body);
    console.log('Parsed note data:', noteData);

    // Create the note with the validated data
    const note = new Note({
      title: noteData.title,
      content: noteData.content,
      isPublic: noteData.isPublic ?? true,
      branch: noteData.branch,
      year: noteData.year,
      subject: noteData.subject,
      files: noteData.files || [],
      author: req.user._id,
    });

    // Save the note
    await note.save();

    console.log('Created note:', note);

    // Populate the author field before sending the response
    const populatedNote = await Note.findById(note._id)
      .populate('author', 'username email');

    console.log('Populated note:', populatedNote);

    res.status(201).json(populatedNote);
  } catch (error) {
    console.error('Error creating note:', error);
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors 
      });
    } else if (error instanceof Error) {
      console.error('Server error:', error.message);
      res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
    } else {
      console.error('Unknown error:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: 'Unknown error occurred'
      });
    }
  }
};

export const getNotes = async (req: Request, res: Response) => {
  try {
    const { branch, year, subject, search, author } = req.query;
    let query: any = {};

    console.log('Received query parameters:', { branch, year, subject, search, author });
    console.log('User context:', req.user ? { userId: req.user._id } : 'No user');

    // Apply filters
    if (branch && branch !== 'all') query.branch = branch;
    if (year && year !== 'all') query.year = year;
    
    // Handle subject search with case-insensitive regex
    if (subject && subject !== 'all') {
      query.subject = new RegExp(subject as string, 'i');
    }
    
    // Handle author filter with proper error handling
    if (author) {
      try {
        query.author = new Types.ObjectId(author as string);
        console.log('Author query set to:', query.author);
      } catch (error) {
        console.error('Invalid author ID:', author);
        return res.status(400).json({ 
          message: 'Invalid author ID format',
          error: 'The provided author ID is not in the correct format'
        });
      }
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { title: new RegExp(search as string, 'i') },
        { content: new RegExp(search as string, 'i') },
        { subject: new RegExp(search as string, 'i') }
      ];
    }

    // Filter notes based on visibility and user context
    if (!req.user) {
      // For non-authenticated users, only show public notes
      query.isPublic = true;
    } else if (author && req.user._id && author === req.user._id.toString()) {
      // When viewing user's own notes (My Notes page), show all notes
      // No visibility filter needed - show both public and private notes
      delete query.isPublic; // Remove any existing isPublic filter
    } else {
      // For authenticated users viewing other users' notes (Explore page)
      // Show only public notes
      query.isPublic = true;
    }

    console.log('Final query:', JSON.stringify(query, null, 2));

    // Add error handling for the database query
    let notes;
    try {
      notes = await Note.find(query)
        .populate('author', 'username email')
        .populate('likes', 'username email')
        .sort({ createdAt: -1 });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      throw dbError;
    }

    console.log('Found notes:', notes.length);

    // Format the response to ensure consistent data structure
    const formattedNotes = notes.map(note => {
      try {
        const populatedNote = note as unknown as PopulatedNote;
        return {
          ...note.toObject(),
          id: note._id,
          authorId: populatedNote.author._id,
          likes: populatedNote.likes.map(like => ({
            id: like._id,
            username: like.username,
            email: like.email
          })),
          files: note.files || [],
          isPublic: note.isPublic,
          author: {
            id: populatedNote.author._id,
            username: populatedNote.author.username,
            email: populatedNote.author.email
          },
          createdAt: note.createdAt,
          updatedAt: note.updatedAt
        };
      } catch (formatError) {
        console.error('Error formatting note:', formatError);
        console.error('Problematic note:', note);
        throw formatError;
      }
    });

    res.json(formattedNotes);
  } catch (error) {
    console.error('Error in getNotes:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

export const getNoteById = async (req: Request, res: Response) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('author', 'username email')
      .populate('likes', 'username email');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user has access to the note
    if (!note.isPublic && (!req.user || note.author._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this note' });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const noteData = noteSchema.parse(req.body);
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user owns the note
    if (note.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this note' });
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      noteData,
      { new: true }
    ).populate('author', 'username email');

    res.json(updatedNote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user owns the note
    if (note.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    await note.deleteOne();
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const toggleLike = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const likeIndex = note.likes.indexOf(req.user._id);
    if (likeIndex === -1) {
      note.likes.push(req.user._id);
    } else {
      note.likes.splice(likeIndex, 1);
    }

    await note.save();

    // Populate the note with author and likes information before sending the response
    const populatedNote = await Note.findById(note._id)
      .populate('author', 'username email')
      .populate('likes', 'username email') as PopulatedNote | null;

    if (!populatedNote) {
      return res.status(404).json({ message: 'Note not found after update' });
    }

    // Format the response to match the frontend's expected structure
    const formattedNote = {
      ...populatedNote.toObject(),
      id: populatedNote._id,
      authorId: populatedNote.author._id,
      likes: populatedNote.likes.map((like) => ({
        id: like._id,
        username: like.username,
        email: like.email
      })),
      files: populatedNote.files || [],
      isPublic: populatedNote.isPublic,
      author: {
        id: populatedNote.author._id,
        username: populatedNote.author.username,
        email: populatedNote.author.email
      },
      createdAt: populatedNote.createdAt,
      updatedAt: populatedNote.updatedAt
    };

    res.json(formattedNote);
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const togglePrivacy = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user owns the note - ensure consistent ID comparison
    const noteAuthorId = note.author.toString();
    const userId = req.user._id.toString();
    
    if (noteAuthorId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this note' });
    }

    // Toggle the privacy
    note.isPublic = !note.isPublic;
    await note.save();

    // Populate the note with author and likes information
    const updatedNote = await Note.findById(note._id)
      .populate('author', 'username email')
      .populate('likes', 'username email') as PopulatedNote | null;

    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found after update' });
    }

    // Format the response to ensure consistent data structure
    const formattedNote = {
      ...updatedNote.toObject(),
      id: updatedNote._id,
      authorId: updatedNote.author._id,
      likes: updatedNote.likes.map(like => ({
        id: like._id,
        username: like.username,
        email: like.email
      })),
      files: updatedNote.files || [],
      isPublic: updatedNote.isPublic,
      author: {
        id: updatedNote.author._id,
        username: updatedNote.author.username,
        email: updatedNote.author.email
      },
      createdAt: updatedNote.createdAt,
      updatedAt: updatedNote.updatedAt
    };

    res.json(formattedNote);
  } catch (error) {
    console.error('Error toggling privacy:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 