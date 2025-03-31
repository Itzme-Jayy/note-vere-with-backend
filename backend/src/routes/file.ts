import express from 'express';
import { uploadFile, deleteFile, downloadFile } from '../controllers/fileController';
import { uploadMiddleware } from '../middleware/upload';

const router = express.Router();

// File upload route
router.post('/upload', uploadMiddleware, uploadFile);

// File download route
router.get('/download/:filename', downloadFile);

// File deletion route
router.delete('/:filename', deleteFile);

export default router; 