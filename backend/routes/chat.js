import express from "express";
import Chat from "../models/Chat.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Get all chats for logged-in user
router.get("/chats", authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.userId })
      .sort({ updatedAt: -1 })
      .select("title createdAt updatedAt");

    res.json({ chats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

// Get specific chat with messages
router.get("/chats/:chatId", authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.user.userId,
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({ chat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

// Create new chat
router.post("/chats", authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;

    const chat = new Chat({
      userId: req.user.userId,
      title: title || "New Chat",
      messages: [],
    });

    await chat.save();
    res.status(201).json({ chat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create chat" });
  }
});

// Add message to chat
router.post("/chats/:chatId/messages", authMiddleware, async (req, res) => {
  try {
    const { role, content } = req.body;

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.user.userId,
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    chat.messages.push({ role, content });
    chat.updatedAt = Date.now();

    // Auto-generate title from FIRST USER message only
    if (
      role === "user" &&
      chat.messages.filter((m) => m.role === "user").length === 1
    ) {
      // Take first 50 characters of first message as title
      chat.title =
        content.length > 50 ? content.substring(0, 50) + "..." : content;
    }

    await chat.save();

    res.json({ chat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add message" });
  }
});

// Delete chat
router.delete("/chats/:chatId", authMiddleware, async (req, res) => {
  try {
    await Chat.findOneAndDelete({
      _id: req.params.chatId,
      userId: req.user.userId,
    });

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete chat" });
  }
});

// Add message to chat
router.post("/chats/:chatId/messages", authMiddleware, async (req, res) => {
  try {
    const { role, content } = req.body;

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.user.userId,
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    chat.messages.push({ role, content });
    chat.updatedAt = Date.now();

    // Auto-generate title from first user message
    if (chat.messages.length === 1 && role === "user") {
      // Take first 50 characters of first message as title
      chat.title =
        content.length > 50 ? content.substring(0, 50) + "..." : content;
    }

    await chat.save();

    res.json({ chat });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add message" });
  }
});

export default router;
