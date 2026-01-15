import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface HistoryEntry {
  id: string;
  jobId: string | null;
  message: string;
  phones: string[];
  phoneNames?: { [phone: string]: string };
  devicesLimit: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  createdAt: string;
  completedAt?: string;
  results?: {
    sent: number;
    failed: number;
    total: number;
    devices_used?: number;
    parallel_workers?: number;
  };
}

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'createdAt'>) => string;
  updateEntry: (id: string, updates: Partial<HistoryEntry>) => void;
  deleteEntry: (id: string) => void;
  pauseEntry: (id: string) => void;
  resumeEntry: (id: string) => void;
  getEntry: (id: string) => HistoryEntry | undefined;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) => {
        const id = `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newEntry: HistoryEntry = {
          ...entry,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          entries: [newEntry, ...state.entries],
        }));
        return id;
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry
          ),
        }));
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }));
      },

      pauseEntry: (id) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, status: 'paused' as const } : entry
          ),
        }));
      },

      resumeEntry: (id) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, status: 'processing' as const } : entry
          ),
        }));
      },

      getEntry: (id) => {
        return get().entries.find((entry) => entry.id === id);
      },

      clearHistory: () => {
        set({ entries: [] });
      },
    }),
    {
      name: 'send-history-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
