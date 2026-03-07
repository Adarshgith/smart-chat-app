import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    // Token header se nikalna
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Token verify karna
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // User info request mein add kar do
    next(); // Aage jane do
    
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export default authMiddleware;