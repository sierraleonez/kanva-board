import {
  Database,
  Kanban,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Board } from '../types';

interface SidebarProps {
  boards: Board[];
  activeBoardId: string | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectBoard: (boardId: string) => void;
  onNewBoard: () => void;
  onEditBoard: (board: Board) => void;
  onDeleteBoard: (board: Board) => void;
}

export function Sidebar({
  boards,
  activeBoardId,
  mobileOpen,
  onCloseMobile,
  onSelectBoard,
  onNewBoard,
  onEditBoard,
  onDeleteBoard,
}: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onCloseMobile} />
      )}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Kanban size={18} />
          </div>
          <div>
            <div className="brand-title">Kanva</div>
            <div className="brand-subtitle">Project Boards</div>
          </div>
          <button
            type="button"
            className="icon-btn mobile-only"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-section-header">
          <span>BOARDS ({boards.length})</span>
          <button
            type="button"
            className="icon-btn"
            onClick={onNewBoard}
            title="Create new board"
            aria-label="Create new board"
          >
            <Plus size={16} />
          </button>
        </div>

        <nav className="board-list" aria-label="Project boards">
          {boards.length === 0 ? (
            <div className="sidebar-empty">
              No boards yet. Create your first board to get started.
            </div>
          ) : (
            boards.map((board) => {
              const ticketCount = board.columns.reduce(
                (sum, col) => sum + col.tickets.length,
                0
              );
              const isActive = board.id === activeBoardId;
              return (
                <div
                  key={board.id}
                  className={`board-item ${isActive ? 'active' : ''}`}
                >
                  <button
                    type="button"
                    className="board-item-main"
                    onClick={() => {
                      onSelectBoard(board.id);
                      onCloseMobile();
                    }}
                  >
                    <span
                      className="board-dot"
                      style={{ backgroundColor: board.color }}
                    />
                    <span className="board-name">{board.name}</span>
                    <span className="board-count">{ticketCount}</span>
                  </button>
                  <div className="board-item-actions">
                    <button
                      type="button"
                      className="icon-btn-sm"
                      onClick={() => onEditBoard(board)}
                      title="Edit board"
                      aria-label={`Edit ${board.name}`}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn-sm danger"
                      onClick={() => onDeleteBoard(board)}
                      title="Delete board"
                      aria-label={`Delete ${board.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={onNewBoard}
          >
            <Plus size={16} />
            New Board
          </button>
          <div className="storage-badge">
            <Database size={13} />
            <span>Saved locally in localStorage</span>
          </div>
        </div>
      </aside>
    </>
  );
}
