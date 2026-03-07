import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatList, setChatList] = useState([]);

  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Load chats on mount (if logged in)
  useEffect(() => {
    if (token) {
      loadChats();
    }
  }, [token]);

  // Load chat list
  const loadChats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/chats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setChatList(response.data.chats);
      
      // Load first chat if exists and no current chat
      if (response.data.chats.length > 0 && !currentChatId) {
        loadChat(response.data.chats[0]._id);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  // Load specific chat
  const loadChat = async (chatId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/chats/${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessages(response.data.chat.messages);
      setCurrentChatId(chatId);
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  // Delete chat
const deleteChat = async (chatId, e) => {
  e.stopPropagation(); // Prevent chat selection when clicking delete
  
  if (!window.confirm('Are you sure you want to delete this chat?')) {
    return;
  }

  try {
    await axios.delete(`http://localhost:5000/api/chats/${chatId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // If deleted chat was current, clear it
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
    }
    
    // Reload chat list
    await loadChats();
  } catch (error) {
    console.error('Failed to delete chat:', error);
    alert('Failed to delete chat');
  }
};

// Create new chat
const createNewChat = async () => {
  if (!token) {
    // Guest mode - just clear messages
    setMessages([]);
    setCurrentChatId(null);
    return;
  }

  // If current chat is already empty, don't create new one
  if (currentChatId && messages.length === 0) {
    console.log('Current chat is already empty, not creating new one');
    return;
  }

  try {
    const response = await axios.post(
      'http://localhost:5000/api/chats',
      { title: 'New Chat' },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const newChatId = response.data.chat._id;
    setCurrentChatId(newChatId);
    setMessages([]); // Clear messages for new chat
    await loadChats(); // Reload chat list
  } catch (error) {
    console.error('Failed to create chat:', error);
  }
};

  // Helper to save message with specific chatId
  const saveMessageToChat = async (chatId, role, content) => {
    if (!token || !chatId) return;

    try {
      await axios.post(
        `http://localhost:5000/api/chats/${chatId}/messages`,
        { role, content },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Reload chat list after saving to update title
      await loadChats();
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const queryText = input;
    setInput('');

    // If logged in and no current chat, create one FIRST
    if (token && !currentChatId) {
      try {
        const response = await axios.post(
          'http://localhost:5000/api/chats',
          { title: 'New Chat' },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const newChatId = response.data.chat._id;
        setCurrentChatId(newChatId);
        
        // Add user message to UI
        const userMessage = { role: 'user', content: queryText };
        setMessages([userMessage]);
        
        // Save user message to DB
        await saveMessageToChat(newChatId, 'user', queryText);
        
        // Get AI response
        setLoading(true);
        try {
          const aiResponse = await axios.post(
            'http://localhost:5000/api/search', 
            { query: queryText },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          
          const aiMessage = { role: 'assistant', content: aiResponse.data.result };
          setMessages(prev => [...prev, aiMessage]);
          
          // Save AI response to DB
          await saveMessageToChat(newChatId, 'assistant', aiResponse.data.result);
        } catch (error) {
          const errorMessage = { role: 'assistant', content: 'Sorry, something went wrong.' };
          setMessages(prev => [...prev, errorMessage]);
        }
        setLoading(false);
        return;
      } catch (error) {
        console.error('Failed to create chat:', error);
        return;
      }
    }

    // Existing chat - normal flow
    const userMessage = { role: 'user', content: queryText };
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to DB (if logged in)
    if (token && currentChatId) {
      await saveMessageToChat(currentChatId, 'user', queryText);
    }

    setLoading(true);

    try {
      const config = token ? {
        headers: { 'Authorization': `Bearer ${token}` }
      } : {};
      
      const response = await axios.post(
        'http://localhost:5000/api/search', 
        { query: queryText },
        config
      );
      
      const aiMessage = { role: 'assistant', content: response.data.result };
      setMessages(prev => [...prev, aiMessage]);
      
      // Save AI response to DB (if logged in)
      if (token && currentChatId) {
        await saveMessageToChat(currentChatId, 'assistant', response.data.result);
      }
    } catch (error) {
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, something went wrong.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleLogout = () => {
    logout();
    setMessages([]);
    setCurrentChatId(null);
    setChatList([]);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className={`App ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>AI Chat</h2>
          {user && <p className="user-email">{user.email}</p>}
        </div>
        
        <button className="new-chat-btn" onClick={createNewChat}>
          + New Chat
        </button>

        {/* Chat History (only for logged-in users) */}
        {token && chatList.length > 0 && (
          <div className="chat-history">
            <h3>Chat History</h3>
            {chatList.map(chat => (
              <div 
                key={chat._id}
                className={`chat-item ${currentChatId === chat._id ? 'active' : ''}`}
              >
                <div 
                  className="chat-item-content"
                  onClick={() => loadChat(chat._id)}
                >
                  {chat.title}
                </div>
                <button 
                  className="delete-chat-btn"
                  onClick={(e) => deleteChat(chat._id, e)}
                  title="Delete chat"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          
          {user ? (
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          ) : (
            <button className="login-btn" onClick={handleLogin}>
              🔐 Login
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="main-content">
        <div className="chat-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <h1>How can I help you today?</h1>
              {!user && (
                <p className="guest-notice">
                  You're chatting as a guest. <span onClick={handleLogin} className="login-link">Login</span> to save your chat history.
                </p>
              )}
              <div className="suggestions">
                <div className="suggestion-card" onClick={() => setInput('What is artificial intelligence?')}>
                  Explain AI
                </div>
                <div className="suggestion-card" onClick={() => setInput('Write a poem about nature')}>
                  Write a poem
                </div>
                <div className="suggestion-card" onClick={() => setInput('Explain quantum computing')}>
                  Quantum computing
                </div>
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    <p>{msg.content}</p>
                    {msg.role === 'assistant' && (
                      <button 
                        className="copy-btn"
                        onClick={() => copyToClipboard(msg.content)}
                      >
                        📋 Copy
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="input-container">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message AI..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              ➤
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chat;