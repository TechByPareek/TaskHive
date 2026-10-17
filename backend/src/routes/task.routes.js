/**
 * task.routes.js
 * Defines all /api/tasks endpoint mappings.
 */

import { Router } from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller.js';

const router = Router();

// GET /api/tasks       → list all tasks
router.get('/', getAllTasks);

// GET /api/tasks/:id   → get a single task
router.get('/:id', getTaskById);

// POST /api/tasks      → create a task
router.post('/', createTask);

// PUT /api/tasks/:id   → update a task
router.put('/:id', updateTask);

// DELETE /api/tasks/:id → delete a task
router.delete('/:id', deleteTask);

export default router;
