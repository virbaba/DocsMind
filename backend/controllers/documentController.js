import Document from '../models/Document.js';

// @desc    Get all documents for logged-in user
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(documents);
  } catch (error) {
    console.error('[getDocuments]', error);
    res.status(500).json({ message: 'Server error retrieving documents.' });
  }
};

// @desc    Create/Upload a document (metadata entry)
// @route   POST /api/documents
// @access  Private
export const createDocument = async (req, res) => {
  try {
    const { name, fullName, size, category, folderId, url } = req.body;

    if (!fullName) {
      return res.status(400).json({ message: 'Document full name is required.' });
    }

    // Set short name if not provided
    const extension = fullName.endsWith('.pdf') ? '.pdf' : '';
    const nameWithoutExt = fullName.replace('.pdf', '');
    const shortName = name || (nameWithoutExt.length > 12 
      ? nameWithoutExt.slice(0, 12) + '...' + extension 
      : fullName);

    const doc = await Document.create({
      name: shortName,
      fullName,
      size: size || '0.0 KB',
      category: category || 'General',
      folder: folderId || null, // null means it's loose / "All Documents" only
      user: req.user.id,
      url: url || '',
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error('[createDocument]', error);
    res.status(500).json({ message: 'Server error creating document.' });
  }
};

// @desc    Rename a document
// @route   PUT /api/documents/:id
// @access  Private
export const renameDocument = async (req, res) => {
  try {
    const { fullName } = req.body;
    const { id } = req.params;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'Document name is required.' });
    }

    const doc = await Document.findOne({ _id: id, user: req.user.id });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found or unauthorized.' });
    }

    const extension = fullName.endsWith('.pdf') ? '.pdf' : '';
    const nameWithoutExt = fullName.replace('.pdf', '');
    const shortName = nameWithoutExt.length > 12 
      ? nameWithoutExt.slice(0, 12) + '...' + extension 
      : fullName;

    doc.fullName = fullName.trim();
    doc.name = shortName;
    await doc.save();

    res.status(200).json(doc);
  } catch (error) {
    console.error('[renameDocument]', error);
    res.status(500).json({ message: 'Server error renaming document.' });
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await Document.findOne({ _id: id, user: req.user.id });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found or unauthorized.' });
    }

    await Document.deleteOne({ _id: id });

    res.status(200).json({ message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('[deleteDocument]', error);
    res.status(500).json({ message: 'Server error deleting document.' });
  }
};
