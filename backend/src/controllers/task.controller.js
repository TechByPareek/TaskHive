/**
 * task.controller.js
 * Handles HTTP request/response for task endpoints.
 * Delegates all business logic to task.service.js.
 */

import * as TaskService from '../services/task.service.js';

/**
 * GET /api/tasks
 * Returns all tasks with HTTP 200.
 */
export function getAllTasks(req, res, next) {
  try {
    const tasks = TaskService.getAllTasks();
    res.status(200).json({ success: true, data: tasks, count: tasks.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/:id
 * Returns one task with HTTP 200, or HTTP 404 if missing.
 */
export function getTaskById(req, res, next) {
  try {
    const task = TaskService.getTaskById(req.params.id);
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tasks
 * Validates and creates a task with HTTP 201.
 * Invalid input returns HTTP 400.
 */
export function createTask(req, res, next) {
  try {
    const task = TaskService.createTask(req.body);
    res.status(201).json({ success: true, data: task, message: 'Task created successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tasks/:id
 * Updates a task with HTTP 200.
 * Invalid input returns HTTP 400; missing task returns HTTP 404.
 */
export function updateTask(req, res, next) {
  try {
    const task = TaskService.updateTask(req.params.id, req.body);
    res.status(200).json({ success: true, data: task, message: 'Task updated successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/tasks/:id
 * Deletes a task with HTTP 200; missing task returns HTTP 404.
 */
export function deleteTask(req, res, next) {
  try {
    const deleted = TaskService.deleteTask(req.params.id);
    res
      .status(200)
      .json({ success: true, data: deleted, message: 'Task deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
