import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface INote extends Document {
  title: string;
  content: string;
  isPublic: boolean;
  branch: 'cs' | 'it' | 'ee' | 'ece' | 'ete' | 'me' | 'prod' | 'textile' | 'ce' | 'chem';
  year: '1' | '2' | '3' | '4';
  subject: string;
  files: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  author: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    enum: {
      values: ['cs', 'it', 'ee', 'ece', 'ete', 'me', 'prod', 'textile', 'ce', 'chem'],
      message: '{VALUE} is not a valid branch',
    },
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    enum: {
      values: ['1', '2', '3', '4'],
      message: '{VALUE} is not a valid year',
    },
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  files: [{
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  }],
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// Update the updatedAt timestamp before saving
noteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Note = mongoose.model<INote>('Note', noteSchema); 