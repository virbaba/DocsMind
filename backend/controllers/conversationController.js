import Conversation from '../models/Conversation.js';

// @desc    Get all conversation titles for logged-in user
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.user.id })
      .select('title updatedAt messages')
      .sort({ updatedAt: -1 });

    const mapped = conversations.map((c) => ({
      id: c._id,
      title: c.title,
      updatedAt: c.updatedAt,
      messageCount: c.messages.length,
    }));

    res.status(200).json(mapped);
  } catch (error) {
    console.error('[getConversations]', error);
    res.status(500).json({ message: 'Server error retrieving conversations.' });
  }
};

// @desc    Get a single conversation by ID with all messages
// @route   GET /api/conversations/:id
// @access  Private
export const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findOne({ _id: id, user: req.user.id });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or unauthorized.' });
    }
    res.status(200).json(conversation);
  } catch (error) {
    console.error('[getConversationById]', error);
    res.status(500).json({ message: 'Server error retrieving conversation details.' });
  }
};

// @desc    Create a new conversation or update messages in an existing one
// @route   POST /api/conversations
// @access  Private
export const saveConversation = async (req, res) => {
  try {
    const { id, title, messages } = req.body;

    if (id) {
      // Update existing conversation
      const conversation = await Conversation.findOne({ _id: id, user: req.user.id });
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found or unauthorized.' });
      }
      
      if (title) {
        conversation.title = title.trim();
      }
      if (messages) {
        conversation.messages = messages;
      }
      await conversation.save();
      return res.status(200).json(conversation);
    } else {
      // Create new conversation
      if (!messages || messages.length === 0) {
        return res.status(400).json({ message: 'Cannot save an empty conversation.' });
      }

      let finalTitle = title ? title.trim() : 'New Chat';
      if (!title) {
        const firstUserMsg = messages.find((m) => m.sender === 'user');
        if (firstUserMsg) {
          finalTitle = firstUserMsg.text.substring(0, 30);
          if (firstUserMsg.text.length > 30) finalTitle += '...';
        }
      }

      const conversation = await Conversation.create({
        user: req.user.id,
        title: finalTitle,
        messages,
      });

      return res.status(201).json(conversation);
    }
  } catch (error) {
    console.error('[saveConversation]', error);
    res.status(500).json({ message: 'Server error saving conversation.' });
  }
};

// @desc    Delete a conversation
// @route   DELETE /api/conversations/:id
// @access  Private
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findOne({ _id: id, user: req.user.id });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found or unauthorized.' });
    }

    await Conversation.deleteOne({ _id: id });
    res.status(200).json({ message: 'Conversation deleted successfully.' });
  } catch (error) {
    console.error('[deleteConversation]', error);
    res.status(500).json({ message: 'Server error deleting conversation.' });
  }
};
