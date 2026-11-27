import React, { useState } from 'react';
import { BOARD_COLORS, Board } from '../types';
import { BoardInput } from '../store';
import { Modal } from './Modal';

interface BoardModalProps {
  initial?: Board;
  onSubmit: (input: BoardInput) => void;
  onClose: () => void;
}

export function BoardModal({ initial, onSubmit, onClose }: BoardModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor] = useState<string>(initial?.color ?? BOARD_COLORS[0]);
  const [withDefaultColumns, setWithDefaultColumns] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name,
      description,
      color,
      withDefaultColumns: initial ? undefined : withDefaultColumns,
    });
    onClose();
  };

  return (
    <Modal title={initial ? 'Edit Board' : 'Create Board'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form-stack">
        <label className="field">
          <span>Board Name *</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Q4 Release, Mobile App"
            autoFocus
            required
          />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this board tracking?"
          />
        </label>

        <div className="field">
          <span>Accent Color</span>
          <div className="color-picker">
            {BOARD_COLORS.map((swatch) => (
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

        {!initial && (
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={withDefaultColumns}
              onChange={(e) => setWithDefaultColumns(e.target.checked)}
            />
            <span>Create starter columns (To Do, In Progress, Done)</span>
          </label>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!name.trim()}
          >
            {initial ? 'Save Changes' : 'Create Board'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
