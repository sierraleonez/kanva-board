import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Column, PRIORITY_META, Priority, Ticket } from '../types';
import { TicketInput } from '../store';
import { Modal } from './Modal';

interface TicketModalProps {
  columns: Column[];
  initialColumnId: string;
  initialTicket?: Ticket;
  onSubmit: (input: TicketInput, targetColumnId: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

export function TicketModal({
  columns,
  initialColumnId,
  initialTicket,
  onSubmit,
  onDelete,
  onClose,
}: TicketModalProps) {
  const [title, setTitle] = useState(initialTicket?.title ?? '');
  const [description, setDescription] = useState(
    initialTicket?.description ?? ''
  );
  const [priority, setPriority] = useState<Priority>(
    initialTicket?.priority ?? 'medium'
  );
  const [columnId, setColumnId] = useState(initialColumnId);
  const [tagsRaw, setTagsRaw] = useState(
    initialTicket?.tags.join(', ') ?? ''
  );
  const [dueDate, setDueDate] = useState(initialTicket?.dueDate ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6);

    onSubmit(
      {
        title,
        description,
        priority,
        tags,
        dueDate,
      },
      columnId
    );
    onClose();
  };

  return (
    <Modal
      title={initialTicket ? 'Edit Ticket' : 'New Ticket'}
      onClose={onClose}
      maxWidth={540}
    >
      <form onSubmit={handleSubmit} className="form-stack">
        <label className="field">
          <span>Title *</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short, actionable ticket summary"
            autoFocus
            required
          />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details, acceptance criteria, or notes..."
          />
        </label>

        <div className="field-grid">
          <label className="field">
            <span>Column</span>
            <select
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Priority</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field-grid">
          <label className="field">
            <span>Tags (comma-separated)</span>
            <input
              type="text"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="frontend, bug, q4"
            />
          </label>

          <label className="field">
            <span>Due Date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
        </div>

        <div className="modal-actions modal-actions-split">
          <div>
            {initialTicket && onDelete && (
              <button
                type="button"
                className="btn btn-danger-ghost"
                onClick={onDelete}
              >
                <Trash2 size={15} />
                Delete Ticket
              </button>
            )}
          </div>
          <div className="modal-actions-right">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!title.trim()}
            >
              {initialTicket ? 'Save Changes' : 'Create Ticket'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
