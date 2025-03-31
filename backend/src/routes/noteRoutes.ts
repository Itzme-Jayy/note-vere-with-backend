import express from 'express';
import { protect } from '../middleware/auth';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  toggleLike,
  togglePrivacy,
} from '../controllers/noteController';

const router = express.Router();

router.get('/', getNotes);
router.get('/:id', getNoteById);

// Protected routes
router.post('/', protect, createNote);
router.put('/:id', protect, updateNote);
router.delete('/:id', protect, deleteNote);
router.post('/:noteId/like', protect, toggleLike);
router.put('/:noteId/privacy', protect, togglePrivacy);

export default router; 