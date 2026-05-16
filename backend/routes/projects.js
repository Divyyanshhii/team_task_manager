import express from 'express';
import Project from '../models/Project.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create a new project (Creator becomes Admin)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    // The creator is automatically added as the admin and a member
    const project = new Project({ 
      name, 
      description, 
      admin: req.user.id, 
      members: [req.user.id] 
    });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get all projects where the user is an admin or a member
router.get('/', authenticate, async (req, res) => {
  try {
    const projects = await Project.find({ members: req.user.id })
      .populate('admin', 'name email')
      .populate('members', 'name email');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Add a member to a project (Admin ONLY)
router.post('/:id/members', authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    // Check if the user making the request is the project admin
    if (project.admin.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only project admins can add members' });
    }

    // Add user if not already a member
    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();
    }
    
    res.json({ message: 'Member added successfully', project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member' });
  }
});

export default router;