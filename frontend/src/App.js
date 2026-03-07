import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './components/login';
import Signup from './components/signup';
import Chat from './components/chat';

// Public Route (redirect to chat if logged in)
function PublicRoute({ children }) {
  const { token } = useContext(AuthContext);
  return !token ? children : <Navigate to="/chat" />;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      
      <Route path="/signup" element={
        <PublicRoute>
          <Signup />
        </PublicRoute>
      } />
      
      {/* Chat is now PUBLIC - no protection */}
      <Route path="/chat" element={<Chat />} />
      <Route path="/" element={<Navigate to="/chat" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;