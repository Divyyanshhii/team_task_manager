import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/auth.js';

dotenv.config();
const app = express();

// Middleware
// Make sure this is placed BEFORE your routes!
app.use(cors({
    origin: [
        'http://localhost:5173', // Allows local testing
        'https://teamtaskmanager-production-ef64.up.railway.app' // Allows your live Railway frontend
    ],
    credentials: true
}));
app.use(express.json());
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';

app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));