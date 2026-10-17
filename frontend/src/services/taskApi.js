/**
 * taskApi.js
 * All Axios HTTP requests to the Task Management API.
 * This is the ONLY place that communicates with the backend.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Response interceptor for consistent error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with an error status
      const serverMessage =
        error.response.data?.message || `Server error: ${error.response.status}`;
      const serverErrors = error.response.data?.errors;
      const enhanced = new Error(serverMessage);
      enhanced.status = error.response.status;
      enhanced.errors = serverErrors;
      return Promise.reject(enhanced);
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject(
        new Error('Cannot reach the server. Make sure the backend is running.')
      );
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch all tasks.
 * @returns {Promise<{data: Task[], count: number}>}
 */
export async function fetchTasks() {
  const res = await api.get('/tasks');
  return res.data;
}

/**
 * Fetch a single task by ID.
 * @param {string} id
 * @returns {Promise<{data: Task}>}
 */
export async function fetchTaskById(id) {
  const res = await api.get(`/tasks/${id}`);
  return res.data;
}

/**
 * Create a new task.
 * @param {Object} taskData
 * @returns {Promise<{data: Task, message: string}>}
 */
export async function createTask(taskData) {
  const res = await api.post('/tasks', taskData);
  return res.data;
}

/**
 * Update an existing task.
 * @param {string} id
 * @param {Object} taskData
 * @returns {Promise<{data: Task, message: string}>}
 */
export async function updateTask(id, taskData) {
  const res = await api.put(`/tasks/${id}`, taskData);
  return res.data;
}

/**
 * Delete a task by ID.
 * @param {string} id
 * @returns {Promise<{data: Task, message: string}>}
 */
export async function deleteTask(id) {
  const res = await api.delete(`/tasks/${id}`);
  return res.data;
}
