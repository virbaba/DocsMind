import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user cannot have two folders with the exact same name
folderSchema.index({ name: 1, user: 1 }, { unique: true });

const Folder = mongoose.model('Folder', folderSchema);
export default Folder;
