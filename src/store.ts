import { useCallback, useEffect, useState } from 'react';
import {
  BOARD_COLORS,
  Board,
  COLUMN_COLORS,
  Column,
  Priority,
  Ticket,
  WorkspaceState,
} from './types';

const STORAGE_KEY = 'kanva_pm_state_v1';

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function createSeedState(): WorkspaceState {
  const now = new Date().toISOString();
  const boardId = createId('brd');

  const starterBoard: Board = {
    id: boardId,
    name: 'Product Roadmap',
    description: 'Track upcoming features, active work, and shipped milestones.',
    color: BOARD_COLORS[0],
    createdAt: now,
    updatedAt: now,
    columns: [
      {
        id: createId('col'),
        title: 'To Do',
        color: COLUMN_COLORS[0],
        tickets: [
          {
            id: createId('tkt'),
            title: 'Design onboarding checklist',
            description:
              'Draft a concise first-run experience that highlights boards, columns, and ticket drag-and-drop.',
            priority: 'medium',
            tags: ['design', 'ux'],
            dueDate: '',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: createId('tkt'),
            title: 'Add keyboard shortcuts',
            description:
              'Support Escape to close modals and quick Enter submission on inline forms.',
            priority: 'low',
            tags: ['enhancement'],
            dueDate: '',
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId('col'),
        title: 'In Progress',
        color: COLUMN_COLORS[1],
        tickets: [
          {
            id: createId('tkt'),
            title: 'Build Kanban board workspace',
            description:
              'Implement full CRUD for boards, columns, and tickets stored directly in browser localStorage.',
            priority: 'high',
            tags: ['frontend', 'core'],
            dueDate: '',
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
      {
        id: createId('col'),
        title: 'Done',
        color: COLUMN_COLORS[3],
        tickets: [
          {
            id: createId('tkt'),
            title: 'Set up localStorage persistence',
            description:
              'All changes save automatically to localStorage with zero backend required.',
            priority: 'medium',
            tags: ['storage'],
            dueDate: '',
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    ],
  };

  return {
    boards: [starterBoard],
    activeBoardId: boardId,
  };
}

function loadInitialState(): WorkspaceState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createSeedState();
    }
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    if (!Array.isArray(parsed.boards)) {
      return createSeedState();
    }
    const boards = parsed.boards;
    const validActive =
      parsed.activeBoardId && boards.some((b) => b.id === parsed.activeBoardId)
        ? parsed.activeBoardId
        : boards[0]?.id ?? null;

    return { boards, activeBoardId: validActive };
  } catch {
    return createSeedState();
  }
}

export interface BoardInput {
  name: string;
  description: string;
  color: string;
  withDefaultColumns?: boolean;
}

export interface ColumnInput {
  title: string;
  color: string;
}

export interface TicketInput {
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
  dueDate: string;
}

export function useProjectStore() {
  const [state, setState] = useState<WorkspaceState>(loadInitialState);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors gracefully
    }
  }, [state]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as WorkspaceState;
          if (Array.isArray(parsed.boards)) {
            setState(parsed);
          }
        } catch {
          // Ignore malformed external writes
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const activeBoard =
    state.boards.find((b) => b.id === state.activeBoardId) ??
    state.boards[0] ??
    null;

  // --- Board CRUD ---
  const selectBoard = useCallback((boardId: string) => {
    setState((prev) => ({ ...prev, activeBoardId: boardId }));
  }, []);

  const createBoard = useCallback((input: BoardInput) => {
    const now = new Date().toISOString();
    const id = createId('brd');
    const defaultColumns: Column[] = input.withDefaultColumns
      ? [
          { id: createId('col'), title: 'To Do', color: COLUMN_COLORS[0], tickets: [] },
          { id: createId('col'), title: 'In Progress', color: COLUMN_COLORS[1], tickets: [] },
          { id: createId('col'), title: 'Done', color: COLUMN_COLORS[3], tickets: [] },
        ]
      : [];

    const board: Board = {
      id,
      name: input.name.trim(),
      description: input.description.trim(),
      color: input.color,
      columns: defaultColumns,
      createdAt: now,
      updatedAt: now,
    };

    setState((prev) => ({
      boards: [...prev.boards, board],
      activeBoardId: id,
    }));
    return board;
  }, []);

  const updateBoard = useCallback(
    (boardId: string, updates: Pick<BoardInput, 'name' | 'description' | 'color'>) => {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        boards: prev.boards.map((b) =>
          b.id === boardId
            ? {
                ...b,
                name: updates.name.trim(),
                description: updates.description.trim(),
                color: updates.color,
                updatedAt: now,
              }
            : b
        ),
      }));
    },
    []
  );

  const deleteBoard = useCallback((boardId: string) => {
    setState((prev) => {
      const remaining = prev.boards.filter((b) => b.id !== boardId);
      const nextActive =
        prev.activeBoardId === boardId
          ? remaining[0]?.id ?? null
          : prev.activeBoardId;
      return {
        boards: remaining,
        activeBoardId: nextActive,
      };
    });
  }, []);

  // --- Column CRUD ---
  const createColumn = useCallback((boardId: string, input: ColumnInput) => {
    const now = new Date().toISOString();
    const newCol: Column = {
      id: createId('col'),
      title: input.title.trim(),
      color: input.color,
      tickets: [],
    };
    setState((prev) => ({
      ...prev,
      boards: prev.boards.map((b) =>
        b.id === boardId
          ? { ...b, columns: [...b.columns, newCol], updatedAt: now }
          : b
      ),
    }));
  }, []);

  const updateColumn = useCallback(
    (boardId: string, columnId: string, updates: ColumnInput) => {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        boards: prev.boards.map((b) =>
          b.id === boardId
            ? {
                ...b,
                updatedAt: now,
                columns: b.columns.map((c) =>
                  c.id === columnId
                    ? {
                        ...c,
                        title: updates.title.trim(),
                        color: updates.color,
                      }
                    : c
                ),
              }
            : b
        ),
      }));
    },
    []
  );

  const deleteColumn = useCallback((boardId: string, columnId: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      boards: prev.boards.map((b) =>
        b.id === boardId
          ? {
              ...b,
              updatedAt: now,
              columns: b.columns.filter((c) => c.id !== columnId),
            }
          : b
      ),
    }));
  }, []);

  const moveColumn = useCallback(
    (boardId: string, columnId: string, direction: 'left' | 'right') => {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        boards: prev.boards.map((b) => {
          if (b.id !== boardId) return b;
          const idx = b.columns.findIndex((c) => c.id === columnId);
          if (idx === -1) return b;
          const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
          if (targetIdx < 0 || targetIdx >= b.columns.length) return b;
          const cols = [...b.columns];
          const [moved] = cols.splice(idx, 1);
          cols.splice(targetIdx, 0, moved);
          return { ...b, columns: cols, updatedAt: now };
        }),
      }));
    },
    []
  );

  // --- Ticket CRUD ---
  const createTicket = useCallback(
    (boardId: string, columnId: string, input: TicketInput) => {
      const now = new Date().toISOString();
      const ticket: Ticket = {
        id: createId('tkt'),
        title: input.title.trim(),
        description: input.description.trim(),
        priority: input.priority,
        tags: input.tags,
        dueDate: input.dueDate,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({
        ...prev,
        boards: prev.boards.map((b) =>
          b.id === boardId
            ? {
                ...b,
                updatedAt: now,
                columns: b.columns.map((c) =>
                  c.id === columnId
                    ? { ...c, tickets: [...c.tickets, ticket] }
                    : c
                ),
              }
            : b
        ),
      }));
    },
    []
  );

  const updateTicket = useCallback(
    (
      boardId: string,
      fromColumnId: string,
      ticketId: string,
      updates: TicketInput,
      targetColumnId?: string
    ) => {
      const now = new Date().toISOString();
      const destColumnId = targetColumnId ?? fromColumnId;

      setState((prev) => ({
        ...prev,
        boards: prev.boards.map((b) => {
          if (b.id !== boardId) return b;

          if (destColumnId === fromColumnId) {
            return {
              ...b,
              updatedAt: now,
              columns: b.columns.map((c) =>
                c.id === fromColumnId
                  ? {
                      ...c,
                      tickets: c.tickets.map((t) =>
                        t.id === ticketId
                          ? {
                              ...t,
                              title: updates.title.trim(),
                              description: updates.description.trim(),
                              priority: updates.priority,
                              tags: updates.tags,
                              dueDate: updates.dueDate,
                              updatedAt: now,
                            }
                          : t
                      ),
                    }
                  : c
              ),
            };
          }

          let movedTicket: Ticket | null = null;
          const strippedColumns = b.columns.map((c) => {
            if (c.id !== fromColumnId) return c;
            const found = c.tickets.find((t) => t.id === ticketId);
            if (found) {
              movedTicket = {
                ...found,
                title: updates.title.trim(),
                description: updates.description.trim(),
                priority: updates.priority,
                tags: updates.tags,
                dueDate: updates.dueDate,
                updatedAt: now,
              };
            }
            return {
              ...c,
              tickets: c.tickets.filter((t) => t.id !== ticketId),
            };
          });

          if (!movedTicket) return b;

          const ticketToInsert: Ticket = movedTicket;
          return {
            ...b,
            updatedAt: now,
            columns: strippedColumns.map((c) =>
              c.id === destColumnId
                ? { ...c, tickets: [...c.tickets, ticketToInsert] }
                : c
            ),
          };
        }),
      }));
    },
    []
  );

  const deleteTicket = useCallback(
    (boardId: string, columnId: string, ticketId: string) => {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        boards: prev.boards.map((b) =>
          b.id === boardId
            ? {
                ...b,
                updatedAt: now,
                columns: b.columns.map((c) =>
                  c.id === columnId
                    ? {
                        ...c,
                        tickets: c.tickets.filter((t) => t.id !== ticketId),
                      }
                    : c
                ),
              }
            : b
        ),
      }));
    },
    []
  );

  const moveTicket = useCallback(
    (
      boardId: string,
      sourceColumnId: string,
      ticketId: string,
      targetColumnId: string,
      targetIndex?: number
    ) => {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        boards: prev.boards.map((b) => {
          if (b.id !== boardId) return b;

          const sourceCol = b.columns.find((c) => c.id === sourceColumnId);
          const ticket = sourceCol?.tickets.find((t) => t.id === ticketId);
          if (!ticket) return b;

          const updatedTicket: Ticket = { ...ticket, updatedAt: now };

          return {
            ...b,
            updatedAt: now,
            columns: b.columns.map((c) => {
              // Moving within the same column
              if (c.id === sourceColumnId && c.id === targetColumnId) {
                const without = c.tickets.filter((t) => t.id !== ticketId);
                const idx =
                  targetIndex === undefined
                    ? without.length
                    : Math.max(0, Math.min(targetIndex, without.length));
                without.splice(idx, 0, updatedTicket);
                return { ...c, tickets: without };
              }
              if (c.id === sourceColumnId) {
                return {
                  ...c,
                  tickets: c.tickets.filter((t) => t.id !== ticketId),
                };
              }
              if (c.id === targetColumnId) {
                const nextTickets = [...c.tickets];
                const idx =
                  targetIndex === undefined
                    ? nextTickets.length
                    : Math.max(0, Math.min(targetIndex, nextTickets.length));
                nextTickets.splice(idx, 0, updatedTicket);
                return { ...c, tickets: nextTickets };
              }
              return c;
            }),
          };
        }),
      }));
    },
    []
  );

  return {
    boards: state.boards,
    activeBoard,
    selectBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    createColumn,
    updateColumn,
    deleteColumn,
    moveColumn,
    createTicket,
    updateTicket,
    deleteTicket,
    moveTicket,
  };
}
