const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

const populate = async (doc) => {
  await doc.populate('owner', 'name email role');
  await doc.populate('members', 'name email role');
  return doc;
};

// GET /api/projects  — projects the user owns or is a member of
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate('owner', 'name email role')
      .populate('members', 'name email role')
      .sort('-createdAt');

    res.json(projects);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects  — admin only
router.post(
  '/',
  auth,
  adminOnly,
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { name, description } = req.body;
      const project = await Project.create({
        name,
        description,
        owner: req.user._id,
        members: [req.user._id],
      });

      await populate(project);
      res.status(201).json(project);
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/projects/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email role')
      .populate('members', 'name email role');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember =
      project.members.some((m) => m._id.equals(req.user._id)) ||
      project.owner._id.equals(req.user._id);

    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id  — owner/admin only
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only project owner can edit' });
    }

    const { name, description, status } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;

    await project.save();
    await populate(project);
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/members  — add member (owner/admin)
router.post('/:id/members', auth, adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only owner can manage members' });
    }

    const { userId } = req.body;
    const userExists = await User.findById(userId);
    if (!userExists) return res.status(404).json({ message: 'User not found' });

    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();
    }

    await populate(project);
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId  — remove member (owner/admin)
router.delete('/:id/members/:userId', auth, adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only owner can manage members' });
    }

    // Don't allow removing the owner
    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove the project owner' });
    }

    project.members = project.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await project.save();
    await populate(project);
    res.json(project);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id  — owner/admin only
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!project.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only owner can delete project' });
    }

    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
