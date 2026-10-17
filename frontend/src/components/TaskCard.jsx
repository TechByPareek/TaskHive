/**
 * TaskCard.jsx
 * Displays a single task in a card (used in both mobile and desktop).
 * Props:
 *   task     - task object
 *   onView   - () => void
 *   onEdit   - () => void
 *   onDelete - () => void
 */

import { formatDate, getStatusClass, getPriorityClass,
         getStatusLabel, getPriorityLabel } from '../utils/helpers';

export default function TaskCard({ task, onView, onEdit, onDelete }) {
  const isOverdue =
    task.dueDate &&
    task.status !== 'completed' &&
    new Date(task.dueDate) < new Date();

  return (
    <div className={`task-card ${task.status === 'completed' ? 'card-completed' : ''}`}>
      {/* Card header */}
      <div className="card-header">
        <div className="card-badges">
          <span className={`badge status-badge ${getStatusClass(task.status)}`}>
            {getStatusLabel(task.status)}
          </span>
          <span className={`badge priority-badge ${getPriorityClass(task.priority)}`}>
            {getPriorityLabel(task.priority)}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="card-body">
        <h3 className="card-title">{task.title}</h3>
        <p className="card-description">{task.description}</p>

        {task.dueDate && (
          <div className={`card-meta ${isOverdue ? 'overdue' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>{isOverdue ? 'Overdue: ' : 'Due: '}{formatDate(task.dueDate)}</span>
          </div>
        )}
        <div className="card-meta">
          <span>Created: {formatDate(task.createdAt)}</span>
        </div>
      </div>

      {/* Card actions */}
      <div className="card-actions">
        <button
          id={`view-btn-${task.id}`}
          className="btn btn-sm btn-ghost"
          onClick={onView}
          title="View details"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          View
        </button>
        <button
          id={`edit-btn-${task.id}`}
          className="btn btn-sm btn-ghost"
          onClick={onEdit}
          title="Edit task"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
        <button
          id={`delete-btn-${task.id}`}
          className="btn btn-sm btn-ghost btn-ghost-danger"
          onClick={onDelete}
          title="Delete task"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
