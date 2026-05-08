import type { AppNotification } from '../types';
import { readCollection, writeCollection } from './storageEngine';

const STORAGE_KEY = 'manageme_notifications';
const COLLECTION = 'notifications';

const byNewestDate = (left: AppNotification, right: AppNotification) =>
  new Date(right.date).getTime() - new Date(left.date).getTime();

export class NotificationService {
  static async fetchAll(): Promise<AppNotification[]> {
    const data = await readCollection<AppNotification>(STORAGE_KEY, COLLECTION);
    return data.sort(byNewestDate);
  }

  static async getForUser(userId: string): Promise<AppNotification[]> {
    const notifications = await this.fetchAll();
    return notifications.filter(n => n.recipientId === userId);
  }

  static async add(notification: Omit<AppNotification, 'id' | 'date' | 'isRead'>): Promise<AppNotification> {
    const notifications = await this.fetchAll();
    const newNotification: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      isRead: false
    };

    const updated = [newNotification, ...notifications];
    await writeCollection<AppNotification>(STORAGE_KEY, COLLECTION, updated);

    window.dispatchEvent(new CustomEvent('app-new-notification', { detail: newNotification }));

    return newNotification;
  }

  static async markAsRead(id: string): Promise<void> {
    const notifications = (await this.fetchAll()).map(n =>
      n.id === id ? { ...n, isRead: true } : n
    );
    await writeCollection<AppNotification>(STORAGE_KEY, COLLECTION, notifications);
  }

  static async markAllAsRead(userId: string): Promise<void> {
    const notifications = (await this.fetchAll()).map(n =>
      n.recipientId === userId ? { ...n, isRead: true } : n
    );
    await writeCollection<AppNotification>(STORAGE_KEY, COLLECTION, notifications);
  }
}
