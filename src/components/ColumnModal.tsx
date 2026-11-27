import React, { useState } from 'react';
import { COLUMN_COLORS, Column } from '../types';
import { ColumnInput } from '../store';
import { Modal } from './Modal';

interface ColumnModalProps {
  initial?: Column;
  onSubmit: (input: ColumnInput) => void;
  onClose: () => void;
}

export function ColumnModal({ initial, onSubmit, onClose }: ColumnModalProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [color, setColor] = useState<string>(
    initial?.color ?? COLUMN_COLORS[0]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, color });
    onClose();
  };

  return (
    <Modal
      title={initial ? 'Edit Column' : 'Add Column'}
      onClose={onClose}
      maxWidth={420}
    >
      <form onSubmit={handleSubmit} className="form-stack">
        <label className="field">
          <span>Column Title *</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Backlog, In Review, Blocked"
            autoFocus
            required
          />
        </label>

        <div className="field">
          <span>Indicator Color</span>
          <div className="color-picker">
            {COLUMN_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                className={`color-swatch ${color === swatch ? 'selected' : ''}`}
                style={{ backgroundColor: swatch }}
                onClick={() => setColor(swatch)}
                aria-label={`Select color ${swatch}`}
              />
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!title.trim()}
          >
            {initial ? 'Save Column' : 'Add Column'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
