import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppNotification, NotificationType } from '@/types';
import { getInitialSeed, zustandStorage } from './storage';

interface NotificationsState {
  notifications: AppNotification[];
  hasHydrated: boolean;
  setHydrated: () => void;
  push: (input: {
    type: NotificationType;
    title: string;
    body: string;
    cardId?: string;
    gameId?: string;
  }) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  reset: (notifications: AppNotification[]) => void;
}

let notificationCounter = 0;

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: getInitialSeed().notifications,
      hasHydrated: false,
      setHydrated: () => set({ hasHydrated: true }),

      push: (input) =>
        set((state) => {
          notificationCounter += 1;
          const notification: AppNotification = {
            id: `ntf_${Date.now().toString(36)}_${notificationCounter}`,
            createdAt: new Date().toISOString(),
            read: false,
            ...input,
          };
          return { notifications: [notification, ...state.notifications].slice(0, 50) };
        }),

      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      reset: (notifications) => set({ notifications }),
    }),
    {
      name: 'relay/notifications',
      storage: zustandStorage,
      partialize: (state) => ({ notifications: state.notifications }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

export function selectUnreadCount(state: NotificationsState): number {
  return state.notifications.filter((n) => !n.read).length;
}
