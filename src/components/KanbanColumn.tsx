import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Column, PRIORITY_META, Ticket } from '../types';

export interface DragPayload {
  ticketId: string;
  sourceColumnId: string;
}

interface KanbanColumnProps {
  column: Column;
  visibleTickets: Ticket[];
  isFirst: boolean;
  isLast: boolean;
  isFiltered: boolean;
  dragOverColumnId: string | null;
  onDragStartTicket: (payload: DragPayload) => void;
  onDragEndTicket: () => void;
  onDragOverColumn: (columnId: string | null) => void;
  onDropTicket: (targetColumnId: string, targetIndex?: number) => void;
  onEditColumn: (column: Column) => void;
  onDeleteColumn: (column: Column) => void;
  onMoveColumn: (columnId: string, direction: 'left' | 'right') => void;
  onQuickAddTicket: (columnId: string, title: string) => void;
  onOpenNewTicketModal: (columnId: string) => void;
  onEditTicket: (columnId: string, ticket: Ticket) => void;
  onDeleteTicket: (columnId: string, ticket: Ticket) => void;
}

function formatDueDate(dateStr: string): { label: string; isOverdue: boolean } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = due < today;
  const label = due.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return { label, isOverdue };
}

export function KanbanColumn({
  column,
  visibleTickets,
  isFirst,
  isLast,
  isFiltered,
  dragOverColumnId,
  onDragStartTicket,
  onDragEndTicket,
  onDragOverColumn,
  onDropTicket,
  onEditColumn,
  onDeleteColumn,
  onMoveColumn,
  onQuickAddTicket,
  onOpenNewTicketModal,
  onEditTicket,
  onDeleteTicket,
}: KanbanColumnProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [dropBeforeTicketId, setDropBeforeTicketId] = useState<string | null>(
    null
  );

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickAddTicket(column.id, quickTitle.trim());
    setQuickTitle('');
    setQuickAddOpen(false);
  };

  const isDragOver = dragOverColumnId === column.id;

  return (
    <section
      className={`column ${isDragOver ? 'column-drag-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverColumnId !== column.id) {
          onDragOverColumn(column.id);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          onDragOverColumn(null);
          setDropBeforeTicketId(null);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDropBeforeTicketId(null);
        onDragOverColumn(null);
        onDropTicket(column.id);
      }}
    >
      <header className="column-header">
        <div className="column-title-group">
          <span
            className="column-dot"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="column-title" title={column.title}>
            {column.title}
          </h3>
          <span className="column-count">
            {isFiltered
              ? `${visibleTickets.length}/${column.tickets.length}`
              : column.tickets.length}
          </span>
        </div>

        <div className="column-actions">
          <button
            type="button"
            className="icon-btn-sm"
            disabled={isFirst}
            onClick={() => onMoveColumn(column.id, 'left')}
            title="Move column left"
            aria-label="Move column left"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            className="icon-btn-sm"
            disabled={isLast}
            onClick={() => onMoveColumn(column.id, 'right')}
            title="Move column right"
            aria-label="Move column right"
          >
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            className="icon-btn-sm"
            onClick={() => onEditColumn(column)}
            title="Edit column"
            aria-label={`Edit ${column.title}`}
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            className="icon-btn-sm danger"
            onClick={() => onDeleteColumn(column)}
            title="Delete column"
            aria-label={`Delete ${column.title}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </header>

      <div className="ticket-list">
        {visibleTickets.length === 0 ? (
          <div className="column-empty">
            {isFiltered ? 'No matching tickets' : 'Drop tickets here or add one'}
          </div>
        ) : (
          visibleTickets.map((ticket, index) => {
            const meta = PRIORITY_META[ticket.priority];
            const due = ticket.dueDate ? formatDueDate(ticket.dueDate) : null;
            return (
              <article
                key={ticket.id}
                className={`ticket-card ${
                  dropBeforeTicketId === ticket.id ? 'drop-before' : ''
                }`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', ticket.id);
                  onDragStartTicket({
                    ticketId: ticket.id,
                    sourceColumnId: column.id,
                  });
                }}
                onDragEnd={() => {
                  setDropBeforeTicketId(null);
                  onDragEndTicket();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (dropBeforeTicketId !== ticket.id) {
                    setDropBeforeTicketId(ticket.id);
                  }
                  if (dragOverColumnId !== column.id) {
                    onDragOverColumn(column.id);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropBeforeTicketId(null);
                  onDragOverColumn(null);
                  const realIndex = column.tickets.findIndex(
                    (t) => t.id === ticket.id
                  );
                  onDropTicket(column.id, realIndex === -1 ? index : realIndex);
                }}
                onClick={() => onEditTicket(column.id, ticket)}
              >
                <div className="ticket-top">
                  <span
                    className="priority-pill"
                    style={{ color: meta.color, backgroundColor: meta.bg }}
                  >
                    {meta.label}
                  </span>
                  <div
                    className="ticket-card-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="drag-handle" title="Drag to move">
                      <GripVertical size={13} />
                    </span>
                    <button
                      type="button"
                      className="icon-btn-sm"
                      onClick={() => onEditTicket(column.id, ticket)}
                      title="Edit ticket"
                      aria-label={`Edit ${ticket.title}`}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn-sm danger"
                      onClick={() => onDeleteTicket(column.id, ticket)}
                      title="Delete ticket"
                      aria-label={`Delete ${ticket.title}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <h4 className="ticket-title">{ticket.title}</h4>

                {ticket.description && (
                  <p className="ticket-desc">{ticket.description}</p>
                )}

                {(ticket.tags.length > 0 || due) && (
                  <div className="ticket-meta">
                    <div className="ticket-tags">
                      {ticket.tags.map((tag) => (
                        <span key={tag} className="tag-chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {due && (
                      <span
                        className={`due-badge ${due.isOverdue ? 'overdue' : ''}`}
                      >
                        <Calendar size={11} />
                        {due.label}
                      </span>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      <footer className="column-footer">
        {quickAddOpen ? (
          <form onSubmit={handleQuickSubmit} className="quick-add-form">
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Enter ticket title..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setQuickAddOpen(false);
                  setQuickTitle('');
                }
              }}
            />
            <div className="quick-add-actions">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!quickTitle.trim()}
              >
                Add
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setQuickAddOpen(false);
                  setQuickTitle('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setQuickAddOpen(false);
                  onOpenNewTicketModal(column.id);
                }}
              >
                More options
              </button>
            </div>
          </form>
        ) : (
          <div className="column-footer-buttons">
            <button
              type="button"
              className="add-ticket-btn"
              onClick={() => setQuickAddOpen(true)}
            >
              <Plus size={15} />
              Add ticket
            </button>
            <button
              type="button"
              className="icon-btn-sm"
              onClick={() => onOpenNewTicketModal(column.id)}
              title="New ticket with details"
              aria-label="New ticket with details"
            >
              <Pencil size={13} />
            </button>
          </div>
        )}
      </footer>
    </section>
  );
}
