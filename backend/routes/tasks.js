import express from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create a task (Admin ONLY)
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, dueDate, priority, projectId, assignedTo } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    // Enforce RBAC: Only admin can create tasks
    if (project.admin.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only project admins can create tasks' });
    }

    const task = new Task({ title, description, dueDate, priority, project: projectId, assignedTo });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get all tasks for a specific project (Admin and Members)
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Ensure the user is a member of the project before showing tasks
    if (!project.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Update a task's status
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id).populate('project');

    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isProjectAdmin = task.project.admin.toString() === req.user.id;
    const isAssignedUser = task.assignedTo && task.assignedTo.toString() === req.user.id;

    // Enforce RBAC: Only the admin or the specifically assigned user can update the task
    if (!isProjectAdmin && !isAssignedUser) {
       return res.status(403).json({ error: 'Not authorized to update this task. You must be the Admin or the Assigned Member.' });
    }

    task.status = status;
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

export default router;