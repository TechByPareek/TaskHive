/**
 * TaskDetails.jsx
 * Modal to display complete details of a single task.
 * Props:
 *   task     - the task object to display (null when closed)
 *   onClose  - called to close the modal
 *   onEdit   - called with task to open edit form
 *   onDelete - called with task to open delete confirmation
 */

import { useRef } from 'react';
import { formatDate, formatDateTime, getStatusClass, getPriorityClass,
         getStatusLabel, getPriorityLabel } from '../utils/helpers';
import useModalAccessibility from '../hooks/useModalAccessibility';

export default function TaskDetails({ task, onClose, onEdit, onDelete }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useModalAccessibility(Boolean(task), dialogRef, closeButtonRef, onClose);

  if (!task) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box details-modal" ref={dialogRef}>
        {/* Header */}
        <div className="modal-header">
          <h2 id="details-title" className="modal-title">Task Details</h2>
          <button
            id="details-close-btn"
            ref={closeButtonRef}
            className="modal-close"
            onClick={onClose}
            aria-label="Close task details"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="details-body">
          {/* Title */}
          <div className="details-title-row">
            <h3 className="details-task-title">{task.title}</h3>
            <div className="details-badges">
              <span className={`badge status-badge ${getStatusClass(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>
              <span className={`badge priority-badge ${getPriorityClass(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="detail-section">
            <span className="detail-label">Description</span>
            <p className="detail-value description-text">{task.description}</p>
          </div>

          {/* Two-column grid */}
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">ID</span>
              <span className="detail-value id-text">{task.id}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Due Date</span>
              <span className="detail-value">
                {task.dueDate ? formatDate(task.dueDate) : <em className="muted">No due date</em>}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Created At</span>
              <span className="detail-value">{formatDateTime(task.createdAt)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Last Updated</span>
              <span className="detail-value">{formatDateTime(task.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="modal-footer">
          <button
            id="details-close-footer-btn"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
          <div className="details-footer-actions">
            <button
              id="details-delete-btn"
              className="btn btn-danger btn-outline"
              onClick={() => { onClose(); onDelete(task); }}
            >
              Delete
            </button>
            <button
              id="details-edit-btn"
              className="btn btn-primary"
              onClick={() => { onClose(); onEdit(task); }}
            >
              Edit Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
