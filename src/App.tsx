import { useMemo, useState } from 'react';
import {
  Filter,
  FolderPlus,
  Menu,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useProjectStore } from './store';
import { Board, Column, PRIORITY_META, Priority, Ticket } from './types';
import { Sidebar } from './components/Sidebar';
import { BoardModal } from './components/BoardModal';
import { ColumnModal } from './components/ColumnModal';
import { TicketModal } from './components/TicketModal';
import { ConfirmModal } from './components/ConfirmModal';
import { DragPayload, KanbanColumn } from './components/KanbanColumn';

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
} | null;

type TicketModalState =
  | { mode: 'create'; columnId: string }
  | { mode: 'edit'; columnId: string; ticket: Ticket }
  | null;

export function App() {
  const store = useProjectStore();
  const { activeBoard } = store;

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  // Modals state
  const [boardModal, setBoardModal] = useState<
    { mode: 'create' } | { mode: 'edit'; board: Board } | null
  >(null);
  const [columnModal, setColumnModal] = useState<
    { mode: 'create' } | { mode: 'edit'; column: Column } | null
  >(null);
  const [ticketModal, setTicketModal] = useState<TicketModalState>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  // Drag-and-drop state
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const isFiltered = searchQuery.trim() !== '' || priorityFilter !== 'all';

  const filterTicket = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (ticket: Ticket): boolean => {
      if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) {
        return false;
      }
      if (!q) return true;
      return (
        ticket.title.toLowerCase().includes(q) ||
        ticket.description.toLowerCase().includes(q) ||
        ticket.tags.some((t) => t.toLowerCase().includes(q))
      );
    };
  }, [searchQuery, priorityFilter]);

  const handleRequestDeleteBoard = (board: Board) => {
    const count = board.columns.reduce((sum, c) => sum + c.tickets.length, 0);
    setConfirmState({
      title: 'Delete Board',
      message: `Delete "${board.name}" along with ${board.columns.length} column(s) and ${count} ticket(s)? This cannot be undone.`,
      confirmLabel: 'Delete Board',
      onConfirm: () => store.deleteBoard(board.id),
    });
  };

  const handleRequestDeleteColumn = (column: Column) => {
    if (!activeBoard) return;
    if (column.tickets.length === 0) {
      store.deleteColumn(activeBoard.id, column.id);
      return;
    }
    setConfirmState({
      title: 'Delete Column',
      message: `Delete "${column.title}" and its ${column.tickets.length} ticket(s)? This cannot be undone.`,
      confirmLabel: 'Delete Column',
      onConfirm: () => store.deleteColumn(activeBoard.id, column.id),
    });
  };

  const handleRequestDeleteTicket = (columnId: string, ticket: Ticket) => {
    if (!activeBoard) return;
    setConfirmState({
      title: 'Delete Ticket',
      message: `Delete ticket "${ticket.title}"? This cannot be undone.`,
      confirmLabel: 'Delete Ticket',
      onConfirm: () => store.deleteTicket(activeBoard.id, columnId, ticket.id),
    });
  };

  const handleDropTicket = (targetColumnId: string, targetIndex?: number) => {
    if (!activeBoard || !dragPayload) return;
    store.moveTicket(
      activeBoard.id,
      dragPayload.sourceColumnId,
      dragPayload.ticketId,
      targetColumnId,
      targetIndex
    );
    setDragPayload(null);
    setDragOverColumnId(null);
  };

  const totalTickets = activeBoard
    ? activeBoard.columns.reduce((sum, col) => sum + col.tickets.length, 0)
    : 0;

  return (
    <div className="app-shell">
      <Sidebar
        boards={store.boards}
        activeBoardId={activeBoard?.id ?? null}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onSelectBoard={(id) => {
          store.selectBoard(id);
          setSearchQuery('');
          setPriorityFilter('all');
        }}
        onNewBoard={() => setBoardModal({ mode: 'create' })}
        onEditBoard={(board) => setBoardModal({ mode: 'edit', board })}
        onDeleteBoard={handleRequestDeleteBoard}
      />

      <main className="main-area">
        {activeBoard ? (
          <>
            <header className="board-topbar">
              <div className="topbar-left">
                <button
                  type="button"
                  className="icon-btn mobile-only"
                  onClick={() => setMobileSidebarOpen(true)}
                  aria-label="Open boards menu"
                >
                  <Menu size={20} />
                </button>
                <span
                  className="board-header-dot"
                  style={{ backgroundColor: activeBoard.color }}
                />
                <div className="board-heading">
                  <div className="board-heading-row">
                    <h1>{activeBoard.name}</h1>
                    <span className="board-stats">
                      {activeBoard.columns.length} cols · {totalTickets} tickets
                    </span>
                  </div>
                  {activeBoard.description && (
                    <p className="board-desc">{activeBoard.description}</p>
                  )}
                </div>
              </div>

              <div className="topbar-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setBoardModal({ mode: 'edit', board: activeBoard })
                  }
                >
                  <Pencil size={14} />
                  <span>Edit Board</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm danger-outline"
                  onClick={() => handleRequestDeleteBoard(activeBoard)}
                  aria-label="Delete current board"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setColumnModal({ mode: 'create' })}
                >
                  <Plus size={15} />
                  <span>Add Column</span>
                </button>
              </div>
            </header>

            <div className="filter-bar">
              <div className="search-box">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tickets by title, description, or tag..."
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="icon-btn-sm"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="filter-select-wrap">
                <Filter size={14} />
                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(e.target.value as Priority | 'all')
                  }
                  aria-label="Filter by priority"
                >
                  <option value="all">All Priorities</option>
                  {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </option>
                  ))}
                </select>
              </div>

              {isFiltered && (
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    setSearchQuery('');
                    setPriorityFilter('all');
                  }}
                >
                  Reset filters
                </button>
              )}
            </div>

            <div className="board-canvas">
              {activeBoard.columns.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-card">
                    <h2>This board has no columns yet</h2>
                    <p>
                      Create columns like <strong>To Do</strong>,{' '}
                      <strong>In Progress</strong>, and <strong>Done</strong> to
                      start organizing tickets.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setColumnModal({ mode: 'create' })}
                    >
                      <Plus size={16} />
                      Add First Column
                    </button>
                  </div>
                </div>
              ) : (
                <div className="columns-track">
                  {activeBoard.columns.map((column, index) => (
                    <KanbanColumn
                      key={column.id}
                      column={column}
                      visibleTickets={column.tickets.filter(filterTicket)}
                      isFirst={index === 0}
                      isLast={index === activeBoard.columns.length - 1}
                      isFiltered={isFiltered}
                      dragOverColumnId={dragOverColumnId}
                      onDragStartTicket={setDragPayload}
                      onDragEndTicket={() => {
                        setDragPayload(null);
                        setDragOverColumnId(null);
                      }}
                      onDragOverColumn={setDragOverColumnId}
                      onDropTicket={handleDropTicket}
                      onEditColumn={(col) =>
                        setColumnModal({ mode: 'edit', column: col })
                      }
                      onDeleteColumn={handleRequestDeleteColumn}
                      onMoveColumn={(colId, dir) =>
                        store.moveColumn(activeBoard.id, colId, dir)
                      }
                      onQuickAddTicket={(colId, title) =>
                        store.createTicket(activeBoard.id, colId, {
                          title,
                          description: '',
                          priority: 'medium',
                          tags: [],
                          dueDate: '',
                        })
                      }
                      onOpenNewTicketModal={(colId) =>
                        setTicketModal({ mode: 'create', columnId: colId })
                      }
                      onEditTicket={(colId, ticket) =>
                        setTicketModal({
                          mode: 'edit',
                          columnId: colId,
                          ticket,
                        })
                      }
                      onDeleteTicket={handleRequestDeleteTicket}
                    />
                  ))}

                  <button
                    type="button"
                    className="add-column-tile"
                    onClick={() => setColumnModal({ mode: 'create' })}
                  >
                    <Plus size={18} />
                    <span>Add Column</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state full-height">
            <button
              type="button"
              className="icon-btn mobile-only floating-menu-btn"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open boards menu"
            >
              <Menu size={20} />
            </button>
            <div className="empty-state-card">
              <div className="empty-icon">
                <FolderPlus size={28} />
              </div>
              <h2>No project boards yet</h2>
              <p>
                Create a board to organize your work into columns and tickets.
                Everything stays private in your browser&apos;s localStorage.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setBoardModal({ mode: 'create' })}
              >
                <Plus size={16} />
                Create Your First Board
              </button>
            </div>
          </div>
        )}
      </main>

      {boardModal && (
        <BoardModal
          initial={boardModal.mode === 'edit' ? boardModal.board : undefined}
          onSubmit={(input) => {
            if (boardModal.mode === 'create') {
              store.createBoard(input);
            } else {
              store.updateBoard(boardModal.board.id, input);
            }
          }}
          onClose={() => setBoardModal(null)}
        />
      )}

      {columnModal && activeBoard && (
        <ColumnModal
          initial={
            columnModal.mode === 'edit' ? columnModal.column : undefined
          }
          onSubmit={(input) => {
            if (columnModal.mode === 'create') {
              store.createColumn(activeBoard.id, input);
            } else {
              store.updateColumn(activeBoard.id, columnModal.column.id, input);
            }
          }}
          onClose={() => setColumnModal(null)}
        />
      )}

      {ticketModal && activeBoard && (
        <TicketModal
          columns={activeBoard.columns}
          initialColumnId={ticketModal.columnId}
          initialTicket={
            ticketModal.mode === 'edit' ? ticketModal.ticket : undefined
          }
          onSubmit={(input, targetColumnId) => {
            if (ticketModal.mode === 'create') {
              store.createTicket(activeBoard.id, targetColumnId, input);
            } else {
              store.updateTicket(
                activeBoard.id,
                ticketModal.columnId,
                ticketModal.ticket.id,
                input,
                targetColumnId
              );
            }
          }}
          onDelete={
            ticketModal.mode === 'edit'
              ? () => {
                  const { columnId, ticket } = ticketModal;
                  setTicketModal(null);
                  handleRequestDeleteTicket(columnId, ticket);
                }
              : undefined
          }
          onClose={() => setTicketModal(null)}
        />
      )}

      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          onConfirm={confirmState.onConfirm}
          onClose={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
export default App;
