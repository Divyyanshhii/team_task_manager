import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

// 1. ALL IMPORTS MUST BE AT THE VERY TOP
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import userRoutes from './routes/users.js'; // <-- NEW USERS ROUTE

dotenv.config();
const app = express();

// 2. CORS Middleware (Must be first!)
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'https://teamtaskmanager-production-ef64.up.railway.app'
    ],
    credentials: true
}));

// 3. JSON Parsing Middleware
app.use(express.json());

// 4. Health Check Route (Crucial for Debugging)
app.get('/', (req, res) => {
    res.send('Task Manager API is running perfectly!');
});

// 5. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes); 
app.use('/api/users', userRoutes); // <-- NEW USERS ROUTE ENABLED

// 6. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// 7. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));