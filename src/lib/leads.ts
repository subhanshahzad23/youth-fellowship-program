"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Simulated lead capture for the concept site. Nothing leaves the browser:
 * submissions are kept in localStorage so confirmations survive a refresh.
 */

export interface Booking {
  id: string;
  startISO: string; // UTC instant
  timezone: string;
  name: string;
  email: string;
  firm: string;
  firmSize: string;
  casesPerMonth: string;
  visas: string[];
  notes: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  firm?: string;
  topic: string;
  message: string;
  marketing: boolean;
  createdAt: string;
}

interface LeadsState {
  bookings: Booking[];
  messages: ContactMessage[];
  newsletter: { email: string; createdAt: string }[];
  addBooking: (b: Omit<Booking, "id" | "createdAt">) => Booking;
  cancelBooking: (id: string) => void;
  addMessage: (m: Omit<ContactMessage, "id" | "createdAt">) => ContactMessage;
  subscribe: (email: string) => { duplicate: boolean };
  reset: () => void;
}

const id = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

const safeStorage = createJSONStorage(() => {
  try {
    const k = "__gc_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch {
    const mem = new Map<string, string>();
    return { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) } as Storage;
  }
});

export const useLeads = create<LeadsState>()(
  persist(
    (set, get) => ({
      bookings: [],
      messages: [],
      newsletter: [],
      addBooking: (b) => {
        const booking: Booking = { ...b, id: id("bk"), createdAt: new Date().toISOString() };
        set({ bookings: [booking, ...get().bookings] });
        return booking;
      },
      cancelBooking: (bid) => set({ bookings: get().bookings.filter((b) => b.id !== bid) }),
      addMessage: (m) => {
        const msg: ContactMessage = { ...m, id: id("msg"), createdAt: new Date().toISOString() };
        set({ messages: [msg, ...get().messages] });
        return msg;
      },
      subscribe: (email) => {
        const e = email.trim().toLowerCase();
        if (get().newsletter.some((n) => n.email === e)) return { duplicate: true };
        set({ newsletter: [...get().newsletter, { email: e, createdAt: new Date().toISOString() }] });
        return { duplicate: false };
      },
      reset: () => set({ bookings: [], messages: [], newsletter: [] }),
    }),
    { name: "goodcase-concept-leads", storage: safeStorage, skipHydration: true, version: 1 },
  ),
);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
