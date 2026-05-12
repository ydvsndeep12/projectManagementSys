const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { auth, adminOnly } = require('../middleware/auth');

const populateTask = async (doc) => {
  await doc.populate('assignedTo', 'name email');
  await doc.populate('project', 'name');
  await doc.populate('createdBy', 'name');
  return doc;
};

const syncProjectStatus = async (projectId) => {
  const tasks = await Task.find({ project: projectId });
  if (!tasks.length) return;
  const allDone = tasks.every((t) => t.status === 'done');
  const anyInProgress = tasks.some((t) => t.status === 'in-progress');
  const newStatus = allDone ? 'done' : anyInProgress ? 'in-progress' : 'todo';
  await Project.findByIdAndUpdate(projectId, { status: newStatus });
};

// GET /api/tasks?projectId=&assignedTo=
router.get('/', auth, async (req, res) => {
  try {
    const { projectId, assignedTo } = req.query;
    let query = {};

    if (projectId) {
      // Verify membership
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ message: 'Project not found' });

      const isMember =
        project.members.includes(req.user._id) ||
        project.owner.equals(req.user._id);

      if (!isMember) return res.status(403).json({ message: 'Access denied' });

      query.project = projectId;
    } else {
      // Tasks from all of the user's projects
      const projects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }],
      }).select('_id');
      query.project = { $in: projects.map((p) => p._id) };
    }

    if (assignedTo) query.assignedTo = assignedTo;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .populate('createdBy', 'name')
      .sort('-createdAt');

    res.json(tasks);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks  — admin only
router.post(
  '/',
  auth,
  adminOnly,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('project').notEmpty().withMessage('Project is required'),
    body('status')
      .optional()
      .isIn(['todo', 'in-progress', 'done'])
      .withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Invalid priority'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { title, description, project, assignedTo, status, priority, dueDate } =
        req.body;

      const projectDoc = await Project.findById(project);
      if (!projectDoc) return res.status(404).json({ message: 'Project not found' });

      if (!projectDoc.owner.equals(req.user._id)) {
        return res.status(403).json({ message: 'Only project owner can create tasks' });
      }

      const task = await Task.create({
        title,
        description,
        project,
        assignedTo: assignedTo || null,
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate: dueDate || null,
        createdBy: req.user._id,
      });

      await populateTask(task);
      res.status(201).json(task);
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/tasks/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .populate('createdBy', 'name');

    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id
// Admin: can edit everything. Assigned member: can only update status.
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isAdmin = req.user.role === 'admin';
    const isAssigned =
      task.assignedTo && task.assignedTo.equals(req.user._id);

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (isAdmin) {
      const { title, description, assignedTo, status, priority, dueDate } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
    } else {
      // Members can only flip the status
      if (req.body.status) task.status = req.body.status;
    }

    await task.save();
    await syncProjectStatus(task.project);
    await populateTask(task);
    res.json(task);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id  — admin only
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const projectId = task.project;
    await task.deleteOne();
    await syncProjectStatus(projectId);
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
