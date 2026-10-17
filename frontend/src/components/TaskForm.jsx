/**
 * TaskForm.jsx
 * Reusable modal form for creating and editing tasks.
 * Props:
 *   isOpen       - boolean
 *   mode         - 'create' | 'edit'
 *   initialData  - task object when editing (null for create)
 *   onSubmit     - async (formData) => void
 *   onClose      - () => void
 *   loading      - boolean
 *   serverErrors - string[] from API
 */

import { useState, useEffect, useRef } from 'react';
import useModalAccessibility from '../hooks/useModalAccessibility';

const EMPTY_FORM = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  dueDate: '',
};

export default function TaskForm({ isOpen, mode, initialData, onSubmit, onClose, loading, serverErrors }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const dialogRef = useRef(null);
  const titleInputRef = useRef(null);

  useModalAccessibility(isOpen, dialogRef, titleInputRef, onClose);

  // Populate form when editing
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setForm({
          title: initialData.title || '',
          description: initialData.description || '',
          status: initialData.status || 'pending',
          priority: initialData.priority || 'medium',
          dueDate: initialData.dueDate
            ? initialData.dueDate.split('T')[0]  // take only YYYY-MM-DD part
            : '',
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [isOpen, mode, initialData]);

  useEffect(() => {
    const firstInvalidField = ['title', 'description', 'dueDate'].find((name) => errors[name]);
    if (firstInvalidField) document.getElementById(`task-${firstInvalidField}`)?.focus();
  }, [errors]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required.';
    if (!form.description.trim()) newErrors.description = 'Description is required.';
    if (!['pending', 'in_progress', 'completed'].includes(form.status)) {
      newErrors.status = 'Invalid status.';
    }
    if (!['low', 'medium', 'high'].includes(form.priority)) {
      newErrors.priority = 'Invalid priority.';
    }
    if (form.dueDate) {
      const parsedDate = new Date(form.dueDate);
      const isCalendarDate = /^\d{4}-\d{2}-\d{2}$/.test(form.dueDate);
      const isInvalidCalendarDate =
        isCalendarDate &&
        !isNaN(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) !== form.dueDate;
      if (isNaN(parsedDate.getTime()) || isInvalidCalendarDate) {
        newErrors.dueDate = 'Enter a valid calendar date.';
      }
    }
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
    };
    await onSubmit(payload);
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  if (!isOpen) return null;

  const isEdit = mode === 'edit';

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-title"
      onClick={handleOverlayClick}
    >
      <div className="modal-box form-modal" ref={dialogRef}>
        {/* Header */}
        <div className="modal-header">
          <h2 id="form-title" className="modal-title">
            {isEdit ? '✏️ Edit Task' : '➕ Create Task'}
          </h2>
          <button
            id="form-close-btn"
            className="modal-close"
            onClick={onClose}
            type="button"
            aria-label="Close form"
          >
            ×
          </button>
        </div>

        {/* Server-side errors banner */}
        {serverErrors && serverErrors.length > 0 && (
          <div className="alert alert-error" role="alert">
            <strong>Error:</strong>
            <ul>
              {serverErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form */}
        <form id="task-form" onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">
              Title <span className="required">*</span>
            </label>
            <input
              id="task-title"
              ref={titleInputRef}
              name="title"
              type="text"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              placeholder="Enter task title"
              value={form.title}
              onChange={handleChange}
              disabled={loading}
              maxLength={200}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'task-title-error' : undefined}
            />
            {errors.title && <span id="task-title-error" className="field-error" role="alert">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="task-description"
              name="description"
              className={`form-input form-textarea ${errors.description ? 'input-error' : ''}`}
              placeholder="Describe the task in detail"
              value={form.description}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              maxLength={2000}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'task-description-error' : undefined}
            />
            {errors.description && <span id="task-description-error" className="field-error" role="alert">{errors.description}</span>}
          </div>

          {/* Two-column row: Status + Priority */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="task-status">Status</label>
              <select
                id="task-status"
                name="status"
                className="form-input form-select"
                value={form.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                name="priority"
                className="form-input form-select"
                value={form.priority}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="task-dueDate">Due Date</label>
            <input
              id="task-dueDate"
              name="dueDate"
              type="date"
              className={`form-input ${errors.dueDate ? 'input-error' : ''}`}
              value={form.dueDate}
              onChange={handleChange}
              disabled={loading}
              aria-invalid={Boolean(errors.dueDate)}
              aria-describedby={errors.dueDate ? 'task-dueDate-error' : undefined}
            />
            {errors.dueDate && <span id="task-dueDate-error" className="field-error" role="alert">{errors.dueDate}</span>}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              id="form-cancel-btn"
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              id="form-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner spinner-sm"></span>
                  {isEdit ? 'Saving…' : 'Creating…'}
                </span>
              ) : (
                isEdit ? 'Save Changes' : 'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
