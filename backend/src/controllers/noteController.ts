import { Request, Response } from 'express';
import { Note } from '../models/Note';
import { z } from 'zod';

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

    // Apply filters
    if (branch && branch !== 'all') query.branch = branch;
    if (year && year !== 'all') query.year = year;
    if (subject) query.subject = new RegExp(subject as string, 'i');
    if (author) query.author = author;

    // Add search functionality
    if (search) {
      query.$or = [
        { title: new RegExp(search as string, 'i') },
        { content: new RegExp(search as string, 'i') },
      ];
    }

    // Filter notes based on visibility
    if (!req.user) {
      // For non-authenticated users, only show public notes
      query.isPublic = true;
    } else if (author && author === req.user._id.toString()) {
      // When viewing user's own notes (My Notes page), show all notes
      // No visibility filter needed
    } else {
      // For authenticated users viewing all notes (Explore page)
      // Show public notes and their own private notes
      query.$or = [
        { isPublic: true },
        { author: req.user._id }
      ];
    }

    const notes = await Note.find(query)
      .populate('author', 'username email')
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Server error' });
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
      .populate('likes', 'username email');

    res.json(populatedNote);
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

    // Check if user owns the note
    if (note.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this note' });
    }

    // Toggle the privacy
    note.isPublic = !note.isPublic;
    await note.save();

    // Populate the note with author and likes information
    const updatedNote = await Note.findById(note._id)
      .populate('author', 'username email')
      .populate('likes', 'username email');

    res.json(updatedNote);
  } catch (error) {
    console.error('Error toggling privacy:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 