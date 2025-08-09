import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  autoHide?: boolean;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
}

interface NotificationActions {
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

type NotificationStore = NotificationState & NotificationActions;

const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: Notification = {
      id,
      autoHide: true,
      duration: 5000,
      ...notification
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }));

    // Auto remove notification
    if (newNotification.autoHide) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [] });
  },

  showSuccess: (message, title = 'Sucesso') => {
    get().addNotification({
      type: 'success',
      title,
      message
    });
  },

  showError: (message, title = 'Erro') => {
    get().addNotification({
      type: 'error',
      title,
      message,
      autoHide: false // Errors should be manually dismissed
    });
  },

  showWarning: (message, title = 'Atenção') => {
    get().addNotification({
      type: 'warning',
      title,
      message,
      duration: 7000
    });
  },

  showInfo: (message, title = 'Informação') => {
    get().addNotification({
      type: 'info',
      title,
      message
    });
  }
}));

export default useNotificationStore;