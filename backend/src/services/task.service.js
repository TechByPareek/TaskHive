/**
 * task.service.js
 * In-memory task storage and business logic.
 * Data resets when the server restarts — this is by design.
 */

import { randomUUID } from 'crypto';

// In-memory task array (the single source of truth)
let tasks = [];

// Allowed enum values
const VALID_STATUSES = ['pending', 'in_progress', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

/**
 * Validate task input fields.
 * Returns { valid: boolean, errors: string[] }
 */
function validateTaskInput(data, requireAll = true) {
  const errors = [];

  if (requireAll || data.title !== undefined) {
    if (!data.title || !String(data.title).trim()) {
      errors.push('Title is required and cannot be blank.');
    }
  }

  if (requireAll || data.description !== undefined) {
    if (!data.description || !String(data.description).trim()) {
      errors.push('Description is required and cannot be blank.');
    }
  }

  if (requireAll || data.status !== undefined) {
    const status = data.status || 'pending';
    if (!VALID_STATUSES.includes(status)) {
      errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}.`);
    }
  }

  if (requireAll || data.priority !== undefined) {
    const priority = data.priority || 'medium';
    if (!VALID_PRIORITIES.includes(priority)) {
      errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
    }
  }

  if (data.dueDate !== undefined && data.dueDate !== null && data.dueDate !== '') {
    const dateValue = String(data.dueDate);
    const parsed = new Date(dateValue);
    const isCalendarDate = /^\d{4}-\d{2}-\d{2}$/.test(dateValue);
    const isInvalidCalendarDate =
      isCalendarDate &&
      !isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) !== dateValue;
    if (isNaN(parsed.getTime()) || isInvalidCalendarDate) {
      errors.push('dueDate must be a valid date string (e.g. 2024-12-31).');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get all tasks.
 */
export function getAllTasks() {
  return [...tasks];
}

/**
 * Get a single task by ID.
 * Throws {status: 404} if not found.
 */
export function getTaskById(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    const err = new Error(`Task with id "${id}" not found.`);
    err.status = 404;
    throw err;
  }
  return { ...task };
}

/**
 * Create a new task.
 * Throws {status: 400} on validation failure.
 */
export function createTask(data) {
  const { valid, errors } = validateTaskInput(data, true);
  if (!valid) {
    const err = new Error('Validation failed.');
    err.status = 400;
    err.errors = errors;
    throw err;
  }

  const now = new Date().toISOString();
  const task = {
    id: randomUUID(),
    title: String(data.title).trim(),
    description: String(data.description).trim(),
    status: data.status || 'pending',
    priority: data.priority || 'medium',
    dueDate: data.dueDate || null,
    createdAt: now,
    updatedAt: now,
  };

  tasks.push(task);
  return { ...task };
}

/**
 * Update an existing task.
 * Throws {status: 404} if not found, {status: 400} on validation failure.
 */
export function updateTask(id, data) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    const err = new Error(`Task with id "${id}" not found.`);
    err.status = 404;
    throw err;
  }

  // Validate only the provided fields (partial update support)
  const { valid, errors } = validateTaskInput(data, false);
  if (!valid) {
    const err = new Error('Validation failed.');
    err.status = 400;
    err.errors = errors;
    throw err;
  }

  const existing = tasks[index];
  const updated = {
    ...existing,
    title: data.title !== undefined ? String(data.title).trim() : existing.title,
    description: data.description !== undefined ? String(data.description).trim() : existing.description,
    status: data.status !== undefined ? data.status : existing.status,
    priority: data.priority !== undefined ? data.priority : existing.priority,
    dueDate: data.dueDate !== undefined ? data.dueDate || null : existing.dueDate,
    updatedAt: new Date().toISOString(),
  };

  // Re-validate required fields haven't been blanked out
  if (!updated.title) {
    const err = new Error('Validation failed.');
    err.status = 400;
    err.errors = ['Title cannot be blank.'];
    throw err;
  }
  if (!updated.description) {
    const err = new Error('Validation failed.');
    err.status = 400;
    err.errors = ['Description cannot be blank.'];
    throw err;
  }

  tasks[index] = updated;
  return { ...updated };
}

/**
 * Delete a task by ID.
 * Throws {status: 404} if not found.
 */
export function deleteTask(id) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    const err = new Error(`Task with id "${id}" not found.`);
    err.status = 404;
    throw err;
  }

  const deleted = tasks[index];
  tasks.splice(index, 1);
  return { ...deleted };
}
