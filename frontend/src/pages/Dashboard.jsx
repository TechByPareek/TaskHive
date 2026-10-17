/**
 * Dashboard.jsx
 * Main page: task list, summary cards, search/filter/sort,
 * and orchestrates all modals (TaskForm, TaskDetails, ConfirmDialog).
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as api from '../services/taskApi';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import TaskDetails from '../components/TaskDetails';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate, getStatusClass, getPriorityClass, getStatusLabel, getPriorityLabel } from '../utils/helpers';

// ── Toolbar / filter state defaults ──────────────────────────────────────────

const DEFAULT_FILTERS = {
  search: '',
  status: 'all',
  priority: 'all',
  sortBy: 'createdAt_desc',
};

// ── Summary Card component ────────────────────────────────────────────────────

function SummaryCard({ label, count, colorClass, icon }) {
  return (
    <div className={`summary-card ${colorClass}`}>
      <div className="summary-icon">{icon}</div>
      <div className="summary-info">
        <span className="summary-count">{count}</span>
        <span className="summary-label">{label}</span>
      </div>
    </div>
  );
}

// ── Main Dashboard component ──────────────────────────────────────────────────

export default function Dashboard() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // ── Modal/dialog state ──────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editingTask, setEditingTask] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formServerErrors, setFormServerErrors] = useState(null);

  const [viewingTask, setViewingTask] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Filter/sort state ────────────────────────────────────────────────────────
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const debounceRef = useRef(null);

  // ── Load tasks on mount ──────────────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.fetchTasks();
      setTasks(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ── Success message auto-clear ───────────────────────────────────────────────
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 3500);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ── Debounced search ─────────────────────────────────────────────────────────
  function handleSearchChange(e) {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: val }));
    }, 300);
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setSearchInput('');
  }

  // ── Filtered + sorted tasks ──────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    // Search
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      list = list.filter((t) => t.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      list = list.filter((t) => t.priority === filters.priority);
    }

    // Sort
    const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
    switch (filters.sortBy) {
      case 'createdAt_desc':
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'createdAt_asc':
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'dueDate_asc':
        list.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
        break;
      case 'dueDate_desc':
        list.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(b.dueDate) - new Date(a.dueDate);
        });
        break;
      case 'priority_asc':
        list.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
        break;
      case 'priority_desc':
        list.sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);
        break;
      default:
        break;
    }

    return list;
  }, [tasks, filters]);

  // ── Summary counts ───────────────────────────────────────────────────────────
  const summary = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  }), [tasks]);

  // ── CRUD handlers ─────────────────────────────────────────────────────────────

  function openCreateForm() {
    setFormMode('create');
    setEditingTask(null);
    setFormServerErrors(null);
    setFormOpen(true);
  }

  function openEditForm(task) {
    setFormMode('edit');
    setEditingTask(task);
    setFormServerErrors(null);
    setFormOpen(true);
  }

  async function handleFormSubmit(formData) {
    setFormLoading(true);
    setFormServerErrors(null);
    try {
      if (formMode === 'create') {
        const res = await api.createTask(formData);
        setTasks((prev) => [res.data, ...prev]);
        setSuccessMsg('Task created successfully!');
      } else {
        const res = await api.updateTask(editingTask.id, formData);
        setTasks((prev) => prev.map((t) => (t.id === res.data.id ? res.data : t)));
        setSuccessMsg('Task updated successfully!');
      }
      setFormOpen(false);
    } catch (err) {
      setFormServerErrors(err.errors || [err.message]);
    } finally {
      setFormLoading(false);
    }
  }

  function openDeleteConfirm(task) {
    setDeleteTarget(task);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.deleteTask(deleteTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setSuccessMsg('Task deleted successfully!');
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const hasActiveFilters =
    filters.search || filters.status !== 'all' || filters.priority !== 'all' || filters.sortBy !== 'createdAt_desc';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="dashboard">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <header className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">
              <span className="logo-icon">✅</span> TaskHive
            </h1>
            <p className="page-subtitle">Organize, track, and complete your tasks with ease</p>
          </div>
          <button id="create-task-btn" className="btn btn-primary btn-lg" onClick={openCreateForm}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Task
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* ── Notifications ─────────────────────────────────────────────────── */}
        {successMsg && (
          <div className="alert alert-success" role="status">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {successMsg}
          </div>
        )}
        {error && (
          <div className="alert alert-error" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
            <button className="alert-dismiss" onClick={() => setError(null)} aria-label="Dismiss error">×</button>
          </div>
        )}

        {/* ── Summary cards ──────────────────────────────────────────────────── */}
        <section className="summary-section" aria-label="Task summary">
          <SummaryCard
            label="Total Tasks"
            count={summary.total}
            colorClass="card-total"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            }
          />
          <SummaryCard
            label="Pending"
            count={summary.pending}
            colorClass="card-pending"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            }
          />
          <SummaryCard
            label="In Progress"
            count={summary.in_progress}
            colorClass="card-inprogress"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            }
          />
          <SummaryCard
            label="Completed"
            count={summary.completed}
            colorClass="card-completed-summary"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            }
          />
        </section>

        {/* ── Toolbar: search, filter, sort ─────────────────────────────────── */}
        <section className="toolbar" aria-label="Search and filter tasks">
          <div className="search-box">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              id="search-input"
              type="search"
              className="form-input search-input"
              placeholder="Search tasks by title or description…"
              value={searchInput}
              onChange={handleSearchChange}
              aria-label="Search tasks"
            />
          </div>

          <div className="filter-controls">
            <select
              id="filter-status"
              name="status"
              className="form-input form-select filter-select"
              value={filters.status}
              onChange={handleFilterChange}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              id="filter-priority"
              name="priority"
              className="form-input form-select filter-select"
              value={filters.priority}
              onChange={handleFilterChange}
              aria-label="Filter by priority"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              id="sort-select"
              name="sortBy"
              className="form-input form-select filter-select"
              value={filters.sortBy}
              onChange={handleFilterChange}
              aria-label="Sort tasks"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="dueDate_asc">Due Date ↑</option>
              <option value="dueDate_desc">Due Date ↓</option>
              <option value="priority_asc">Priority: High First</option>
              <option value="priority_desc">Priority: Low First</option>
            </select>

            {hasActiveFilters && (
              <button
                id="clear-filters-btn"
                className="btn btn-ghost btn-sm"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        </section>

        {/* ── Task count label ──────────────────────────────────────────────── */}
        {!loading && !error && (
          <div className="task-count-label">
            {filteredTasks.length === tasks.length
              ? `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`
              : `${filteredTasks.length} of ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
            {hasActiveFilters && <span className="filter-active-dot" title="Filters active" />}
          </div>
        )}

        {/* ── Loading state ─────────────────────────────────────────────────── */}
        {loading && (
          <div className="state-container loading-state">
            <div className="spinner spinner-lg"></div>
            <p>Loading tasks…</p>
          </div>
        )}

        {/* ── Error state (no tasks shown) ─────────────────────────────────── */}
        {!loading && error && tasks.length === 0 && (
          <div className="state-container error-state">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3>Failed to load tasks</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadTasks}>Retry</button>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!loading && !error && tasks.length === 0 && (
          <div className="state-container empty-state">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            <h3>No tasks yet</h3>
            <p>Get started by creating your first task.</p>
            <button id="empty-create-btn" className="btn btn-primary" onClick={openCreateForm}>
              Create your first task
            </button>
          </div>
        )}

        {/* ── No results after filtering ─────────────────────────────────────── */}
        {!loading && !error && tasks.length > 0 && filteredTasks.length === 0 && (
          <div className="state-container empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <h3>No tasks match your filters</h3>
            <p>Try adjusting your search or filters.</p>
            <button className="btn btn-secondary" onClick={clearFilters}>Clear Filters</button>
          </div>
        )}

        {/* ── Desktop table ─────────────────────────────────────────────────── */}
        {!loading && filteredTasks.length > 0 && (
          <>
            <div className="task-table-wrapper">
              <table className="task-table" aria-label="Tasks list">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const isOverdue =
                      task.dueDate &&
                      task.status !== 'completed' &&
                      new Date(task.dueDate) < new Date();
                    return (
                      <tr
                        key={task.id}
                        className={task.status === 'completed' ? 'row-completed' : ''}
                      >
                        <td className="col-title">
                          <span className="task-title-text">{task.title}</span>
                          <span className="task-desc-preview">{task.description}</span>
                        </td>
                        <td>
                          <span className={`badge status-badge ${getStatusClass(task.status)}`}>
                            {getStatusLabel(task.status)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge priority-badge ${getPriorityClass(task.priority)}`}>
                            {getPriorityLabel(task.priority)}
                          </span>
                        </td>
                        <td className={isOverdue ? 'overdue-cell' : ''}>
                          {task.dueDate ? formatDate(task.dueDate) : <span className="muted">—</span>}
                          {isOverdue && <span className="overdue-badge">Overdue</span>}
                        </td>
                        <td>{formatDate(task.createdAt)}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="table-actions">
                            <button
                              id={`table-view-${task.id}`}
                              className="btn btn-sm btn-ghost"
                              onClick={() => setViewingTask(task)}
                              title="View"
                              aria-label={`View ${task.title}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>
                            <button
                              id={`table-edit-${task.id}`}
                              className="btn btn-sm btn-ghost"
                              onClick={() => openEditForm(task)}
                              title="Edit"
                              aria-label={`Edit ${task.title}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button
                              id={`table-delete-${task.id}`}
                              className="btn btn-sm btn-ghost btn-ghost-danger"
                              onClick={() => openDeleteConfirm(task)}
                              title="Delete"
                              aria-label={`Delete ${task.title}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ─────────────────────────────────────────────── */}
            <div className="task-cards-mobile">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onView={() => setViewingTask(task)}
                  onEdit={() => openEditForm(task)}
                  onDelete={() => openDeleteConfirm(task)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <TaskForm
        isOpen={formOpen}
        mode={formMode}
        initialData={editingTask}
        onSubmit={handleFormSubmit}
        onClose={() => setFormOpen(false)}
        loading={formLoading}
        serverErrors={formServerErrors}
      />

      <TaskDetails
        task={viewingTask}
        onClose={() => setViewingTask(null)}
        onEdit={(task) => { setViewingTask(null); openEditForm(task); }}
        onDelete={(task) => { setViewingTask(null); openDeleteConfirm(task); }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
