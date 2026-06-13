import Folder from '../models/Folder.js';
import Document from '../models/Document.js';

// @desc    Get all folders for logged-in user
// @route   GET /api/folders
// @access  Private
export const getFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ user: req.user.id }).sort({ createdAt: 1 });
    res.status(200).json(folders);
  } catch (error) {
    console.error('[getFolders]', error);
    res.status(500).json({ message: 'Server error retrieving folders.' });
  }
};

// @desc    Create a folder
// @route   POST /api/folders
// @access  Private
export const createFolder = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Folder name is required.' });
    }

    const trimmedName = name.trim();

    // Check duplicate
    const existing = await Folder.findOne({ name: trimmedName, user: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'A folder with this name already exists.' });
    }

    const folder = await Folder.create({
      name: trimmedName,
      user: req.user.id,
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error('[createFolder]', error);
    res.status(500).json({ message: 'Server error creating folder.' });
  }
};

// @desc    Rename a folder
// @route   PUT /api/folders/:id
// @access  Private
export const renameFolder = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Folder name is required.' });
    }

    const trimmedName = name.trim();

    const folder = await Folder.findOne({ _id: id, user: req.user.id });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found or unauthorized.' });
    }

    // Check duplicate name
    const existing = await Folder.findOne({ name: trimmedName, user: req.user.id });
    if (existing && existing._id.toString() !== id) {
      return res.status(400).json({ message: 'A folder with this name already exists.' });
    }

    folder.name = trimmedName;
    await folder.save();

    res.status(200).json(folder);
  } catch (error) {
    console.error('[renameFolder]', error);
    res.status(500).json({ message: 'Server error renaming folder.' });
  }
};

// @desc    Delete a folder
// @route   DELETE /api/folders/:id
// @access  Private
export const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await Folder.findOne({ _id: id, user: req.user.id });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found or unauthorized.' });
    }

    await Folder.deleteOne({ _id: id });

    // Set any documents inside this folder to loose (folder: null) so they persist in "All Documents"
    await Document.updateMany(
      { folder: id, user: req.user.id },
      { $set: { folder: null } }
    );

    res.status(200).json({ message: 'Folder deleted successfully.' });
  } catch (error) {
    console.error('[deleteFolder]', error);
    res.status(500).json({ message: 'Server error deleting folder.' });
  }
};
