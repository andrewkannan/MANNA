import { create } from "zustand";
import { useAuth } from "./useAuth";
import type { VerseStatus } from "../types";

export interface Bookmark {
  id: string;
  verseId: string;
  status: VerseStatus;
  dueDate: number;
  lastReviewed: number | null;
  difficulty: number;
  streak: number;
  tamilExplanation: string;
  personalNotes: string;
  themes: string[];
  categoryId: string | null;
  imageUrl?: string;
  verse: {
    id: string;
    reference: string;
    text: string;
    book: string;
    chapter: number;
    verse: number;
    version: string;
  };
}

interface DataState {
  bookmarks: Bookmark[];
  loading: boolean;
  fetchBookmarks: () => Promise<void>;
  addBookmark: (verseData: any) => Promise<void>;
  updateBookmark: (id: string, data: Partial<Bookmark>) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
}

export const useData = create<DataState>((set, get) => ({
  bookmarks: [],
  loading: false,
  
  fetchBookmarks: async () => {
    const { token } = useAuth.getState();
    if (!token) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/bookmarks", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ bookmarks: data });
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ loading: false });
    }
  },

  addBookmark: async (verseData) => {
    const { token } = useAuth.getState();
    if (!token) return;
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(verseData)
      });
      if (res.ok) {
        const newBm = await res.json();
        set(state => ({ bookmarks: [...state.bookmarks, newBm] }));
      }
    } catch (e) {
      console.error(e);
    }
  },

  updateBookmark: async (id, data) => {
    const { token } = useAuth.getState();
    if (!token) return;
    try {
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated = await res.json();
        set(state => ({
          bookmarks: state.bookmarks.map(b => b.id === id ? updated : b)
        }));
      }
    } catch (e) {
      console.error(e);
    }
  },

  deleteBookmark: async (id) => {
    const { token } = useAuth.getState();
    if (!token) return;
    try {
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        set(state => ({
          bookmarks: state.bookmarks.filter(b => b.id !== id)
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }
}));

