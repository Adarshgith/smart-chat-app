import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import jwt from 'jsonwebtoken';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Auth Routes
app.use('/api/auth', authRoutes);

// Chat Routes
app.use('/api', chatRoutes);

// Public Search endpoint (optional auth)
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Optional: Check if user is logged in (but don't block)
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let userId = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
        console.log('Logged in user:', userId);
      } catch (err) {
        console.log('Invalid token, continuing as guest');
      }
    } else {
      console.log('Guest user chatting');
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: query }],
      model: 'llama-3.3-70b-versatile',
    });

    const result = chatCompletion.choices[0]?.message?.content || '';

    res.json({ result: result });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});