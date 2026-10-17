/**
 * ConfirmDialog.jsx
 * A reusable confirmation modal dialog.
 * Props:
 *   isOpen    - boolean to show/hide
 *   title     - string
 *   message   - string
 *   onConfirm - called when user confirms
 *   onCancel  - called when user cancels or closes
 *   loading   - boolean, disables buttons while in-flight
 */

import { useRef } from 'react';
import useModalAccessibility from '../hooks/useModalAccessibility';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, loading }) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  useModalAccessibility(isOpen, dialogRef, cancelButtonRef, onCancel);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal-box confirm-dialog" ref={dialogRef}>
        <div className="confirm-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2 id="confirm-title" className="confirm-title">{title || 'Are you sure?'}</h2>
        <p className="confirm-message">{message || 'This action cannot be undone.'}</p>
        <div className="confirm-actions">
          <button
            id="confirm-cancel-btn"
            ref={cancelButtonRef}
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            id="confirm-delete-btn"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner spinner-sm"></span>
                Deleting…
              </span>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
