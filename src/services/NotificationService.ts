import type { AppNotification } from '../types';

const STORAGE_KEY = 'manageme_notifications';

export class NotificationService {
  static getAll(): AppNotification[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static getForUser(userId: string): AppNotification[] {
    return this.getAll().filter(n => n.recipientId === userId);
  }

  static add(notification: Omit<AppNotification, 'id' | 'date' | 'isRead'>): AppNotification {
    const notifications = this.getAll();
    const newNotification: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      isRead: false
    };
    
    const updated = [newNotification, ...notifications];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Wyzwalacz dla okna dialogowego w UI
    window.dispatchEvent(new CustomEvent('app-new-notification', { detail: newNotification }));
    
    return newNotification;
  }

  static markAsRead(id: string) {
    const notifications = this.getAll().map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }

  static markAllAsRead(userId: string) {
    const notifications = this.getAll().map(n => 
      n.recipientId === userId ? { ...n, isRead: true } : n
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }
}